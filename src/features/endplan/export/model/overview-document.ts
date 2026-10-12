import type { AssetSchemaCategory } from '../../api/clients/vault-api'
import { parseAssetAttachmentCellValue } from '../../model/asset-attachment-ref'
import { ASSET_PASSWORD_FIELD_TYPE } from '../../model/asset-attachment-ref'
import {
  resolveAssetContactCellLabel,
  type AssetContactOption,
} from '../../model/asset-contact-ref'
import { assetRowHasUserInput, type AssetSectionPayloadV2 } from '../../model/asset-table-model'
import {
  contactRoleDisplayLabel,
  type ContactItem,
  type ContactRole,
} from '../../model/contacts'
import type { InstructionItem, InstructionsSectionPayload } from '../../model/instructions'
import { ASSET_NAME_FIELD_KEY } from '../../model/net-worth'

export const OVERVIEW_PRIORITY_CONTACT_ROLES: readonly ContactRole[] = [
  'power_of_attorney',
  'lawyer',
  'financial_manager',
  'doctor',
] as const

export type OverviewContact = {
  fullName: string
  roleLabel: string
  phone: string
  email: string
  notes: string
}

export type OverviewInstruction = {
  title: string
  typeLabel: string
  bodyLines: string[]
  relatedLines: string[]
}

export type OverviewAssetRow = {
  categoryName: string
  name: string
  institution: string
  notes: string
  relatedPeople: string[]
  relatedFiles: string[]
}

export type OverviewDocumentRow = {
  pathLabel: string
}

export type EndplanOverviewModel = {
  ownerName: string
  generatedAtLabel: string
  startHereContacts: OverviewContact[]
  contacts: OverviewContact[]
  instructions: OverviewInstruction[]
  assets: OverviewAssetRow[]
  documents: OverviewDocumentRow[]
}

export type EndplanOverviewCopy = {
  untitledInstruction: string
  untitledAsset: string
  untitledContact: string
  untitledDocument: string
  untitledCategory: string
  writtenNoteType: string
  stepByStepType: string
  relatedContact: string
  relatedDocument: string
  relatedAssets: string
}

function mapContact(item: ContactItem, roleLabels: Record<ContactRole, string>): OverviewContact {
  return {
    fullName: item.fullName,
    roleLabel: contactRoleDisplayLabel(item, roleLabels),
    phone: item.phone.trim(),
    email: item.email.trim(),
    notes: item.notes.trim(),
  }
}

function compareByName(left: OverviewContact, right: OverviewContact): number {
  return left.fullName.localeCompare(right.fullName)
}

function assetRowLabel(payload: AssetSectionPayloadV2, assetId: string, fallback: string): string {
  for (const category of payload.categories) {
    const row = category.rows.find((item) => item.id === assetId)
    if (!row) continue
    const fromFields = row.values[ASSET_NAME_FIELD_KEY]?.trim() || row.values.name?.trim()
    if (fromFields) return fromFields
    return fallback
  }
  return fallback
}

function formatInstruction(args: {
  instruction: InstructionItem
  copy: EndplanOverviewCopy
  contactsById: Record<string, Pick<ContactItem, 'fullName'>>
  documentNamesById: Record<string, string>
  assetsPayload: AssetSectionPayloadV2
}): OverviewInstruction {
  const title = args.instruction.title.trim() || args.copy.untitledInstruction
  const typeLabel =
    args.instruction.instructionType === 'step_by_step' ? args.copy.stepByStepType : args.copy.writtenNoteType
  const bodyLines: string[] = []

  if (args.instruction.instructionType === 'step_by_step') {
    args.instruction.steps.forEach((step, stepIndex) => {
      const stepTitle = step.title.trim()
      const stepText = step.text.trim()
      if (stepTitle && stepText) {
        bodyLines.push(`${stepIndex + 1}. ${stepTitle}`)
        bodyLines.push(stepText)
      } else {
        bodyLines.push(`${stepIndex + 1}. ${stepTitle || stepText}`)
      }
    })
  } else if (args.instruction.noteBody.trim()) {
    bodyLines.push(args.instruction.noteBody.trim())
  }

  const relatedLines: string[] = []
  if (args.instruction.linkedContactId) {
    const contactName =
      args.contactsById[args.instruction.linkedContactId]?.fullName.trim() || args.copy.untitledContact
    relatedLines.push(`${args.copy.relatedContact}: ${contactName}`)
  }
  if (args.instruction.attachedDocumentId) {
    const documentName =
      args.documentNamesById[args.instruction.attachedDocumentId] || args.copy.untitledDocument
    relatedLines.push(`${args.copy.relatedDocument}: ${documentName}`)
  }
  if (args.instruction.linkedAssetIds.length > 0) {
    const labels = args.instruction.linkedAssetIds.map((assetId) =>
      assetRowLabel(args.assetsPayload, assetId, args.copy.untitledAsset),
    )
    relatedLines.push(`${args.copy.relatedAssets}: ${labels.join(', ')}`)
  }

  return { title, typeLabel, bodyLines, relatedLines }
}

function isSecretAssetField(field: { key: string; fieldType: string }): boolean {
  if (field.fieldType === ASSET_PASSWORD_FIELD_TYPE) return true
  return /account|policy|routing|iban|swift|pin|password|secret|cvv/i.test(field.key)
}

function buildAssetRows(args: {
  payload: AssetSectionPayloadV2
  categories: AssetSchemaCategory[]
  untitledCategoryName: string
  untitledAssetName: string
  contactsById: Record<string, AssetContactOption>
  attachmentNamesById: Record<string, string>
  documentNamesById: Record<string, string>
}): OverviewAssetRow[] {
  const categoriesById = new Map(args.categories.map((category) => [category.id, category]))
  const rows: OverviewAssetRow[] = []

  for (const payloadCategory of args.payload.categories) {
    const schemaCategory = categoriesById.get(payloadCategory.categoryTemplateId)
    const filledRows = payloadCategory.rows.filter((row) => assetRowHasUserInput(row))
    if (filledRows.length === 0) continue

    const categoryName =
      payloadCategory.categoryName?.trim() || schemaCategory?.name.trim() || args.untitledCategoryName
    const fields = [...(schemaCategory?.fields ?? [])].sort((left, right) => left.displayOrder - right.displayOrder)

    for (const row of filledRows) {
      const name =
        row.values[ASSET_NAME_FIELD_KEY]?.trim() ||
        row.values.name?.trim() ||
        args.untitledAssetName
      const institution = row.values.institution?.trim() ?? ''
      const notes = row.values.notes?.trim() ?? ''

      const relatedPeople: string[] = []
      const relatedFiles: string[] = []
      for (const field of fields) {
        if (isSecretAssetField(field)) continue
        const rawValue = row.values[field.key] ?? ''
        if (field.fieldType === 'contact') {
          const label = resolveAssetContactCellLabel(rawValue, args.contactsById)
          if (label) relatedPeople.push(label)
          continue
        }
        if (field.fieldType === 'attachment') {
          const parsed = parseAssetAttachmentCellValue(rawValue)
          if (parsed.kind === 'document_link') {
            const fileName =
              parsed.reference.fileName?.trim() || args.documentNamesById[parsed.reference.fileId] || ''
            if (fileName) relatedFiles.push(fileName)
          } else if (parsed.kind === 'asset_attachment') {
            const fileName = args.attachmentNamesById[parsed.attachmentId]
            if (fileName) relatedFiles.push(fileName)
          }
        }
      }

      rows.push({
        categoryName,
        name,
        institution,
        notes,
        relatedPeople,
        relatedFiles,
      })
    }
  }

  return rows
}

export function buildEndplanOverviewModel(args: {
  ownerName: string
  generatedAtLabel: string
  contacts: ContactItem[]
  roleLabels: Record<ContactRole, string>
  instructions: InstructionsSectionPayload
  assetsPayload: AssetSectionPayloadV2
  assetCategories: AssetSchemaCategory[]
  contactsById: Record<string, AssetContactOption>
  attachmentNamesById: Record<string, string>
  documentNamesById: Record<string, string>
  documentPathLabels: string[]
  copy: EndplanOverviewCopy
}): EndplanOverviewModel {
  const mappedContacts = args.contacts.map((item) => mapContact(item, args.roleLabels))
  const startHereContacts = OVERVIEW_PRIORITY_CONTACT_ROLES.flatMap((role) =>
    args.contacts
      .filter((item) => item.role === role)
      .map((item) => mapContact(item, args.roleLabels))
      .sort(compareByName),
  )

  return {
    ownerName: args.ownerName.trim(),
    generatedAtLabel: args.generatedAtLabel,
    startHereContacts,
    contacts: [...mappedContacts].sort(compareByName),
    instructions: args.instructions.items.map((instruction) =>
      formatInstruction({
        instruction,
        copy: args.copy,
        contactsById: Object.fromEntries(args.contacts.map((item) => [item.id, item])),
        documentNamesById: args.documentNamesById,
        assetsPayload: args.assetsPayload,
      }),
    ),
    assets: buildAssetRows({
      payload: args.assetsPayload,
      categories: args.assetCategories,
      untitledCategoryName: args.copy.untitledCategory,
      untitledAssetName: args.copy.untitledAsset,
      contactsById: args.contactsById,
      attachmentNamesById: args.attachmentNamesById,
      documentNamesById: args.documentNamesById,
    }),
    documents: args.documentPathLabels.map((pathLabel) => ({ pathLabel })),
  }
}
