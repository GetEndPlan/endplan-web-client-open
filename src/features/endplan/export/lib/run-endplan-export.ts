import { downloadZip } from 'client-zip'
import {
  decryptAssetAttachmentName,
  decryptPolicyAttachmentName,
  decryptDocumentName,
  unwrapDekWithKeyPair,
} from '@/shared/lib'
import i18n from '@/shared/lib/i18n'
import type { ContactRole } from '../../model/contacts'
import {
  vaultAssetsApi,
  vaultPoliciesApi,
  vaultContactsApi,
  vaultDocumentsApi,
  vaultInstructionsApi,
  vaultSectionApi,
  type VaultAssetAttachment,
  type VaultDocumentFile,
  type VaultDocumentFolder,
  type VaultResponse,
} from '../../api/clients/vault-api'
import { decryptVaultAssetAttachmentToBlob } from '../../lib/decrypt-vault-asset-attachment-blob'
import { decryptVaultDocumentToBlob } from '../../lib/decrypt-vault-document-blob'
import {
  emptyContactsPayload,
  normalizeContactsPayload,
  type ContactItem,
  type ContactsSectionPayload,
} from '../../model/contacts'
import { emptyInstructionsPayload, normalizeInstructionsPayload } from '../../model/instructions'
import { normalizeAssetPayload, type AssetSectionPayloadV2 } from '../../model/asset-table-model'
import type { AssetContactOption } from '../../model/asset-contact-ref'
import { SECTION_ID } from '../../model/vault-section-types'
import {
  buildFolderByIdMap,
  collectSubtreeFolderIds,
  flattenFoldersFromParentMap,
  ROOT_FOLDER_KEY,
  type FoldersByParent,
} from '../../model/vault-documents-tree'
import { buildAssetCsvFiles } from '../model/assets-csv'
import { buildPolicyCsvFiles } from '../model/policies-csv'
import { buildContactsCsv } from '../model/contacts-csv'
import { buildExportNotesFile } from '../model/export-notes'
import { buildInstructionsTxt } from '../model/instructions-txt'
import { buildEndplanOverviewModel } from '../model/overview-document'
import type { EndplanExportProgress } from '../model/export-job-types'
import { joinZipPath, sanitizeZipSegment, uniqueZipPath } from '../model/zip-path'
import { buildEndplanOverviewPdf } from './build-overview-pdf'
import { decryptVaultSectionJson } from './decrypt-section-payload'
import { getOptionalResource, isAbortError, throwIfAborted } from './export-errors'
import { triggerBlobDownload } from './trigger-blob-download'

type NamedFolder = VaultDocumentFolder & { name: string }
type NamedFile = VaultDocumentFile & { name: string }
type NamedAttachment = VaultAssetAttachment & { name: string }

export type RunEndplanExportInput = {
  vault: Pick<VaultResponse, 'id' | 'ownerId' | 'wrappedDek'>
  publicKeyB64: string
  privateKeyB64: string
  pqPrivateKeyB64?: string | null
  ownerName: string
  signal: AbortSignal
  onProgress: (progress: EndplanExportProgress) => void
}

function t(key: string, options?: Record<string, string | number>): string {
  return i18n.t(key, options)
}

function contactRoleLabels(): Record<ContactRole, string> {
  return {
    lawyer: t('vault.contacts.roles.lawyer'),
    doctor: t('vault.contacts.roles.doctor'),
    financial_manager: t('vault.contacts.roles.financial_manager'),
    power_of_attorney: t('vault.contacts.roles.power_of_attorney'),
    other: t('vault.contacts.roles.other'),
  }
}

async function decryptNameOrFallback(
  decrypt: () => Promise<string>,
  fallback: string,
): Promise<string> {
  try {
    const name = (await decrypt()).trim()
    return name || fallback
  } catch {
    return fallback
  }
}

function folderPathSegments(
  folderId: string | null | undefined,
  folderById: Map<string, NamedFolder>,
  untitledFolder: string,
): string[] {
  if (!folderId) return []
  const labels: string[] = []
  const visited = new Set<string>()
  let current: NamedFolder | undefined = folderById.get(folderId)
  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    labels.push(sanitizeZipSegment(current.name, untitledFolder))
    current = current.parentFolderId ? folderById.get(current.parentFolderId) : undefined
  }
  return labels.reverse()
}

function buildFoldersByParent(folders: NamedFolder[]): FoldersByParent<NamedFolder> {
  const grouped: FoldersByParent<NamedFolder> = {}
  for (const folder of folders) {
    const parentKey = folder.parentFolderId ?? ROOT_FOLDER_KEY
    const siblings = grouped[parentKey] ?? []
    siblings.push(folder)
    grouped[parentKey] = siblings
  }
  return grouped
}

export async function runEndplanExport(input: RunEndplanExportInput): Promise<void> {
  const { vault, signal, onProgress } = input
  throwIfAborted(signal)
  onProgress({ stage: 'preparing', completedUnits: 0, totalUnits: 1 })

  const dek = await unwrapDekWithKeyPair(
    vault.wrappedDek,
    input.publicKeyB64,
    input.privateKeyB64,
    input.pqPrivateKeyB64,
    { vaultId: vault.id },
  )
  if (!dek) {
    throw new Error('Encryption keys not available')
  }
  throwIfAborted(signal)

  const getDek = async () => dek

  const [sectionsResult, contactsSection, instructionsSection, assetsSchema, attachmentsResult, documentsTree] =
    await Promise.all([
      vaultSectionApi.list(vault.id),
      getOptionalResource(() => vaultContactsApi.get(vault.id)),
      getOptionalResource(() => vaultInstructionsApi.get(vault.id)),
      vaultAssetsApi.getSchema(vault.id),
      getOptionalResource(() => vaultAssetsApi.listAttachments(vault.id)),
      vaultDocumentsApi.getTree(vault.id),
    ])
  const [policiesSchema, policyAttachmentsResult] = await Promise.all([
    getOptionalResource(() => vaultPoliciesApi.getSchema(vault.id)),
    getOptionalResource(() => vaultPoliciesApi.listAttachments(vault.id)),
  ])
  throwIfAborted(signal)

  const assetsSection =
    sectionsResult.sections.find((section) => section.sectionType === SECTION_ID.ASSETS) ?? null
  const policiesSection =
    sectionsResult.sections.find((section) => section.sectionType === SECTION_ID.POLICIES) ?? null
  const attachments = (attachmentsResult?.attachments ?? []).filter((item) => item.isUploaded)
  const documentFiles = documentsTree.files.filter((file) => file.isUploaded)
  const documentFolders = documentsTree.folders

  const untitledFolder = t('settings.export.untitledFolder')
  const untitledFile = t('settings.export.untitledFile')

  const namedFolders: NamedFolder[] = await Promise.all(
    documentFolders.map(async (folder) => ({
      ...folder,
      name: await decryptNameOrFallback(
        () => decryptDocumentName(folder.encryptedName, folder.nameIv, dek, vault.id, vault.ownerId),
        untitledFolder,
      ),
    })),
  )
  const namedFiles: NamedFile[] = await Promise.all(
    documentFiles.map(async (file) => ({
      ...file,
      name: await decryptNameOrFallback(
        () => decryptDocumentName(file.encryptedName, file.nameIv, dek, vault.id, vault.ownerId),
        untitledFile,
      ),
    })),
  )
  const namedAttachments: NamedAttachment[] = await Promise.all(
    attachments.map(async (attachment) => ({
      ...attachment,
      name: await decryptNameOrFallback(
        () =>
          decryptAssetAttachmentName(attachment.encryptedName, attachment.nameIv, dek, vault.id, vault.ownerId),
        untitledFile,
      ),
    })),
  )
  const namedPolicyAttachments: NamedAttachment[] = await Promise.all(
    (policyAttachmentsResult?.attachments ?? [])
      .filter((item) => item.isUploaded)
      .map(async (attachment) => ({
        ...attachment,
        name: await decryptNameOrFallback(
          () =>
            decryptPolicyAttachmentName(attachment.encryptedName, attachment.nameIv, dek, vault.id, vault.ownerId),
          untitledFile,
        ),
      })),
  )
  let assetsPayload: AssetSectionPayloadV2 = { schemaVersion: 2, categories: [] }
  if (assetsSection?.encryptionIv) {
    try {
      const decoded = await decryptVaultSectionJson<unknown>({
        section: assetsSection,
        dek,
        vaultId: vault.id,
        ownerId: vault.ownerId,
        sectionType: SECTION_ID.ASSETS,
      })
      assetsPayload = normalizeAssetPayload(decoded, assetsSchema.categories)
    } catch {
      assetsPayload = { schemaVersion: 2, categories: [] }
    }
  }

  let policiesPayload: AssetSectionPayloadV2 = { schemaVersion: 2, categories: [] }
  if (policiesSection?.encryptionIv) {
    try {
      const decoded = await decryptVaultSectionJson<unknown>({
        section: policiesSection,
        dek,
        vaultId: vault.id,
        ownerId: vault.ownerId,
        sectionType: SECTION_ID.POLICIES,
      })
      policiesPayload = normalizeAssetPayload(decoded, policiesSchema?.categories ?? [])
    } catch {
      policiesPayload = { schemaVersion: 2, categories: [] }
    }
  }

  let contactsPayload: ContactsSectionPayload = emptyContactsPayload()
  if (contactsSection?.encryptionIv) {
    try {
      const decoded = await decryptVaultSectionJson<unknown>({
        section: contactsSection,
        dek,
        vaultId: vault.id,
        ownerId: vault.ownerId,
        sectionType: SECTION_ID.CONTACTS,
      })
      contactsPayload = normalizeContactsPayload(decoded)
    } catch {
      contactsPayload = emptyContactsPayload()
    }
  }

  let instructionsPayload = emptyInstructionsPayload()
  if (instructionsSection?.encryptionIv) {
    try {
      const decoded = await decryptVaultSectionJson<unknown>({
        section: instructionsSection,
        dek,
        vaultId: vault.id,
        ownerId: vault.ownerId,
        sectionType: SECTION_ID.INSTRUCTIONS,
      })
      instructionsPayload = normalizeInstructionsPayload(decoded)
    } catch {
      instructionsPayload = emptyInstructionsPayload()
    }
  }

  const contactsById: Record<string, ContactItem> = Object.fromEntries(
    contactsPayload.items.map((item) => [item.id, item]),
  )
  const contactOptionsById: Record<string, AssetContactOption> = Object.fromEntries(
    contactsPayload.items.map((item) => [
      item.id,
      { id: item.id, label: item.fullName, subtitle: '' },
    ]),
  )
  const documentNamesById: Record<string, string> = Object.fromEntries(
    namedFiles.map((file) => [file.id, file.name]),
  )
  const attachmentNamesById: Record<string, string> = Object.fromEntries(
    namedAttachments.map((attachment) => [attachment.id, attachment.name]),
  )
  const policyAttachmentNamesById: Record<string, string> = Object.fromEntries(
    namedPolicyAttachments.map((attachment) => [attachment.id, attachment.name]),
  )

  const skippedNotReadyCount =
    documentsTree.files.filter((file) => !file.isUploaded).length +
    (attachmentsResult?.attachments ?? []).filter((item) => !item.isUploaded).length

  const totalUnits = 6 + namedFiles.length + namedAttachments.length
  let completedUnits = 0
  const report = (progress: Omit<EndplanExportProgress, 'completedUnits' | 'totalUnits'>) => {
    onProgress({ ...progress, completedUnits, totalUnits })
  }
  const completeStage = (progress: Omit<EndplanExportProgress, 'completedUnits' | 'totalUnits'>) => {
    completedUnits += 1
    onProgress({ ...progress, completedUnits, totalUnits })
  }

  const rootName = sanitizeZipSegment(t('settings.export.zipFolderName'), 'My EndPlan')
  const usedPaths = new Set<string>()
  const takePath = (parts: string[], isDirectory = false): string => {
    const joined = joinZipPath([rootName, ...parts])
    return uniqueZipPath(isDirectory ? `${joined}/` : joined, usedPaths)
  }

  const noteLines = [
    t('settings.export.notes.title'),
    t('settings.export.notes.generatedAt', { date: new Date().toISOString() }),
  ]
  if (skippedNotReadyCount > 0) {
    noteLines.push(t('settings.export.notes.skippedNotReady', { count: skippedNotReadyCount }))
  }

  const folderByIdForOverview = buildFolderByIdMap(namedFolders)
  const documentPathLabels = namedFiles
    .map((file) =>
      [...folderPathSegments(file.folderId, folderByIdForOverview, untitledFolder), file.name].join(' / '),
    )
    .sort((left, right) => left.localeCompare(right))

  async function* zipEntries() {
    report({ stage: 'overview' })
    try {
      const generatedAtLabel = new Date().toLocaleString(i18n.language || 'en', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
      const ownerName = input.ownerName.trim()
      const overviewModel = buildEndplanOverviewModel({
        ownerName,
        generatedAtLabel,
        contacts: contactsPayload.items,
        roleLabels: contactRoleLabels(),
        instructions: instructionsPayload,
        assetsPayload,
        assetCategories: assetsSchema.categories,
        contactsById: contactOptionsById,
        attachmentNamesById,
        documentNamesById,
        documentPathLabels,
        copy: {
          untitledInstruction: t('settings.export.untitledInstruction'),
          untitledAsset: t('settings.export.untitledAsset'),
          untitledContact: t('settings.export.untitledContact'),
          untitledDocument: t('settings.export.untitledFile'),
          untitledCategory: t('settings.export.untitledCategory'),
          writtenNoteType: t('settings.export.instructionWrittenType'),
          stepByStepType: t('settings.export.instructionStepType'),
          relatedContact: t('settings.export.instructionRelatedContact'),
          relatedDocument: t('settings.export.instructionRelatedDocument'),
          relatedAssets: t('settings.export.instructionRelatedAssets'),
        },
      })
      const overviewPdf = await buildEndplanOverviewPdf(overviewModel, {
        title: t('settings.export.overview.title'),
        preparedFor: ownerName ? t('settings.export.overview.preparedFor', { name: ownerName }) : '',
        generatedAt: t('settings.export.overview.generatedAt', { date: generatedAtLabel }),
        purpose: t('settings.export.overview.purpose'),
        howToUseTitle: t('settings.export.overview.howToUseTitle'),
        howToUseBody: t('settings.export.overview.howToUseBody'),
        countsLine: t('settings.export.overview.countsLine', {
          contacts: overviewModel.contacts.length,
          instructions: overviewModel.instructions.length,
          assets: overviewModel.assets.length,
          documents: overviewModel.documents.length,
        }),
        startHereTitle: t('settings.export.overview.startHereTitle'),
        startHereEmpty: t('settings.export.overview.startHereEmpty'),
        peopleTitle: t('settings.export.overview.peopleTitle'),
        peopleEmpty: t('settings.export.overview.peopleEmpty'),
        instructionsTitle: t('settings.export.overview.instructionsTitle'),
        instructionsEmpty: t('settings.export.overview.instructionsEmpty'),
        assetsTitle: t('settings.export.overview.assetsTitle'),
        assetsEmpty: t('settings.export.overview.assetsEmpty'),
        assetsHint: t('settings.export.overview.assetsHint'),
        documentsTitle: t('settings.export.overview.documentsTitle'),
        documentsEmpty: t('settings.export.overview.documentsEmpty'),
        documentsHint: t('settings.export.overview.documentsHint'),
        footer: t('settings.export.overview.footer'),
        phoneLabel: t('vault.contacts.fields.phone'),
        emailLabel: t('vault.contacts.fields.email'),
        notesLabel: t('settings.export.contactsNotesHeader'),
        institutionLabel: t('settings.export.overview.institutionLabel'),
        relatedLabel: t('settings.export.instructionRelatedHeading'),
      })
      yield {
        name: takePath([t('settings.export.files.overview')]),
        input: overviewPdf,
      }
    } catch {
      noteLines.push(t('settings.export.notes.overviewFailed'))
    }
    completeStage({ stage: 'overview' })
    throwIfAborted(signal)

    report({ stage: 'assets' })
    const assetFiles = buildAssetCsvFiles({
      payload: assetsPayload,
      categories: assetsSchema.categories,
      assetsFolderName: t('settings.export.files.assetsFolder'),
      untitledCategoryName: t('settings.export.untitledCategory'),
      contactsById: contactOptionsById,
      attachmentNamesById,
      documentNamesById,
    })
    for (const file of assetFiles) {
      yield { name: takePath(file.relativePath.split('/')), input: file.csv }
    }
    completeStage({ stage: 'assets' })
    throwIfAborted(signal)

    report({ stage: 'policies' })
    const policyFiles = buildPolicyCsvFiles({
      payload: policiesPayload,
      categories: policiesSchema?.categories ?? [],
      assetsFolderName: t('settings.export.files.policiesFolder'),
      untitledCategoryName: t('settings.export.untitledCategory'),
      contactsById: contactOptionsById,
      attachmentNamesById: policyAttachmentNamesById,
      documentNamesById,
    })
    for (const file of policyFiles) {
      yield { name: takePath(file.relativePath.split('/')), input: file.csv }
    }
    completeStage({ stage: 'policies' })
    throwIfAborted(signal)

    report({ stage: 'contacts' })
    yield {
      name: takePath([t('settings.export.files.contacts')]),
      input: buildContactsCsv({
        items: contactsPayload.items,
        headers: {
          fullName: t('vault.contacts.fields.name'),
          role: t('vault.contacts.fields.role'),
          phone: t('vault.contacts.fields.phone'),
          email: t('vault.contacts.fields.email'),
          notes: t('settings.export.contactsNotesHeader'),
        },
        roleLabels: contactRoleLabels(),
      }),
    }
    completeStage({ stage: 'contacts' })
    throwIfAborted(signal)

    report({ stage: 'instructions' })
    const instructionsText = buildInstructionsTxt({
      payload: instructionsPayload,
      copy: {
        untitledInstruction: t('settings.export.untitledInstruction'),
        untitledAsset: t('settings.export.untitledAsset'),
        untitledContact: t('settings.export.untitledContact'),
        untitledDocument: t('settings.export.untitledFile'),
        writtenNoteType: t('settings.export.instructionWrittenType'),
        stepByStepType: t('settings.export.instructionStepType'),
        relatedHeading: t('settings.export.instructionRelatedHeading'),
        relatedContact: t('settings.export.instructionRelatedContact'),
        relatedDocument: t('settings.export.instructionRelatedDocument'),
        relatedAssets: t('settings.export.instructionRelatedAssets'),
      },
      contactsById,
      documentNamesById,
      assetsPayload,
    })
    yield {
      name: takePath([t('settings.export.files.instructions')]),
      input: instructionsText || `${t('settings.export.notes.emptyInstructions')}\n`,
    }
    completeStage({ stage: 'instructions' })
    throwIfAborted(signal)

    const foldersByParent = buildFoldersByParent(namedFolders)
    const documentsFolder = t('settings.export.files.documentsFolder')

    for (const [fileIndex, file] of namedFiles.entries()) {
      throwIfAborted(signal)
      report({
        stage: 'documents',
        itemIndex: fileIndex + 1,
        itemCount: namedFiles.length,
      })
      const segments = [
        documentsFolder,
        ...folderPathSegments(file.folderId, folderByIdForOverview, untitledFolder),
        sanitizeZipSegment(file.name, untitledFile),
      ]
      const zipPath = takePath(segments)
      try {
        const blob = await decryptVaultDocumentToBlob({
          vault,
          file,
          getDek,
          signal,
        })
        yield { name: zipPath, input: blob }
      } catch (error) {
        if (isAbortError(error)) throw error
        noteLines.push(t('settings.export.notes.skippedDocumentFailed', { name: file.name }))
      }
      completedUnits += 1
      onProgress({
        stage: 'documents',
        completedUnits,
        totalUnits,
        itemIndex: fileIndex + 1,
        itemCount: namedFiles.length,
      })
    }

    const filesByFolderId = new Set(namedFiles.map((file) => file.folderId).filter((id): id is string => !!id))
    for (const folder of flattenFoldersFromParentMap(foldersByParent)) {
      const subtreeIds = collectSubtreeFolderIds(folder.id, foldersByParent)
      const hasFile = subtreeIds.some((id) => filesByFolderId.has(id))
      if (hasFile) continue
      const segments = [documentsFolder, ...folderPathSegments(folder.id, folderByIdForOverview, untitledFolder)]
      yield { name: takePath(segments, true) }
    }

    const attachmentsFolder = t('settings.export.files.attachmentsFolder')
    for (const [attachmentIndex, attachment] of namedAttachments.entries()) {
      throwIfAborted(signal)
      report({
        stage: 'attachments',
        itemIndex: attachmentIndex + 1,
        itemCount: namedAttachments.length,
      })
      const zipPath = takePath([attachmentsFolder, sanitizeZipSegment(attachment.name, untitledFile)])
      try {
        const blob = await decryptVaultAssetAttachmentToBlob({
          vault,
          file: attachment,
          getDek,
          signal,
        })
        yield { name: zipPath, input: blob }
      } catch (error) {
        if (isAbortError(error)) throw error
        noteLines.push(t('settings.export.notes.skippedAttachmentFailed', { name: attachment.name }))
      }
      completedUnits += 1
      onProgress({
        stage: 'attachments',
        completedUnits,
        totalUnits,
        itemIndex: attachmentIndex + 1,
        itemCount: namedAttachments.length,
      })
    }

    report({ stage: 'packaging' })
    yield {
      name: takePath([t('settings.export.files.notes')]),
      input: buildExportNotesFile(noteLines),
    }
    completeStage({ stage: 'packaging' })
  }

  const zipBlob = await downloadZip(zipEntries()).blob()
  throwIfAborted(signal)
  triggerBlobDownload(zipBlob, t('settings.export.zipDownloadName'))
}
