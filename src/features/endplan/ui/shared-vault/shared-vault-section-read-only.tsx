import { useMemo, useState } from 'react'
import { ArrowLeft, Package, Paperclip } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '@/shared/ui'
import type { TFunction } from 'i18next'
import { SECTION_ID, type SectionItem } from '../../model/vault-section-types'
import { VaultItemCard } from '../section/vault-item-card'
import type { DecryptedSharedSection } from '../../api/hooks/decryption/use-decrypted-shared-sections'
import { VaultAssetsReadOnlyTable } from '../assets/vault-assets-read-only-table'
import { VaultPoliciesReadOnlyTable } from '../policies/vault-policies-read-only-table'
import { ContactsReadOnlyList } from '../contacts/contacts-read-only-list'
import { VaultDocumentsManager } from '../documents/vault-documents-manager'
import { useSharedVaultDocumentsPage } from '../../hooks/documents/use-shared-vault-documents-page'
import { useSharedAssetsReadOnly } from '../../hooks/shared-vault/use-shared-assets-read-only'
import { useSharedPoliciesReadOnly } from '../../hooks/shared-vault/use-shared-policies-read-only'
import { filterAssetCategoriesBySelection } from '../../hooks/assets/vault-assets-shared'
import { filterAssetCategoriesBySelection as filterPolicyCategoriesBySelection } from '../../hooks/policies/vault-policies-shared'
import {
  normalizeInstructionsPayload,
  type InstructionItem,
} from '../../model/instructions'
import { formatInstructionUpdatedLabel } from '../../model/instructions-form-state'
import { InstructionListCard } from '../instructions/instruction-list-card'
import { VaultDocumentViewerModal } from '../documents/vault-document-viewer-modal'
import { pickActiveVaultDocumentViewer } from '../../lib/pick-active-vault-document-viewer'
import { sharedEndplanSectionPath } from '@/app/constants/routes'

type SharedSectionContent = {
  items?: Record<string, unknown>[]
  categories?: Array<{
    categoryTemplateId?: string
    categoryName?: string
    rows?: Array<{ id?: string; values?: Record<string, unknown> }>
  }>
}

function toDisplayValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map((entry) => toDisplayValue(entry)).join(', ')
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return ''
    }
  }
  return String(value)
}

function formatLabel(raw: string): string {
  return raw
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function SharedAssetsReadOnlyTable({
  content,
  vaultId,
  t,
}: {
  content: SharedSectionContent
  vaultId: string
  t: TFunction
}) {
  const {
    selectedCategoryIds,
    isSchemaLoaded,
    attachmentFieldKeysByCategory,
    passwordFieldKeysByCategory,
    attachmentsById,
    downloadAttachment,
    viewAttachment,
    documentViewer: attachmentDocumentViewer,
  } = useSharedAssetsReadOnly(vaultId)
  const {
    files,
    downloadFile: downloadLinkedDocument,
    viewDocumentFile: viewLinkedDocument,
    documentViewer: linkedDocumentViewer,
  } = useSharedVaultDocumentsPage(vaultId)
  const linkedDocumentsById = useMemo(
    () => Object.fromEntries(files.map((file) => [file.id, file])),
    [files],
  )
  const documentViewer = useMemo(
    () => pickActiveVaultDocumentViewer(linkedDocumentViewer, attachmentDocumentViewer),
    [attachmentDocumentViewer, linkedDocumentViewer],
  )
  const categories = useMemo(
    () =>
      filterAssetCategoriesBySelection(
        Array.isArray(content.categories) ? content.categories : [],
        selectedCategoryIds,
        isSchemaLoaded,
      ),
    [content.categories, isSchemaLoaded, selectedCategoryIds],
  )

  if (!isSchemaLoaded) {
    return (
      <Card className="p-5">
        <p className="typo-body-sm text-slate-500 dark:text-slate-400">
          {t('sharedVault.sectionsLoading', 'Loading sections...')}
        </p>
      </Card>
    )
  }

  if (categories.length === 0) {
    const fallbackItems = Array.isArray(content.items) ? content.items : []
    if (fallbackItems.length === 0) {
      return (
        <Card className="p-5">
          <p className="typo-body-sm text-slate-500 dark:text-slate-400 italic">
            {t('sharedVault.emptySection', 'No items in this section.')}
          </p>
        </Card>
      )
    }

    return (
      <div className="space-y-3">
        {fallbackItems.map((item, index) => (
          <VaultItemCard
            key={String(item.id ?? `shared-asset-${index}`)}
            item={{ id: String(item.id ?? `shared-asset-${index}`), ...item } as SectionItem}
            sectionType={SECTION_ID.ASSETS}
          />
        ))}
      </div>
    )
  }

  return (
    <VaultAssetsReadOnlyTable
      categories={categories.map((category, index) => ({
        id: category.categoryTemplateId,
        key: `${category.categoryTemplateId ?? 'category'}-${index}`,
        name:
          category.categoryName?.trim() ||
          t('sharedVault.assetCategoryTitle', { defaultValue: `Asset Category ${index + 1}` }),
        rows: Array.isArray(category.rows) ? category.rows : [],
      }))}
      emptyStateMessage={t('sharedVault.emptySection', 'No items in this section.')}
      emptyCategoryMessage={t('sharedVault.emptySection', 'No items in this section.')}
      getRowCountLabel={(count) => t('vault.assets.readOnlyRowCount', { count })}
      attachmentFieldKeysByCategory={attachmentFieldKeysByCategory}
      passwordFieldKeysByCategory={passwordFieldKeysByCategory}
      attachmentsById={attachmentsById}
      linkedDocumentsById={linkedDocumentsById}
      onDownloadAttachment={(attachment) => void downloadAttachment(attachment)}
      onDownloadLinkedDocument={(document) => void downloadLinkedDocument(document)}
      onViewAttachment={viewAttachment}
      onViewLinkedDocument={viewLinkedDocument}
      documentViewer={documentViewer}
    />
  )
}

function SharedPoliciesReadOnlyTable({
  content,
  vaultId,
  t,
}: {
  content: SharedSectionContent
  vaultId: string
  t: TFunction
}) {
  const {
    selectedCategoryIds,
    isSchemaLoaded,
    attachmentFieldKeysByCategory,
    passwordFieldKeysByCategory,
    attachmentsById,
    downloadAttachment,
    viewAttachment,
    documentViewer: attachmentDocumentViewer,
  } = useSharedPoliciesReadOnly(vaultId)
  const {
    files,
    downloadFile: downloadLinkedDocument,
    viewDocumentFile: viewLinkedDocument,
    documentViewer: linkedDocumentViewer,
  } = useSharedVaultDocumentsPage(vaultId)
  const linkedDocumentsById = useMemo(
    () => Object.fromEntries(files.map((file) => [file.id, file])),
    [files],
  )
  const documentViewer = useMemo(
    () => pickActiveVaultDocumentViewer(linkedDocumentViewer, attachmentDocumentViewer),
    [attachmentDocumentViewer, linkedDocumentViewer],
  )
  const categories = useMemo(
    () =>
      filterPolicyCategoriesBySelection(
        Array.isArray(content.categories) ? content.categories : [],
        selectedCategoryIds,
        isSchemaLoaded,
      ),
    [content.categories, isSchemaLoaded, selectedCategoryIds],
  )

  if (!isSchemaLoaded) {
    return (
      <Card className="p-5">
        <p className="typo-body-sm text-slate-500 dark:text-slate-400">
          {t('sharedVault.sectionsLoading', 'Loading sections...')}
        </p>
      </Card>
    )
  }

  if (categories.length === 0) {
    const fallbackItems = Array.isArray(content.items) ? content.items : []
    if (fallbackItems.length === 0) {
      return (
        <Card className="p-5">
          <p className="typo-body-sm text-slate-500 dark:text-slate-400 italic">
            {t('sharedVault.emptySection', 'No items in this section.')}
          </p>
        </Card>
      )
    }

    return (
      <div className="space-y-3">
        {fallbackItems.map((item, index) => (
          <VaultItemCard
            key={String(item.id ?? `shared-policy-${index}`)}
            item={{ id: String(item.id ?? `shared-policy-${index}`), ...item } as SectionItem}
            sectionType={SECTION_ID.POLICIES}
          />
        ))}
      </div>
    )
  }

  return (
    <VaultPoliciesReadOnlyTable
      categories={categories.map((category, index) => ({
        id: category.categoryTemplateId,
        key: `${category.categoryTemplateId ?? 'category'}-${index}`,
        name:
          category.categoryName?.trim() ||
          t('sharedVault.policyCategoryTitle', { defaultValue: `Policy Category ${index + 1}` }),
        rows: Array.isArray(category.rows) ? category.rows : [],
      }))}
      emptyStateMessage={t('sharedVault.emptySection', 'No items in this section.')}
      emptyCategoryMessage={t('sharedVault.emptySection', 'No items in this section.')}
      getRowCountLabel={(count) => t('vault.policies.readOnlyRowCount', { count })}
      attachmentFieldKeysByCategory={attachmentFieldKeysByCategory}
      passwordFieldKeysByCategory={passwordFieldKeysByCategory}
      attachmentsById={attachmentsById}
      linkedDocumentsById={linkedDocumentsById}
      onDownloadAttachment={(attachment) => void downloadAttachment(attachment)}
      onDownloadLinkedDocument={(document) => void downloadLinkedDocument(document)}
      onViewAttachment={viewAttachment}
      onViewLinkedDocument={viewLinkedDocument}
      documentViewer={documentViewer}
    />
  )
}

export function SharedVaultSectionReadOnly({
  section,
  vaultId,
  t,
}: {
  section: DecryptedSharedSection
  vaultId: string
  t: TFunction
}) {
  if (section.section.sectionType === SECTION_ID.DOCUMENTS) {
    return <SharedVaultDocumentsReadOnly vaultId={vaultId} t={t} />
  }

  if (!section.content) {
    return (
      <Card className="p-5">
        <p className="typo-body-sm text-amber-600 dark:text-amber-400">
          {t('sharedVault.decryptFailed', 'Could not decrypt this section.')}
        </p>
      </Card>
    )
  }

  const content = section.content as SharedSectionContent
  const sectionType = section.section.sectionType

  if (sectionType === SECTION_ID.INSTRUCTIONS) {
    return <SharedVaultInstructionsReadOnly content={content} vaultId={vaultId} t={t} />
  }

  if (sectionType === SECTION_ID.ASSETS) {
    return <SharedAssetsReadOnlyTable content={content} vaultId={vaultId} t={t} />
  }

  if (sectionType === SECTION_ID.POLICIES) {
    return <SharedPoliciesReadOnlyTable content={content} vaultId={vaultId} t={t} />
  }

  if (sectionType === SECTION_ID.CONTACTS) {
    return <ContactsReadOnlyList content={content} />
  }

  const items = Array.isArray(content.items) ? content.items : []
  if (items.length === 0) {
    return (
      <Card className="p-5">
        <p className="typo-body-sm text-slate-500 dark:text-slate-400 italic">
          {t('sharedVault.emptySection', 'No items in this section.')}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <Card key={String(item.id ?? `shared-generic-${index}`)} className="p-4">
          <div className="space-y-1.5">
            {Object.entries(item).map(([key, value]) => (
              <p key={`${String(item.id ?? `shared-generic-${index}`)}-${key}`} className="typo-body-sm text-slate-700 dark:text-slate-200">
                <span className="typo-caption-strong text-slate-500 dark:text-slate-400 mr-2">
                  {formatLabel(key)}:
                </span>
                {toDisplayValue(value) || '—'}
              </p>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

function SharedVaultInstructionsReadOnly({
  content,
  vaultId,
  t,
}: {
  content: SharedSectionContent
  vaultId: string
  t: TFunction
}) {
  const instructions = useMemo(() => normalizeInstructionsPayload(content).items, [content])
  const [activeInstructionID, setActiveInstructionID] = useState<string | null>(null)
  const navigate = useNavigate()
  const { files, viewDocumentFile, documentViewer } = useSharedVaultDocumentsPage(vaultId)

  const selectedInstruction: InstructionItem | null =
    activeInstructionID && instructions.some((item) => item.id === activeInstructionID)
      ? instructions.find((item) => item.id === activeInstructionID) ?? null
      : null

  if (instructions.length === 0) {
    return (
      <Card className="p-5">
        <p className="typo-body-sm text-slate-500 dark:text-slate-400 italic">
          {t('sharedVault.emptySection', 'No items in this section.')}
        </p>
      </Card>
    )
  }

  if (!selectedInstruction) {
    return (
      <div className="space-y-3">
        <h2 className="typo-heading-section text-ep-body dark:text-white">
          {t('vault.instructions.yourInstructions')}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {instructions.map((instruction) => (
            <InstructionListCard
              key={instruction.id}
              instruction={instruction}
              onOpen={() => setActiveInstructionID(instruction.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  const linkedAssetId = selectedInstruction.linkedAssetIds[0] ?? null
  const attachedDocumentId = selectedInstruction.attachedDocumentId
  const attachedFile = attachedDocumentId ? files.find((file) => file.id === attachedDocumentId) ?? null : null
  const hasAttachments = Boolean(linkedAssetId || attachedDocumentId)
  const stepCount = selectedInstruction.steps.length
  const typeBadgeLabel =
    selectedInstruction.instructionType === 'written_note'
      ? t('vault.instructions.type.written')
      : t('vault.instructions.previewTypeBadgeSteps', { count: stepCount })

  return (
    <div className="space-y-6">
      <div className="inline-flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
        <div className="inline-flex min-w-0 items-center gap-2 typo-body-sm text-slate-600 dark:text-slate-300">
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-2 transition hover:text-slate-900 dark:hover:text-slate-100"
            onClick={() => setActiveInstructionID(null)}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {t('vault.instructions.backToList')}
          </button>
          <span className="shrink-0 text-slate-400" aria-hidden>
            /
          </span>
          <span className="truncate text-slate-700 dark:text-slate-200">{selectedInstruction.title}</span>
        </div>
      </div>

      <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm dark:border-slate-700">
        <div className="space-y-6 p-6">
          <div className="space-y-5">
            <div>
              <span
                className={`mb-3 inline-block rounded-md px-3 py-1 typo-caption-emphasis uppercase tracking-wide ${
                  selectedInstruction.instructionType === 'written_note'
                    ? 'bg-slate-100 text-slate-800 dark:bg-ep-surface-panel dark:text-slate-100'
                    : 'bg-ep-primary-softer text-ep-primary-dark dark:bg-ep-primary-darker/60 dark:text-ep-primary-softer'
                }`}
              >
                {typeBadgeLabel}
              </span>
              <h2 className="typo-heading-card text-slate-900 dark:text-slate-100">{selectedInstruction.title}</h2>
              <p className="mt-2 typo-caption text-slate-500 dark:text-slate-400">
                {t('dashboard.endplan.updated', {
                  date: formatInstructionUpdatedLabel(selectedInstruction.updatedAt),
                })}
              </p>
            </div>
            {selectedInstruction.instructionType === 'written_note' ? (
              <p className="whitespace-pre-wrap typo-body leading-relaxed text-slate-700 dark:text-slate-200">
                {selectedInstruction.noteBody.trim()
                  ? selectedInstruction.noteBody
                  : t('vault.instructions.previewEmptyNote')}
              </p>
            ) : (
              <div className="flex flex-col gap-6">
                {selectedInstruction.steps.map((step, index) => (
                  <div key={step.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ep-primary typo-caption-emphasis text-white dark:bg-ep-primary">
                        {index + 1}
                      </div>
                      {index < selectedInstruction.steps.length - 1 ? (
                        <div className="mt-2 min-h-[1.5rem] w-0.5 flex-1 bg-ep-primary-soft dark:bg-ep-primary-dark" aria-hidden />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      {step.title.trim() ? (
                        <p className="mb-2 typo-body-sm-strong text-ep-body">
                          {step.title.trim()}
                        </p>
                      ) : null}
                      <p className="whitespace-pre-wrap typo-body leading-relaxed text-slate-700 dark:text-slate-200">
                        {step.text.trim() ? step.text : t('vault.instructions.previewEmptyStep')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {hasAttachments ? (
            <div className="space-y-3 border-t border-slate-200 pt-6 dark:border-slate-700">
              <p className="typo-caption-emphasis uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t('vault.instructions.previewAttachmentsHeading')}
              </p>
              <div className="flex flex-col gap-3">
                {attachedDocumentId ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 px-3 py-3 dark:border-slate-600 sm:px-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Paperclip className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                      <div className="min-w-0">
                        <p className="truncate typo-body-sm-strong text-ep-body">
                          {attachedFile?.name ?? t('vault.instructions.missingDocument')}
                        </p>
                        {attachedFile?.mimeType ? (
                          <p className="truncate typo-caption text-slate-500 dark:text-slate-400">
                            {attachedFile.mimeType}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {attachedFile ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 shrink-0 px-3"
                        onClick={() => void viewDocumentFile(attachedFile)}
                      >
                        {t('vault.instructions.viewDocument')}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {linkedAssetId ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 px-3 py-3 dark:border-slate-600 sm:px-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Package className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                      <div className="min-w-0">
                        <p className="truncate typo-body-sm-strong text-ep-body">
                          {linkedAssetId}
                        </p>
                        <p className="truncate typo-caption text-slate-500 dark:text-slate-400">
                          {t('vault.instructions.noSubtitle')}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 shrink-0 px-3"
                      onClick={() => navigate(sharedEndplanSectionPath(vaultId, SECTION_ID.ASSETS))}
                    >
                      {t('vault.instructions.viewAsset')}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </Card>
      <VaultDocumentViewerModal
        isOpen={documentViewer.isOpen}
        file={documentViewer.file}
        blob={documentViewer.blob}
        isLoading={documentViewer.isLoading}
        isDownloadOnly={documentViewer.isDownloadOnly}
        error={documentViewer.error}
        onClose={documentViewer.onClose}
        onDownload={documentViewer.onDownload}
      />
    </div>
  )
}

function SharedVaultDocumentsReadOnly({
  vaultId,
  t,
}: {
  vaultId: string
  t: TFunction
}) {
  const {
    isLoading,
    isDecrypting,
    isRefreshing,
    error,
    foldersByParent,
    files,
    visibleFiles,
    selectedFolderId,
    selectedFolder,
    breadcrumbs,
    setSelectedFolderId,
    downloadFile,
    viewDocumentFile,
    documentViewer,
  } = useSharedVaultDocumentsPage(vaultId)

  if (isLoading) {
    return (
      <Card className="p-5">
        <p className="typo-body-sm text-slate-500 dark:text-slate-400">
          {t('sharedVault.sectionsLoading', 'Loading sections...')}
        </p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-5">
        <p className="typo-body-sm text-amber-600 dark:text-amber-400">{error}</p>
      </Card>
    )
  }

  const noop = async (...args: unknown[]) => {
    void args
    return false
  }

  return (
    <div className="min-h-0 flex-1 overflow-hidden px-6 pb-6 pt-3 sm:px-8 lg:px-10 xl:flex xl:h-full xl:min-h-0 xl:flex-col">
      <VaultDocumentsManager
        canWrite={false}
        canCreateFolder={false}
        canUploadDocuments={false}
        isBusy={isDecrypting || isRefreshing}
        isUploading={false}
        foldersByParent={foldersByParent}
        files={files}
        visibleFiles={visibleFiles}
        selectedFolderId={selectedFolderId}
        selectedFolder={selectedFolder}
        breadcrumbs={breadcrumbs}
        setSelectedFolderId={setSelectedFolderId}
        createFolder={noop}
        renameFolder={noop}
        renameFile={noop}
        moveFilesToFolder={async () => false}
        deleteFolder={noop}
        uploadFiles={noop}
        downloadFile={downloadFile}
        viewDocumentFile={viewDocumentFile}
        deleteFile={noop}
        documentViewer={documentViewer}
      />
    </div>
  )
}
