import {
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  List,
  ListOrdered,
  ListPlus,
  NotebookPen,
  Package,
  Paperclip,
  GripVertical,
  Plus,
  Save,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import { Button, Card, EndPlanIcon, Input, PageHeader } from '@/shared/ui'
import { AssetAttachmentCell } from '../attachments/asset-attachment-cell'
import { AssetAttachmentDocumentPickerPanel } from '../attachments/asset-attachment-document-picker-panel'
import { VaultDocumentViewerModal } from '../documents/vault-document-viewer-modal'
import type { VaultDocumentViewerState } from '../../hooks/documents/use-vault-document-viewer'
import { INSTRUCTION_NEW_ID } from '@/app/constants/routes'
import { InstructionListCard } from './instruction-list-card'
import { DocumentsConfirmDialog } from '../documents/documents-dialogs'
import {
  instructionStepCollapsedSummary,
  type InstructionItem,
  type InstructionType,
} from '../../model/instructions'
import {
  blankInstructionFormState,
  formatInstructionUpdatedLabel,
  instructionItemToFormState,
  type InstructionFormState,
} from '../../model/instructions-form-state'
import {
  INSTRUCTION_TEMPLATES,
  type InstructionTemplateDraft,
} from '../../model/instruction-templates'
import type {
  InstructionAssetOption,
  InstructionContactOption,
  InstructionDocumentFolderOption,
  InstructionDocumentOption,
  InstructionLinkedDocument,
  InstructionUpsertHandler,
} from '../../model/instructions-page.types'
import { VaultCategoryQuotaLimitModal } from '../section/vault-category-quota-limit-modal'
import { VaultSuggestionTile, VaultSuggestionsPanel } from '../suggestions'

export type VaultInstructionsRouteMode = 'list' | 'preview' | 'edit' | 'choose-type' | 'create'

type VaultInstructionsPageProps = {
  instructions: InstructionItem[]
  canAddMoreInstructions: boolean
  assetOptions: InstructionAssetOption[]
  contactOptions: InstructionContactOption[]
  documentOptions: InstructionDocumentOption[]
  documentFolders: InstructionDocumentFolderOption[]
  isSaving: boolean
  isReadOnly: boolean
  isDocumentsBusy?: boolean
  canManageDocuments: boolean
  onCreateDocumentFolder: (name: string, parentFolderId: string | null) => Promise<string | null>
  onUploadDocumentToFolder: (folderId: string, file: File) => Promise<InstructionLinkedDocument | null>
  onSave: InstructionUpsertHandler
  onDelete: (instructionID: string) => Promise<boolean>
  routeMode: VaultInstructionsRouteMode
  activeInstructionId?: string
  /** When `routeMode === 'create'`, optional type chosen on the previous screen. */
  createFlowInitialInstructionType?: InstructionType
  createFlowInitialTitle?: string
  createFlowInitialNoteBody?: string
  onOpenNewInstruction: () => void
  onNavigateToInstructionComposer: (
    instructionType: InstructionType,
    draft?: InstructionTemplateDraft,
  ) => void
  onBackFromInstructionComposer: () => void
  onOpenPreview: (instructionId: string) => void
  onOpenEdit: (instructionId: string) => void
  onBackToList: () => void
  onViewAsset: (assetId: string) => void
  onViewContact: (contactId: string) => void
  onViewDocument: (document: InstructionDocumentOption) => Promise<boolean>
  documentViewer: VaultDocumentViewerState
}

function initInstructionFormState(args: {
  routeMode: VaultInstructionsRouteMode
  activeInstructionId?: string
  instructions: InstructionItem[]
  createFlowInitialInstructionType?: InstructionType
  createFlowInitialTitle?: string
  createFlowInitialNoteBody?: string
}): InstructionFormState {
  const {
    routeMode,
    activeInstructionId,
    instructions,
    createFlowInitialInstructionType,
    createFlowInitialTitle,
    createFlowInitialNoteBody,
  } = args
  if (routeMode === 'edit' && activeInstructionId && activeInstructionId !== INSTRUCTION_NEW_ID) {
    const inst = instructions.find((i) => i.id === activeInstructionId)
    if (inst) return instructionItemToFormState(inst)
  }
  if (routeMode === 'create') {
    const base = blankInstructionFormState()
    if (createFlowInitialInstructionType === 'step_by_step') {
      base.instructionType = 'step_by_step'
    } else if (createFlowInitialInstructionType === 'written_note') {
      base.instructionType = 'written_note'
    }
    if (createFlowInitialTitle?.trim()) {
      base.title = createFlowInitialTitle.trim()
    }
    if (createFlowInitialNoteBody != null && createFlowInitialNoteBody !== '') {
      base.noteBody = createFlowInitialNoteBody
    }
    return base
  }
  return blankInstructionFormState()
}

type InstructionEditorChromeProps = {
  topbarEnd?: ReactNode
  footerStart?: ReactNode
  footerEnd: ReactNode
  children: ReactNode
}

/** Screen chrome that presents the instruction composer as an A4 paper sheet. */
function InstructionEditorChrome({
  topbarEnd,
  footerStart,
  footerEnd,
  children,
}: InstructionEditorChromeProps) {
  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col lg:h-[calc(100dvh-7.5rem)]">
      {topbarEnd ? <div className="mb-4 flex shrink-0 justify-end">{topbarEnd}</div> : null}
      <div className="-mx-6 min-h-0 flex-1 overflow-y-auto bg-slate-100 px-4 py-8 sm:-mx-8 sm:px-6 lg:-mx-10 lg:px-8 dark:bg-ep-primary-darker/50">
        <div className="mx-auto flex w-full max-w-[210mm] flex-col gap-6">{children}</div>
      </div>
      <div className="z-30 -mx-6 flex h-14 shrink-0 items-center border-t border-slate-200 bg-white px-6 shadow-[0_-1px_3px_rgba(15,23,42,0.06)] sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10 dark:border-ep-border-card dark:bg-ep-surface dark:shadow-[0_-1px_3px_rgba(0,0,0,0.25)]">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">{footerStart}</div>
          <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">{footerEnd}</div>
        </div>
      </div>
    </div>
  )
}

/** Read-only preview presented as the same A4 paper sheet. */
function InstructionPreviewSheet({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-6 min-h-[calc(100dvh-11rem)] bg-slate-100 px-4 py-8 sm:-mx-8 sm:px-6 lg:-mx-10 lg:-mb-20 lg:min-h-[calc(100dvh-9rem)] lg:px-8 dark:bg-ep-primary-darker/50">
      <div className="mx-auto w-full max-w-[210mm]">
        <div className="flex min-h-[calc(100dvh-6rem)] w-full flex-col bg-white px-8 py-10 shadow-[0_1px_3px_rgba(15,23,42,0.08),0_8px_24px_rgba(15,23,42,0.06)] dark:bg-ep-surface-subtle dark:shadow-[0_1px_3px_rgba(0,0,0,0.35),0_8px_24px_rgba(0,0,0,0.25)] sm:px-10 sm:py-12">
          {children}
        </div>
      </div>
    </div>
  )
}

function InstructionTemplatesPanel({
  canUseTemplates,
  quotaExhausted = false,
  onDismiss,
  onUseTemplate,
  onQuotaExhausted,
}: {
  canUseTemplates: boolean
  quotaExhausted?: boolean
  onDismiss: () => void
  onUseTemplate: (draft: InstructionTemplateDraft) => void
  onQuotaExhausted?: () => void
}) {
  const { t } = useTranslation()

  return (
    <VaultSuggestionsPanel
      title={t('vault.instructions.templates.title')}
      subtitle={t('vault.instructions.templates.subtitle')}
      dismissLabel={t('vault.instructions.templates.dismiss')}
      onDismiss={onDismiss}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {INSTRUCTION_TEMPLATES.map((template) => (
          <VaultSuggestionTile
            key={template.id}
            title={t(`vault.instructions.templates.items.${template.id}.title`)}
            description={t(`vault.instructions.templates.items.${template.id}.description`)}
            icon={<EndPlanIcon name={template.icon} size={24} className="size-5" />}
            layout="card"
            action="button"
            actionLabel={t('vault.instructions.templates.useTemplate')}
            interactive={canUseTemplates}
            className={quotaExhausted ? 'opacity-60' : undefined}
            onSelect={
              canUseTemplates
                ? () => {
                    if (quotaExhausted) {
                      onQuotaExhausted?.()
                      return
                    }
                    onUseTemplate({
                      title: t(`vault.instructions.templates.items.${template.id}.draftTitle`),
                      noteBody: t(`vault.instructions.templates.items.${template.id}.draftBody`),
                    })
                  }
                : undefined
            }
          />
        ))}
      </div>
    </VaultSuggestionsPanel>
  )
}

export function VaultInstructionsPage({
  instructions,
  canAddMoreInstructions,
  assetOptions,
  contactOptions,
  documentOptions,
  documentFolders,
  isSaving,
  isReadOnly,
  isDocumentsBusy = false,
  canManageDocuments,
  onCreateDocumentFolder,
  onUploadDocumentToFolder,
  onSave,
  onDelete,
  routeMode,
  activeInstructionId,
  createFlowInitialInstructionType,
  createFlowInitialTitle,
  createFlowInitialNoteBody,
  onOpenNewInstruction,
  onNavigateToInstructionComposer,
  onBackFromInstructionComposer,
  onOpenPreview,
  onOpenEdit,
  onBackToList,
  onViewAsset,
  onViewContact,
  onViewDocument,
  documentViewer,
}: VaultInstructionsPageProps) {
  const { t } = useTranslation()
  const selectedInstruction = useMemo(
    () =>
      activeInstructionId && activeInstructionId !== INSTRUCTION_NEW_ID
        ? instructions.find((instruction) => instruction.id === activeInstructionId) ?? null
        : null,
    [activeInstructionId, instructions],
  )

  const [isDocumentPickerOpen, setIsDocumentPickerOpen] = useState(false)
  const [instructionPendingDelete, setInstructionPendingDelete] = useState<InstructionItem | null>(null)
  const [isDeletingInstruction, setIsDeletingInstruction] = useState(false)
  const [templatesDismissed, setTemplatesDismissed] = useState(false)
  const [isQuotaLimitModalOpen, setIsQuotaLimitModalOpen] = useState(false)
  const [form, setForm] = useState<InstructionFormState>(() =>
    initInstructionFormState({
      routeMode,
      activeInstructionId,
      instructions,
      createFlowInitialInstructionType,
      createFlowInitialTitle,
      createFlowInitialNoteBody,
    }),
  )
  const [assetSearch, setAssetSearch] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [stepsError, setStepsError] = useState<string | null>(null)
  const [stepsExpandStepId, setStepsExpandStepId] = useState<string | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const noteInputRef = useRef<HTMLTextAreaElement>(null)

  const clearInstructionFieldErrors = useCallback(() => {
    setTitleError(null)
    setNoteError(null)
    setStepsError(null)
    setStepsExpandStepId(null)
  }, [])

  const updateForm: Dispatch<SetStateAction<InstructionFormState>> = useCallback((updater) => {
    setForm((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      if (next.instructionType !== current.instructionType) {
        setNoteError(null)
        setStepsError(null)
        setStepsExpandStepId(null)
      }
      if (next.title.trim()) {
        setTitleError(null)
      }
      if (next.noteBody.trim()) {
        setNoteError(null)
      }
      if (next.steps.some((step) => step.text.trim() || step.title.trim())) {
        setStepsError(null)
        setStepsExpandStepId(null)
      }
      return next
    })
  }, [])

  const focusTitleField = useCallback(() => {
    titleInputRef.current?.focus()
    titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const focusNoteField = useCallback(() => {
    noteInputRef.current?.focus()
    noteInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const validateFormForSave = useCallback(() => {
    if (!form.title.trim()) {
      setTitleError(t('vault.instructions.form.titleRequired'))
      setNoteError(null)
      setStepsError(null)
      setStepsExpandStepId(null)
      focusTitleField()
      return false
    }
    setTitleError(null)

    if (form.instructionType === 'written_note') {
      if (!form.noteBody.trim()) {
        setNoteError(t('vault.instructions.form.noteRequired'))
        setStepsError(null)
        focusNoteField()
        return false
      }
      setNoteError(null)
      return true
    }

    if (form.steps.every((step) => !step.text.trim() && !step.title.trim())) {
      const firstStepId = form.steps[0]?.id ?? null
      setStepsError(t('vault.instructions.form.stepsRequired'))
      setStepsExpandStepId(firstStepId)
      setNoteError(null)
      return false
    }
    setStepsError(null)
    setStepsExpandStepId(null)
    return true
  }, [focusNoteField, focusTitleField, form.instructionType, form.noteBody, form.steps, form.title, t])

  const filteredAssetOptions = useMemo(() => {
    const normalized = assetSearch.trim().toLowerCase()
    if (!normalized) return assetOptions
    return assetOptions.filter((option) => {
      return (
        option.label.toLowerCase().includes(normalized) || option.subtitle.toLowerCase().includes(normalized)
      )
    })
  }, [assetOptions, assetSearch])

  const showInstructionQuotaLimit = () => setIsQuotaLimitModalOpen(true)

  const openCreate = () => {
    if (!canAddMoreInstructions) {
      showInstructionQuotaLimit()
      return
    }
    setAssetSearch('')
    setIsDocumentPickerOpen(false)
    onOpenNewInstruction()
  }

  const openEdit = (instruction: InstructionItem) => {
    clearInstructionFieldErrors()
    setForm(instructionItemToFormState(instruction))
    setAssetSearch('')
    setIsDocumentPickerOpen(false)
    onOpenEdit(instruction.id)
  }

  const setLinkedAsset = (assetID: string | null) => {
    setForm((current) => ({
      ...current,
      linkedAssetIds: assetID ? [assetID] : [],
    }))
  }

  const setLinkedContact = (contactID: string | null) => {
    setForm((current) => ({
      ...current,
      linkedContactId: contactID,
    }))
  }

  const updateStep = (stepID: string, patch: { text?: string; title?: string }) => {
    setForm((current) => {
      const steps = current.steps.map((step) => (step.id === stepID ? { ...step, ...patch } : step))
      if (steps.some((step) => step.text.trim() || step.title.trim())) {
        setStepsError(null)
        setStepsExpandStepId(null)
      }
      return { ...current, steps }
    })
  }

  const addStep = () => {
    setForm((current) => ({
      ...current,
      steps: [...current.steps, { id: crypto.randomUUID(), title: '', text: '' }],
    }))
  }

  const removeStep = (stepID: string) => {
    setForm((current) => ({
      ...current,
      steps: current.steps.filter((step) => step.id !== stepID),
    }))
  }

  const submit = async () => {
    if (!validateFormForSave()) return
    const result = await onSave(form)
    if (result.success) {
      setIsDocumentPickerOpen(false)
      onOpenPreview(result.savedInstructionId)
    }
  }

  const closeInstructionDeleteDialog = () => {
    if (isDeletingInstruction) return
    setInstructionPendingDelete(null)
  }

  const confirmDeleteInstruction = async () => {
    if (!instructionPendingDelete) return
    setIsDeletingInstruction(true)
    try {
      const ok = await onDelete(instructionPendingDelete.id)
      if (!ok) return
      if (activeInstructionId === instructionPendingDelete.id) {
        onBackToList()
      }
      if (form.id === instructionPendingDelete.id) {
        setForm(blankInstructionFormState())
      }
      setInstructionPendingDelete(null)
    } finally {
      setIsDeletingInstruction(false)
    }
  }

  const selectedAsset = form.linkedAssetIds[0] ? assetOptions.find((a) => a.id === form.linkedAssetIds[0]) : null
  const selectedDocument = form.attachedDocumentId
    ? documentOptions.find((doc) => doc.id === form.attachedDocumentId)
    : null
  const selectedContact = form.linkedContactId
    ? contactOptions.find((contact) => contact.id === form.linkedContactId)
    : null

  const saveFromEditPage = async () => {
    if (!form.id) return
    if (!validateFormForSave()) return
    const result = await onSave(form)
    if (result.success) {
      setIsDocumentPickerOpen(false)
      onOpenPreview(result.savedInstructionId)
    }
  }

  return (
    <div className="space-y-6">
      <DocumentsConfirmDialog
        key={`${Boolean(instructionPendingDelete)}-${instructionPendingDelete?.id ?? ''}`}
        open={!!instructionPendingDelete}
        title={t('vault.instructions.deleteDialog.title')}
        description={t('vault.instructions.deleteDialog.description', {
          title: instructionPendingDelete?.title ?? '',
        })}
        confirmLabel={t('vault.instructions.delete')}
        onClose={closeInstructionDeleteDialog}
        onConfirm={() => void confirmDeleteInstruction()}
        isBusy={isDeletingInstruction}
      />
      <VaultCategoryQuotaLimitModal
        isOpen={isQuotaLimitModalOpen}
        kind="instruction"
        onClose={() => setIsQuotaLimitModalOpen(false)}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {routeMode === 'list' ? (
          <>
            <PageHeader
              title={t('nav.instructions')}
              description={t('vault.instructions.subtitle')}
              descriptionClassName="text-slate-500 dark:text-slate-400"
            />
            {!isReadOnly ? (
              <Button
                type="button"
                onClick={openCreate}
                className={cn('gap-2', !canAddMoreInstructions && 'opacity-60')}
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                {t('vault.instructions.newInstructionCta')}
              </Button>
            ) : null}
          </>
        ) : routeMode === 'choose-type' ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
            <button
              type="button"
              className="inline-flex items-center gap-2 typo-body-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              onClick={onBackToList}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              {t('vault.instructions.backToList')}
            </button>
          </div>
        ) : routeMode === 'create' || (routeMode === 'edit' && selectedInstruction) ? null : (
          <div className="inline-flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
            <div className="inline-flex min-w-0 items-center gap-2 typo-body-sm text-slate-600 dark:text-slate-300">
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-2 hover:text-slate-900 dark:hover:text-slate-100"
                onClick={onBackToList}
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                {t('vault.instructions.backToList')}
              </button>
              {selectedInstruction ? (
                <>
                  <span className="shrink-0 text-slate-400" aria-hidden>
                    /
                  </span>
                  <span className="truncate text-slate-700 dark:text-slate-200">{selectedInstruction.title}</span>
                </>
              ) : null}
            </div>
            {routeMode === 'preview' && !isReadOnly && selectedInstruction ? (
              <Button type="button" onClick={() => openEdit(selectedInstruction)} className="gap-2">
                {t('vault.instructions.editCta')}
              </Button>
            ) : null}
          </div>
        )}
      </div>

      {routeMode === 'choose-type' ? (
        <div className="mx-auto max-w-[920px] pb-12 pt-2">
          <div className="mb-10 text-center">
            <h1 className="typo-heading-page text-slate-900 dark:text-slate-100">{t('vault.instructions.chooseTypeTitle')}</h1>
            <p className="mx-auto mt-3 max-w-2xl typo-body text-slate-500 dark:text-slate-400">
              {t('vault.instructions.chooseTypeSubtitle')}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onNavigateToInstructionComposer('written_note')}
              className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-ep-primary hover:shadow-md dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-ep-primary-accent"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-ep-surface-panel"
                aria-hidden
              >
                <FileText className="h-6 w-6 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <p className="typo-caption-emphasis uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('vault.instructions.formatLabel')}
                </p>
                <h2 className="mt-1 typo-heading-card text-slate-900 dark:text-slate-100">{t('vault.instructions.type.written')}</h2>
              </div>
              <p className="typo-body-sm text-slate-600 dark:text-slate-300">{t('vault.instructions.writtenCardBody')}</p>
              <div className="mt-1 space-y-2">
                <p className="typo-caption-emphasis uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('vault.instructions.exampleUsesLabel')}
                </p>
                <ul className="space-y-1.5 typo-caption text-slate-600 dark:text-slate-400">
                  <li className="rounded-md bg-slate-50 px-2 py-1 dark:bg-ep-primary-dark/80">{t('vault.instructions.writtenExample1')}</li>
                  <li className="rounded-md bg-slate-50 px-2 py-1 dark:bg-ep-primary-dark/80">{t('vault.instructions.writtenExample2')}</li>
                  <li className="rounded-md bg-slate-50 px-2 py-1 dark:bg-ep-primary-dark/80">{t('vault.instructions.writtenExample3')}</li>
                </ul>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToInstructionComposer('step_by_step')}
              className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-ep-primary hover:shadow-md dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-ep-primary-accent"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-ep-primary-softer dark:bg-ep-primary-darker/50"
                aria-hidden
              >
                <List className="h-6 w-6 text-ep-primary-accent dark:text-ep-primary-soft" />
              </div>
              <div>
                <p className="typo-caption-emphasis uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('vault.instructions.formatLabel')}
                </p>
                <h2 className="mt-1 typo-heading-card text-slate-900 dark:text-slate-100">{t('vault.instructions.type.stepByStep')}</h2>
              </div>
              <p className="typo-body-sm text-slate-600 dark:text-slate-300">{t('vault.instructions.stepCardBody')}</p>
              <div className="mt-1 space-y-2">
                <p className="typo-caption-emphasis uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('vault.instructions.exampleUsesLabel')}
                </p>
                <ul className="space-y-1.5 typo-caption text-slate-600 dark:text-slate-400">
                  <li className="rounded-md bg-slate-50 px-2 py-1 dark:bg-ep-primary-dark/80">{t('vault.instructions.stepExample1')}</li>
                  <li className="rounded-md bg-slate-50 px-2 py-1 dark:bg-ep-primary-dark/80">{t('vault.instructions.stepExample2')}</li>
                  <li className="rounded-md bg-slate-50 px-2 py-1 dark:bg-ep-primary-dark/80">{t('vault.instructions.stepExample3')}</li>
                </ul>
              </div>
            </button>
          </div>
        </div>
      ) : routeMode === 'create' ? (
        <InstructionEditorChrome
          footerEnd={
            <>
              <Button type="button" variant="secondary" onClick={onBackFromInstructionComposer}>
                {t('common.cancel')}
              </Button>
              <Button type="button" loading={isSaving} onClick={() => void submit()} className="gap-2">
                <Save className="h-4 w-4 shrink-0" aria-hidden />
                {t('vault.instructions.saveCta')}
              </Button>
            </>
          }
        >
          <InstructionFormFields
            form={form}
            assetOptions={assetOptions}
            contactOptions={contactOptions}
            filteredAssetOptions={filteredAssetOptions}
            assetSearch={assetSearch}
            selectedAsset={selectedAsset}
            selectedDocument={selectedDocument}
            selectedContact={selectedContact}
            onAssetSearch={setAssetSearch}
            onSetLinkedAsset={setLinkedAsset}
            onSetLinkedContact={setLinkedContact}
            onUpdateForm={updateForm}
            onUpdateStep={updateStep}
            onAddStep={addStep}
            onRemoveStep={removeStep}
            onOpenDocumentPicker={() => setIsDocumentPickerOpen(true)}
            titleError={titleError}
            titleInputRef={titleInputRef}
            noteError={noteError}
            noteInputRef={noteInputRef}
            stepsError={stepsError}
            stepsExpandStepId={stepsExpandStepId}
            showTypeSelector={createFlowInitialInstructionType == null}
            typeSelectorPresentation="featured"
            formLayoutVariant="editor"
            showReadOnlyFormatBadge={createFlowInitialInstructionType != null}
            isDocumentPickerOpen={isDocumentPickerOpen}
            onCloseDocumentPicker={() => setIsDocumentPickerOpen(false)}
            documentFoldersForPicker={documentFolders}
            documentOptionsForPicker={documentOptions}
            isDocumentsBusy={isDocumentsBusy}
            canManageDocuments={canManageDocuments}
            onCreateDocumentFolder={onCreateDocumentFolder}
            onUploadDocumentToFolder={onUploadDocumentToFolder}
          />
        </InstructionEditorChrome>
      ) : instructions.length === 0 && routeMode === 'list' ? (
        <div className="space-y-6">
          {!templatesDismissed ? (
            <InstructionTemplatesPanel
              canUseTemplates={!isReadOnly}
              quotaExhausted={!canAddMoreInstructions}
              onDismiss={() => setTemplatesDismissed(true)}
              onUseTemplate={(draft) => onNavigateToInstructionComposer('written_note', draft)}
              onQuotaExhausted={showInstructionQuotaLimit}
            />
          ) : null}
          <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-14 text-center">
            <div className="mb-6 text-slate-300 dark:text-slate-600" aria-hidden>
              <FileText className="mx-auto h-16 w-16" strokeWidth={1} />
            </div>
            <h2 className="typo-heading-card text-slate-900 dark:text-slate-100">{t('vault.instructions.emptyTitle')}</h2>
            <p className="mt-3 typo-body-sm text-slate-500 dark:text-slate-400">{t('vault.instructions.emptyBody')}</p>
            {!isReadOnly ? (
              <div className="mt-8">
                <Button
                  type="button"
                  onClick={openCreate}
                  className={cn('gap-2', !canAddMoreInstructions && 'opacity-60')}
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  {t('vault.instructions.firstCta')}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : routeMode === 'list' ? (
        <div className="flex flex-col gap-5">
          {!templatesDismissed ? (
            <InstructionTemplatesPanel
              canUseTemplates={!isReadOnly}
              quotaExhausted={!canAddMoreInstructions}
              onDismiss={() => setTemplatesDismissed(true)}
              onUseTemplate={(draft) => onNavigateToInstructionComposer('written_note', draft)}
              onQuotaExhausted={showInstructionQuotaLimit}
            />
          ) : null}
          <div className="space-y-3">
            <h2 className="typo-heading-section text-ep-body dark:text-white">
              {t('vault.instructions.yourInstructions')}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {instructions.map((instruction) => (
                <InstructionListCard
                  key={instruction.id}
                  instruction={instruction}
                  onOpen={() => onOpenPreview(instruction.id)}
                  onEdit={isReadOnly ? undefined : () => openEdit(instruction)}
                  onDelete={
                    isReadOnly
                      ? undefined
                      : () => {
                          setInstructionPendingDelete(instruction)
                        }
                  }
                />
              ))}
            </div>
          </div>
        </div>
      ) : routeMode === 'preview' && selectedInstruction ? (
        (() => {
          const linkedAssetId = selectedInstruction.linkedAssetIds[0] ?? null
          const linkedAsset = linkedAssetId ? assetOptions.find((option) => option.id === linkedAssetId) : null
          const attachedDocumentId = selectedInstruction.attachedDocumentId
          const attachedDocument = attachedDocumentId
            ? documentOptions.find((doc) => doc.id === attachedDocumentId)
            : null
          const linkedContactId = selectedInstruction.linkedContactId
          const linkedContact = linkedContactId
            ? contactOptions.find((option) => option.id === linkedContactId)
            : null
          const hasAttachments = Boolean(linkedAssetId || attachedDocumentId || linkedContactId)
          const stepCount = selectedInstruction.steps.length
          const typeBadgeLabel =
            selectedInstruction.instructionType === 'written_note'
              ? t('vault.instructions.type.written')
              : t('vault.instructions.previewTypeBadgeSteps', { count: stepCount })
          return (
            <InstructionPreviewSheet>
              <div className="space-y-6">
                <div className="space-y-5">
                  <div>
                    <span
                      className={`mb-3 inline-block rounded-md px-3 py-1 typo-caption-emphasis uppercase tracking-wide ${
                        selectedInstruction.instructionType === 'written_note'
                          ? 'bg-slate-100 text-slate-800 dark:bg-ep-primary-dark dark:text-slate-100'
                          : 'bg-ep-primary-softer text-ep-primary-dark dark:bg-ep-primary-darker/60 dark:text-ep-primary-softer'
                      }`}
                    >
                      {typeBadgeLabel}
                    </span>
                    <h2 className="typo-heading-card text-slate-900 dark:text-slate-100">{selectedInstruction.title}</h2>
                    <p className="mt-2 typo-caption text-slate-500 dark:text-slate-400">
                      {t('dashboard.endplan.updated', { date: formatInstructionUpdatedLabel(selectedInstruction.updatedAt) })}
                    </p>
                  </div>
                  {selectedInstruction.instructionType === 'written_note' ? (
                    <p className="whitespace-pre-wrap typo-body leading-relaxed text-slate-700 dark:text-slate-200">
                      {selectedInstruction.noteBody.trim() ? selectedInstruction.noteBody : t('vault.instructions.previewEmptyNote')}
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
                              <p className="mb-2 typo-body-sm-strong text-slate-900 dark:text-slate-100">
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
                  <div className="space-y-3 border-t border-slate-200 pt-6 dark:border-ep-border-card">
                    <p className="typo-caption-emphasis uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('vault.instructions.previewAttachmentsHeading')}
                    </p>
                    <div className="flex flex-col gap-3">
                      {attachedDocumentId ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 px-3 py-3 dark:border-ep-border-card sm:px-4">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <Paperclip className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                            <div className="min-w-0">
                              <p className="truncate typo-body-sm-strong text-slate-900 dark:text-slate-100">
                                {attachedDocument?.name ?? t('vault.instructions.missingDocument')}
                              </p>
                              {attachedDocument?.subtitle ? (
                                <p className="truncate typo-caption text-slate-500 dark:text-slate-400">
                                  {attachedDocument.subtitle}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          {attachedDocument ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-8 shrink-0 px-3"
                              onClick={() => void onViewDocument(attachedDocument)}
                            >
                              {t('vault.instructions.viewDocument')}
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                      {linkedAssetId ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 px-3 py-3 dark:border-ep-border-card sm:px-4">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <Package className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                            <div className="min-w-0">
                              <p className="truncate typo-body-sm-strong text-slate-900 dark:text-slate-100">
                                {linkedAsset?.label ?? t('vault.instructions.missingAsset')}
                              </p>
                              <p className="truncate typo-caption text-slate-500 dark:text-slate-400">
                                {linkedAsset?.subtitle || t('vault.instructions.noSubtitle')}
                              </p>
                            </div>
                          </div>
                          {linkedAsset ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-8 shrink-0 px-3"
                              onClick={() => onViewAsset(linkedAsset.id)}
                            >
                              {t('vault.instructions.viewAsset')}
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                      {linkedContactId ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 px-3 py-3 dark:border-ep-border-card sm:px-4">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <User className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                            <div className="min-w-0">
                              <p className="truncate typo-body-sm-strong text-slate-900 dark:text-slate-100">
                                {linkedContact?.label ?? t('vault.instructions.missingContact')}
                              </p>
                              <p className="truncate typo-caption text-slate-500 dark:text-slate-400">
                                {linkedContact?.subtitle || t('vault.instructions.noContactSubtitle')}
                              </p>
                            </div>
                          </div>
                          {linkedContact ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-8 shrink-0 px-3"
                              onClick={() => onViewContact(linkedContact.id)}
                            >
                              {t('vault.instructions.viewContact')}
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </InstructionPreviewSheet>
          )
        })()
      ) : routeMode === 'edit' && selectedInstruction ? (
        <InstructionEditorChrome
          footerStart={
            <button
              type="button"
              onClick={() => setInstructionPendingDelete(selectedInstruction)}
              className="inline-flex h-9 items-center gap-2 rounded-md px-3 typo-body-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
              {t('vault.instructions.delete')}
            </button>
          }
          footerEnd={
            <>
              <Button type="button" variant="secondary" onClick={() => onOpenPreview(selectedInstruction.id)}>
                {t('common.cancel')}
              </Button>
              <Button type="button" loading={isSaving} onClick={() => void saveFromEditPage()} className="gap-2">
                <Save className="h-4 w-4 shrink-0" aria-hidden />
                {t('vault.instructions.saveChangesCta')}
              </Button>
            </>
          }
        >
          <InstructionFormFields
            form={form}
            assetOptions={assetOptions}
            contactOptions={contactOptions}
            filteredAssetOptions={filteredAssetOptions}
            assetSearch={assetSearch}
            selectedAsset={selectedAsset}
            selectedDocument={selectedDocument}
            selectedContact={selectedContact}
            onAssetSearch={setAssetSearch}
            onSetLinkedAsset={setLinkedAsset}
            onSetLinkedContact={setLinkedContact}
            onUpdateForm={updateForm}
            onUpdateStep={updateStep}
            onAddStep={addStep}
            onRemoveStep={removeStep}
            onOpenDocumentPicker={() => setIsDocumentPickerOpen(true)}
            titleError={titleError}
            titleInputRef={titleInputRef}
            noteError={noteError}
            noteInputRef={noteInputRef}
            stepsError={stepsError}
            stepsExpandStepId={stepsExpandStepId}
            showTypeSelector={false}
            formLayoutVariant="editor"
            showReadOnlyFormatBadge
            isDocumentPickerOpen={isDocumentPickerOpen}
            onCloseDocumentPicker={() => setIsDocumentPickerOpen(false)}
            documentFoldersForPicker={documentFolders}
            documentOptionsForPicker={documentOptions}
            isDocumentsBusy={isDocumentsBusy}
            canManageDocuments={canManageDocuments}
            onCreateDocumentFolder={onCreateDocumentFolder}
            onUploadDocumentToFolder={onUploadDocumentToFolder}
          />
        </InstructionEditorChrome>
      ) : (
        <Card>
          <div className="p-6 typo-body-sm text-slate-500 dark:text-slate-400">{t('vault.instructions.previewPlaceholder')}</div>
        </Card>
      )}

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

type InstructionFormFieldsProps = {
  form: InstructionFormState
  assetOptions: InstructionAssetOption[]
  contactOptions: InstructionContactOption[]
  filteredAssetOptions: InstructionAssetOption[]
  assetSearch: string
  selectedAsset: InstructionAssetOption | null | undefined
  selectedDocument: InstructionDocumentOption | null | undefined
  selectedContact: InstructionContactOption | null | undefined
  onAssetSearch: (value: string) => void
  onSetLinkedAsset: (assetID: string | null) => void
  onSetLinkedContact: (contactID: string | null) => void
  onUpdateForm: Dispatch<SetStateAction<InstructionFormState>>
  onUpdateStep: (stepID: string, patch: { text?: string; title?: string }) => void
  onAddStep: () => void
  onRemoveStep: (stepID: string) => void
  onOpenDocumentPicker: () => void
  titleError?: string | null
  titleInputRef?: RefObject<HTMLInputElement | null>
  noteError?: string | null
  noteInputRef?: RefObject<HTMLTextAreaElement | null>
  stepsError?: string | null
  stepsExpandStepId?: string | null
  showTypeSelector?: boolean
  typeSelectorPresentation?: 'default' | 'featured'
  /** Larger title + roomier note/steps (edit screen). */
  formLayoutVariant?: 'default' | 'editor'
  /** Design-style format pill (written vs steps) when type is fixed — not shown with the type tile selector. */
  showReadOnlyFormatBadge?: boolean
  isDocumentPickerOpen: boolean
  onCloseDocumentPicker: () => void
  documentFoldersForPicker: InstructionDocumentFolderOption[]
  documentOptionsForPicker: InstructionDocumentOption[]
  isDocumentsBusy?: boolean
  canManageDocuments: boolean
  onCreateDocumentFolder: (name: string, parentFolderId: string | null) => Promise<string | null>
  onUploadDocumentToFolder: (folderId: string, file: File) => Promise<InstructionLinkedDocument | null>
}

function InstructionFormFields({
  form,
  assetOptions,
  contactOptions,
  filteredAssetOptions,
  assetSearch,
  selectedAsset,
  selectedDocument,
  selectedContact,
  onAssetSearch,
  onSetLinkedAsset,
  onSetLinkedContact,
  onUpdateForm,
  onUpdateStep,
  onAddStep,
  onRemoveStep,
  onOpenDocumentPicker,
  titleError = null,
  titleInputRef,
  noteError = null,
  noteInputRef,
  stepsError = null,
  stepsExpandStepId = null,
  showTypeSelector = true,
  typeSelectorPresentation = 'default',
  formLayoutVariant = 'default',
  showReadOnlyFormatBadge = false,
  isDocumentPickerOpen,
  onCloseDocumentPicker,
  documentFoldersForPicker,
  documentOptionsForPicker,
  isDocumentsBusy = false,
  canManageDocuments,
  onCreateDocumentFolder,
  onUploadDocumentToFolder,
}: InstructionFormFieldsProps) {
  const { t } = useTranslation()
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null)
  const stepsSectionRef = useRef<HTMLDivElement>(null)
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false)
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [assetModalSearch, setAssetModalSearch] = useState('')
  const [contactModalSearch, setContactModalSearch] = useState('')
  const documentsFilesForPicker = useMemo(
    () =>
      documentOptionsForPicker.map((doc) => ({
        id: doc.id,
        name: doc.name,
        folderId: doc.folderId,
        originalSizeBytes: doc.sizeBytes,
      })),
    [documentOptionsForPicker],
  )

  const resolvedExpandedStepId =
    formLayoutVariant === 'editor' && form.instructionType === 'step_by_step'
      ? stepsError && stepsExpandStepId
        ? stepsExpandStepId
        : expandedStepId == null
          ? null
          : form.steps.some((step) => step.id === expandedStepId)
            ? expandedStepId
            : (form.steps[0]?.id ?? null)
      : expandedStepId

  useEffect(() => {
    if (!stepsError) return
    stepsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const firstStepId = form.steps[0]?.id
    if (!firstStepId) return
    if (formLayoutVariant === 'editor' && resolvedExpandedStepId !== firstStepId) return
    const stepField =
      document.getElementById(`vault-instruction-step-title-${firstStepId}`) ??
      document.getElementById(`vault-instruction-step-body-${firstStepId}`)
    stepField?.focus()
  }, [form.steps, formLayoutVariant, resolvedExpandedStepId, stepsError])

  const filteredAssetOptionsForModal = useMemo(() => {
    const normalized = assetModalSearch.trim().toLowerCase()
    if (!normalized) return assetOptions
    return assetOptions.filter((option) => {
      return option.label.toLowerCase().includes(normalized) || option.subtitle.toLowerCase().includes(normalized)
    })
  }, [assetModalSearch, assetOptions])
  const filteredContactOptionsForModal = useMemo(() => {
    const normalized = contactModalSearch.trim().toLowerCase()
    if (!normalized) return contactOptions
    return contactOptions.filter((option) => {
      return option.label.toLowerCase().includes(normalized) || option.subtitle.toLowerCase().includes(normalized)
    })
  }, [contactModalSearch, contactOptions])

  return (
    <>
    <div
      className={
        formLayoutVariant === 'editor'
          ? 'flex min-h-[calc(100dvh-6rem)] w-full flex-col gap-8 bg-white px-8 py-10 shadow-[0_1px_3px_rgba(15,23,42,0.08),0_8px_24px_rgba(15,23,42,0.06)] dark:bg-ep-surface-subtle dark:shadow-[0_1px_3px_rgba(0,0,0,0.35),0_8px_24px_rgba(0,0,0,0.25)] sm:px-10 sm:py-12'
          : 'flex flex-col gap-5'
      }
    >
      {showTypeSelector ? (
        typeSelectorPresentation === 'featured' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onUpdateForm((current) => ({ ...current, instructionType: 'written_note' }))}
              className={`flex flex-col gap-3 rounded-xl border p-5 text-left transition ${
                form.instructionType === 'written_note'
                  ? 'border-ep-primary bg-ep-primary-softer/80 shadow-sm dark:border-ep-primary-accent dark:bg-ep-primary-darker/40'
                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40'
              }`}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-ep-surface-panel"
                aria-hidden
              >
                <FileText className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <p className="typo-caption-emphasis uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('vault.instructions.formatLabel')}
                </p>
                <p className="mt-1 typo-body-sm-strong text-slate-900 dark:text-slate-100">{t('vault.instructions.type.written')}</p>
                <p className="mt-2 typo-caption text-slate-600 dark:text-slate-400">{t('vault.instructions.type.writtenHint')}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onUpdateForm((current) => ({ ...current, instructionType: 'step_by_step' }))}
              className={`flex flex-col gap-3 rounded-xl border p-5 text-left transition ${
                form.instructionType === 'step_by_step'
                  ? 'border-ep-primary bg-ep-primary-softer/80 shadow-sm dark:border-ep-primary-accent dark:bg-ep-primary-darker/40'
                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40'
              }`}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-ep-primary-softer dark:bg-ep-primary-darker/50"
                aria-hidden
              >
                <List className="h-5 w-5 text-ep-primary-accent dark:text-ep-primary-soft" />
              </div>
              <div>
                <p className="typo-caption-emphasis uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('vault.instructions.formatLabel')}
                </p>
                <p className="mt-1 typo-body-sm-strong text-slate-900 dark:text-slate-100">
                  {t('vault.instructions.type.stepByStep')}
                </p>
                <p className="mt-2 typo-caption text-slate-600 dark:text-slate-400">{t('vault.instructions.type.stepByStepHint')}</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onUpdateForm((current) => ({ ...current, instructionType: 'written_note' }))}
              className={`flex gap-3 rounded-lg border p-3 text-left ${
                form.instructionType === 'written_note'
                  ? 'border-ep-primary bg-ep-primary-softer dark:border-ep-primary-accent dark:bg-ep-primary/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span
                aria-hidden
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-200/90 dark:bg-slate-700"
              >
                <NotebookPen className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </span>
              <div className="min-w-0">
                <p className="typo-body-sm-strong text-slate-900 dark:text-slate-100">{t('vault.instructions.type.written')}</p>
                <p className="typo-caption text-slate-500 dark:text-slate-400">{t('vault.instructions.type.writtenHint')}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onUpdateForm((current) => ({ ...current, instructionType: 'step_by_step' }))}
              className={`flex gap-3 rounded-lg border p-3 text-left ${
                form.instructionType === 'step_by_step'
                  ? 'border-ep-primary bg-ep-primary-softer dark:border-ep-primary-accent dark:bg-ep-primary/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span
                aria-hidden
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-200/90 dark:bg-slate-700"
              >
                <ListOrdered className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </span>
              <div className="min-w-0">
                <p className="typo-body-sm-strong text-slate-900 dark:text-slate-100">{t('vault.instructions.type.stepByStep')}</p>
                <p className="typo-caption text-slate-500 dark:text-slate-400">{t('vault.instructions.type.stepByStepHint')}</p>
              </div>
            </button>
          </div>
        )
      ) : null}

      {showReadOnlyFormatBadge && formLayoutVariant === 'editor' ? (
        <div
          className="mb-6 inline-flex w-fit self-start items-center gap-1.5 rounded-lg border border-ep-primary-soft bg-ep-primary-softer px-3 py-1.5 typo-caption-emphasis text-ep-primary-dark dark:border-ep-primary-dark/80 dark:bg-ep-primary-darker/40 dark:text-ep-primary-soft"
          role="status"
        >
          {form.instructionType === 'written_note'
            ? t('vault.instructions.type.written')
            : t('vault.instructions.type.stepByStep')}
        </div>
      ) : null}

      {formLayoutVariant === 'editor' ? (
        <div className="space-y-2">
          <label htmlFor="vault-instruction-editor-title" className="sr-only">
            {t('vault.instructions.form.title')}
          </label>
          <input
            ref={titleInputRef}
            id="vault-instruction-editor-title"
            type="text"
            value={form.title}
            onChange={(event) => onUpdateForm((current) => ({ ...current, title: event.target.value }))}
            placeholder={t('vault.instructions.form.titlePlaceholder')}
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? 'vault-instruction-editor-title-error' : undefined}
            className={`w-full border-0 border-b bg-transparent typo-heading-page text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-600 ${
              titleError
                ? 'border-red-500 focus:border-red-500 dark:border-red-400 dark:focus:border-red-400'
                : 'border-slate-200 focus:border-ep-primary dark:border-slate-600 dark:focus:border-ep-primary-accent'
            } ${form.instructionType === 'written_note' ? 'pb-2' : 'pb-3'}`}
          />
          {titleError ? (
            <p id="vault-instruction-editor-title-error" className="typo-body-sm text-red-600 dark:text-red-400">
              {titleError}
            </p>
          ) : null}
        </div>
      ) : (
        <Input
          ref={titleInputRef}
          label={t('vault.instructions.form.title')}
          value={form.title}
          onChange={(event) => onUpdateForm((current) => ({ ...current, title: event.target.value }))}
          placeholder={t('vault.instructions.form.titlePlaceholder')}
          error={titleError}
        />
      )}

      {!(formLayoutVariant === 'editor' && form.instructionType === 'written_note') ? (
      <div className={`space-y-2 ${formLayoutVariant === 'editor' && form.instructionType === 'step_by_step' ? 'order-3' : ''}`}>
        {formLayoutVariant !== 'editor' ? (
          <p className="typo-body-sm-strong text-slate-900 dark:text-slate-100">
            {t('vault.instructions.linkedAssets')} <span className="typo-caption text-slate-400">({t('common.optional')})</span>
          </p>
        ) : null}
        {formLayoutVariant !== 'editor' && selectedAsset ? (
          <div className="flex items-center justify-between gap-3 border border-slate-300 bg-slate-100/70 px-3 py-2 dark:border-slate-700 dark:bg-ep-primary-dark/40">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-200/90 dark:bg-slate-700"
              >
                <Package className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </span>
              <div className="min-w-0">
                <p className="truncate typo-body-sm-strong text-slate-900 dark:text-slate-100">{selectedAsset.label}</p>
                <p className="truncate typo-caption text-slate-500 dark:text-slate-400">
                  {selectedAsset.subtitle || t('vault.instructions.noSubtitle')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSetLinkedAsset(null)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              aria-label={t('common.remove')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : formLayoutVariant !== 'editor' ? (
          <>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    value={assetSearch}
                    onChange={(event) => onAssetSearch(event.target.value)}
                    placeholder={t('vault.assets.attachments.searchDocumentsPlaceholder')}
                    className="h-9 w-full border-0 bg-transparent p-0 typo-body text-slate-700 outline-none placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
              {assetSearch.trim().length > 0 ? (
                <div className="space-y-1 px-3 py-2">
                  {assetOptions.length === 0 ? (
                    <p className="typo-body-sm text-slate-500 dark:text-slate-400">{t('vault.instructions.noAssets')}</p>
                  ) : filteredAssetOptions.length === 0 ? (
                    <p className="typo-body-sm text-slate-500 dark:text-slate-400">{t('vault.assets.attachments.searchNoResults')}</p>
                  ) : (
                    filteredAssetOptions.map((asset) => (
                      <label key={asset.id} className="flex cursor-pointer items-center gap-2.5 py-0.5">
                        <span
                          aria-hidden
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-200/90 dark:bg-slate-700"
                        >
                          <Package className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </span>
                        <input
                          type="radio"
                          name="instruction-linked-asset"
                          className="shrink-0"
                          checked={form.linkedAssetIds[0] === asset.id}
                          onChange={() => onSetLinkedAsset(asset.id)}
                        />
                        <span className="min-w-0">
                          <span className="block typo-body-sm-strong text-slate-800 dark:text-slate-100">{asset.label}</span>
                          <span className="block typo-caption text-slate-500 dark:text-slate-400">
                            {asset.subtitle || t('vault.instructions.noSubtitle')}
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
      ) : null}

      {!(formLayoutVariant === 'editor' && form.instructionType === 'written_note') ? (
      <div className={`space-y-2 ${formLayoutVariant === 'editor' && form.instructionType === 'step_by_step' ? 'order-4' : ''}`}>
        {formLayoutVariant !== 'editor' ? (
          <p className="typo-body-sm-strong text-slate-900 dark:text-slate-100">
            {t('vault.instructions.attachedDocument')} <span className="typo-caption text-slate-400">({t('common.optional')})</span>
          </p>
        ) : null}
        {formLayoutVariant !== 'editor' && selectedDocument ? (
          <div className="flex items-center justify-between gap-3 border border-slate-300 bg-slate-100/70 px-3 py-2 dark:border-slate-700 dark:bg-ep-primary-dark/40">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-200/90 dark:bg-slate-700"
              >
                <FileText className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </span>
              <div className="min-w-0">
                <p className="truncate typo-body-sm-strong text-slate-900 dark:text-slate-100">{selectedDocument.name}</p>
                <p className="truncate typo-caption text-slate-500 dark:text-slate-400">{selectedDocument.subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateForm((current) => ({ ...current, attachedDocumentId: null }))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              aria-label={t('common.remove')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : formLayoutVariant !== 'editor' ? (
          <AssetAttachmentCell
            value=""
            label={undefined}
            onOpen={onOpenDocumentPicker}
            onDelete={() => onUpdateForm((current) => ({ ...current, attachedDocumentId: null }))}
          />
        ) : null}
        {formLayoutVariant !== 'editor' && isDocumentPickerOpen ? (
          <AssetAttachmentDocumentPickerPanel
            variant="embedded"
            className="mt-2"
            isBusy={isDocumentsBusy}
            hasValue={!!selectedDocument}
            existingDocumentName={selectedDocument?.name ?? null}
            documentsFolders={documentFoldersForPicker}
            documentsFiles={documentsFilesForPicker}
            canManageDocuments={canManageDocuments}
            onLinkDocument={(file) => {
              onUpdateForm((current) => ({ ...current, attachedDocumentId: file.id }))
              onCloseDocumentPicker()
            }}
            onCreateDocumentsFolder={onCreateDocumentFolder}
            onUploadDocumentToFolder={async (folderId, file) => {
              const meta = await onUploadDocumentToFolder(folderId, file)
              if (!meta) return null
              return { id: meta.id, name: meta.name, folderId: meta.folderId }
            }}
            onDeleteCurrent={() => onUpdateForm((current) => ({ ...current, attachedDocumentId: null }))}
            onCancel={onCloseDocumentPicker}
          />
        ) : null}
      </div>
      ) : null}

      {form.instructionType === 'written_note' ? (
        <div
          className={
            formLayoutVariant === 'editor' ? 'order-2 mt-0 flex min-h-0 flex-1 flex-col' : ''
          }
        >
          <label
            className={`block text-slate-900 dark:text-slate-100 ${
              formLayoutVariant === 'editor'
                ? 'mb-1 shrink-0 typo-caption-emphasis uppercase tracking-wide text-slate-500 dark:text-slate-400'
                : 'mb-2 typo-body-sm-strong'
            }`}
            htmlFor="vault-instruction-editor-note"
          >
            {t('vault.instructions.form.note')}
          </label>
          <textarea
            ref={noteInputRef}
            id="vault-instruction-editor-note"
            value={form.noteBody}
            onChange={(event) =>
              onUpdateForm((current) => ({
                ...current,
                noteBody: event.target.value,
              }))
            }
            rows={formLayoutVariant === 'editor' ? 24 : 8}
            placeholder={t('vault.instructions.form.notePlaceholder')}
            aria-invalid={noteError ? true : undefined}
            aria-describedby={noteError ? 'vault-instruction-editor-note-error' : undefined}
            className={
              formLayoutVariant === 'editor'
                ? `min-h-[calc(100dvh-22rem)] w-full flex-1 resize-y border-0 bg-transparent px-0 py-0 typo-body leading-relaxed text-slate-800 outline-none ring-0 placeholder:text-slate-300 focus:outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-600 ${
                    noteError
                      ? 'rounded-lg ring-2 ring-red-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                      : ''
                  }`
                : `w-full rounded-lg border bg-white px-3 py-2 typo-body text-slate-700 outline-none focus:ring-2 focus:ring-offset-1 dark:bg-slate-900 dark:text-slate-100 ${
                    noteError
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-500'
                      : 'border-slate-200 focus:border-ep-primary-accent dark:border-slate-700'
                  }`
            }
          />
          {noteError ? (
            <p id="vault-instruction-editor-note-error" className="mt-1.5 shrink-0 typo-body-sm text-red-600 dark:text-red-400">
              {noteError}
            </p>
          ) : null}
        </div>
      ) : (
        <div ref={stepsSectionRef} className={formLayoutVariant === 'editor' ? 'order-2 space-y-4' : 'space-y-4'}>
          <p
            className={
              formLayoutVariant === 'editor'
                ? 'typo-caption-emphasis uppercase tracking-wide text-slate-500 dark:text-slate-400'
                : 'typo-body-sm-strong text-slate-900 dark:text-slate-100'
            }
          >
            {t('vault.instructions.form.steps')}
          </p>
          {stepsError ? (
            <p id="vault-instruction-steps-error" className="typo-body-sm text-red-600 dark:text-red-400">
              {stepsError}
            </p>
          ) : null}
          <div
            aria-describedby={stepsError ? 'vault-instruction-steps-error' : undefined}
            className={`${formLayoutVariant === 'editor' ? 'flex flex-col gap-4' : 'space-y-3'} ${
              stepsError ? 'rounded-lg ring-2 ring-red-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''
            }`}
          >
            {form.steps.map((step, index) => (
              formLayoutVariant === 'editor' ? (
                <div
                  key={step.id}
                  className={`rounded-xl border bg-white transition dark:bg-ep-surface-subtle ${
                      resolvedExpandedStepId === step.id
                      ? 'border-ep-primary-soft shadow-[0_2px_8px_rgba(79,70,229,0.08)] dark:border-ep-primary-accent/50'
                      : 'border-slate-200 dark:border-ep-border-card'
                  }`}
                >
                  <div className="flex items-center gap-3 p-4">
                    <GripVertical className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden />
                    <span
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full typo-caption-emphasis ${
                        resolvedExpandedStepId === step.id
                          ? 'bg-ep-primary text-white dark:bg-ep-primary'
                          : 'bg-slate-100 text-slate-600 dark:bg-ep-surface dark:text-slate-300'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      className={`min-w-0 flex-1 text-left typo-body-sm-strong ${
                        instructionStepCollapsedSummary(step)
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'italic text-slate-400 dark:text-slate-500'
                      }`}
                      onClick={() => setExpandedStepId((current) => (current === step.id ? null : step.id))}
                    >
                      {instructionStepCollapsedSummary(step) || t('vault.instructions.form.untitledStep')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedStepId((current) => (current === step.id ? null : step.id))}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-ep-primary-dark/40 dark:hover:text-slate-200"
                      aria-label={t('common.expandSidebar')}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${resolvedExpandedStepId === step.id ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </button>
                  </div>
                  {resolvedExpandedStepId === step.id ? (
                    <div className="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3 dark:border-ep-border-card">
                      <label className="sr-only" htmlFor={`vault-instruction-step-title-${step.id}`}>
                        {t('vault.instructions.form.stepTitle')}
                      </label>
                      <input
                        id={`vault-instruction-step-title-${step.id}`}
                        type="text"
                        value={step.title}
                        onChange={(event) => onUpdateStep(step.id, { title: event.target.value })}
                        placeholder={t('vault.instructions.form.stepTitlePlaceholder')}
                        className="ep-input-field py-2 typo-body-sm"
                      />
                      <label className="sr-only" htmlFor={`vault-instruction-step-body-${step.id}`}>
                        {t('vault.instructions.form.stepDescription')}
                      </label>
                      <textarea
                        id={`vault-instruction-step-body-${step.id}`}
                        value={step.text}
                        onChange={(event) => onUpdateStep(step.id, { text: event.target.value })}
                        rows={5}
                        placeholder={t('vault.instructions.form.stepPlaceholder')}
                        className="ep-input-field resize-y py-2 leading-relaxed"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => onRemoveStep(step.id)}
                          disabled={form.steps.length <= 1}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-ep-border-card dark:bg-ep-surface dark:text-slate-300 dark:hover:border-ep-primary/40"
                          aria-label={t('common.remove')}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div key={step.id} className="flex items-start gap-2.5">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 typo-caption-emphasis text-slate-100 dark:bg-slate-600">
                    {index + 1}
                  </span>
                  <div className="flex flex-1 flex-col gap-2 rounded-md bg-slate-100 px-3 py-2 dark:bg-ep-primary-dark/60">
                    <input
                      type="text"
                      value={step.title}
                      onChange={(event) => onUpdateStep(step.id, { title: event.target.value })}
                      placeholder={t('vault.instructions.form.stepTitlePlaceholder')}
                      className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 typo-body-sm text-slate-900 outline-none focus:border-ep-primary-accent dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <textarea
                      value={step.text}
                      onChange={(event) => onUpdateStep(step.id, { text: event.target.value })}
                      rows={3}
                      placeholder={t('vault.instructions.form.stepPlaceholder')}
                      className="w-full resize-y cursor-text bg-transparent typo-body text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveStep(step.id)}
                    disabled={form.steps.length <= 1}
                    className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-slate-300 bg-white text-slate-500 transition hover:border-slate-400 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
                    aria-label={t('common.remove')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )
            ))}
          </div>
          {formLayoutVariant === 'editor' ? (
            <button
              type="button"
              onClick={onAddStep}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-100 px-4 typo-body-sm-strong text-slate-600 transition hover:border-ep-primary hover:bg-ep-primary-softer hover:text-ep-primary-accent dark:border-slate-600 dark:bg-ep-surface-panel dark:text-slate-300 dark:hover:border-ep-primary-accent dark:hover:bg-ep-primary-darker/30 dark:hover:text-ep-primary-soft"
            >
              <ListPlus className="h-4 w-4 shrink-0" aria-hidden />
              {t('vault.instructions.form.addStep')}
            </button>
          ) : (
            <Button type="button" variant="secondary" className="h-9 gap-2 border-dashed px-3" onClick={onAddStep}>
              <ListPlus className="h-4 w-4 shrink-0" aria-hidden />
              {t('vault.instructions.form.addStep')}
            </Button>
          )}
        </div>
      )}
    </div>

      {formLayoutVariant === 'editor' ? (
        <div className="space-y-3">
          {selectedDocument || selectedAsset || selectedContact ? (
            <div className="flex flex-wrap gap-2">
              {selectedDocument ? (
                <div
                  title={[selectedDocument.name, selectedDocument.subtitle].filter(Boolean).join(' — ')}
                  className="inline-flex max-w-48 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-600 dark:bg-slate-900 sm:max-w-52"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate typo-body-sm-strong text-slate-900 dark:text-slate-100">{selectedDocument.name}</p>
                      <p className="truncate typo-caption text-slate-500 dark:text-slate-400">{selectedDocument.subtitle}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateForm((current) => ({ ...current, attachedDocumentId: null }))}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                    aria-label={t('common.remove')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
              {selectedAsset ? (
                <div
                  title={[selectedAsset.label, selectedAsset.subtitle || t('vault.instructions.noSubtitle')].join(' — ')}
                  className="inline-flex max-w-48 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-600 dark:bg-slate-900 sm:max-w-52"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    <Package className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate typo-body-sm-strong text-slate-900 dark:text-slate-100">{selectedAsset.label}</p>
                      <p className="truncate typo-caption text-slate-500 dark:text-slate-400">
                        {selectedAsset.subtitle || t('vault.instructions.noSubtitle')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSetLinkedAsset(null)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                    aria-label={t('common.remove')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
              {selectedContact ? (
                <div
                  title={[selectedContact.label, selectedContact.subtitle || t('vault.instructions.noContactSubtitle')].join(' — ')}
                  className="inline-flex max-w-48 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-600 dark:bg-slate-900 sm:max-w-52"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    <User className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate typo-body-sm-strong text-slate-900 dark:text-slate-100">{selectedContact.label}</p>
                      <p className="truncate typo-caption text-slate-500 dark:text-slate-400">
                        {selectedContact.subtitle || t('vault.instructions.noContactSubtitle')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSetLinkedContact(null)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                    aria-label={t('common.remove')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-ep-border-card dark:bg-ep-surface-subtle dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
            <p className="typo-caption-emphasis uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t('vault.instructions.previewAttachmentsHeading')}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setIsDocumentModalOpen(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 typo-body-sm text-slate-600 transition hover:border-ep-primary hover:bg-ep-primary-softer hover:text-ep-primary-accent dark:border-slate-600 dark:bg-ep-surface dark:text-slate-300 dark:hover:border-ep-primary-accent dark:hover:bg-ep-primary-darker/30 dark:hover:text-ep-primary-soft"
              >
                <FileText className="h-4 w-4 shrink-0" aria-hidden />
                {t('vault.instructions.attachDocument')}
              </button>
              <button
                type="button"
                onClick={() => setIsAssetModalOpen(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 typo-body-sm text-slate-600 transition hover:border-ep-primary hover:bg-ep-primary-softer hover:text-ep-primary-accent dark:border-slate-600 dark:bg-ep-surface dark:text-slate-300 dark:hover:border-ep-primary-accent dark:hover:bg-ep-primary-darker/30 dark:hover:text-ep-primary-soft"
              >
                <Package className="h-4 w-4 shrink-0" aria-hidden />
                {t('vault.instructions.attachAsset')}
              </button>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 typo-body-sm text-slate-600 transition hover:border-ep-primary hover:bg-ep-primary-softer hover:text-ep-primary-accent dark:border-slate-600 dark:bg-ep-surface dark:text-slate-300 dark:hover:border-ep-primary-accent dark:hover:bg-ep-primary-darker/30 dark:hover:text-ep-primary-soft"
              >
                <User className="h-4 w-4 shrink-0" aria-hidden />
                {t('vault.instructions.attachContact')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {formLayoutVariant === 'editor' && isAssetModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-ep-border-card dark:bg-ep-surface">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/80 px-5 py-4 dark:border-ep-border-card dark:bg-ep-surface-subtle">
              <h3 className="typo-heading-subcard text-slate-900 dark:text-slate-100">{t('vault.instructions.linkedAssets')}</h3>
              <button
                type="button"
                onClick={() => setIsAssetModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-ep-primary-dark/50 dark:hover:text-slate-100"
                aria-label={t('common.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-ep-border-card dark:bg-ep-surface-subtle">
                <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={assetModalSearch}
                  onChange={(event) => setAssetModalSearch(event.target.value)}
                  placeholder={t('vault.assets.attachments.searchDocumentsPlaceholder')}
                  className="h-8 w-full border-0 bg-transparent p-0 typo-body text-slate-700 outline-none placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="max-h-[360px] overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 dark:border-ep-border-card dark:bg-ep-surface-subtle">
                {filteredAssetOptionsForModal.length > 0 ? (
                  <div className="space-y-1">
                    {filteredAssetOptionsForModal.map((asset) => {
                      const isSelected = form.linkedAssetIds[0] === asset.id
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => {
                            onSetLinkedAsset(asset.id)
                            setIsAssetModalOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition',
                            isSelected
                              ? 'bg-ep-primary-softer text-ep-primary-accent dark:bg-ep-primary/20 dark:text-ep-primary-muted'
                              : 'hover:bg-slate-100 dark:hover:bg-ep-primary-dark/40',
                          )}
                        >
                          <Package
                            className={cn(
                              'h-4 w-4 shrink-0',
                              isSelected
                                ? 'text-ep-primary dark:text-ep-primary-muted'
                                : 'text-slate-500 dark:text-slate-400',
                            )}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'truncate typo-body-sm-strong',
                                isSelected
                                  ? undefined
                                  : 'text-slate-900 dark:text-slate-100',
                              )}
                            >
                              {asset.label}
                            </p>
                            <p
                              className={cn(
                                'truncate typo-caption',
                                isSelected
                                  ? 'text-ep-primary/80 dark:text-ep-primary-muted/80'
                                  : 'text-slate-500 dark:text-slate-400',
                              )}
                            >
                              {asset.subtitle || t('vault.instructions.noSubtitle')}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="p-2 typo-body-sm text-slate-500 dark:text-slate-400">{t('vault.assets.attachments.searchNoResults')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {formLayoutVariant === 'editor' && isDocumentModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-ep-border-card dark:bg-ep-surface">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/80 px-5 py-4 dark:border-ep-border-card dark:bg-ep-surface-subtle">
              <h3 className="typo-heading-subcard text-slate-900 dark:text-slate-100">{t('vault.instructions.attachedDocument')}</h3>
              <button
                type="button"
                onClick={() => setIsDocumentModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-ep-primary-dark/50 dark:hover:text-slate-100"
                aria-label={t('common.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <AssetAttachmentDocumentPickerPanel
                variant="embedded"
                isBusy={isDocumentsBusy}
                hasValue={!!selectedDocument}
                existingDocumentName={selectedDocument?.name ?? null}
                documentsFolders={documentFoldersForPicker}
                documentsFiles={documentsFilesForPicker}
                canManageDocuments={canManageDocuments}
                onLinkDocument={(file) => {
                  onUpdateForm((current) => ({ ...current, attachedDocumentId: file.id }))
                  setIsDocumentModalOpen(false)
                }}
                onCreateDocumentsFolder={onCreateDocumentFolder}
                onUploadDocumentToFolder={async (folderId, file) => {
                  const meta = await onUploadDocumentToFolder(folderId, file)
                  if (!meta) return null
                  return { id: meta.id, name: meta.name, folderId: meta.folderId }
                }}
                onDeleteCurrent={() => onUpdateForm((current) => ({ ...current, attachedDocumentId: null }))}
                onCancel={() => setIsDocumentModalOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}

      {formLayoutVariant === 'editor' && isContactModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-ep-border-card dark:bg-ep-surface">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/80 px-5 py-4 dark:border-ep-border-card dark:bg-ep-surface-subtle">
              <h3 className="typo-heading-subcard text-slate-900 dark:text-slate-100">{t('vault.instructions.attachContact')}</h3>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-ep-primary-dark/50 dark:hover:text-slate-100"
                aria-label={t('common.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-ep-border-card dark:bg-ep-surface-subtle">
                <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={contactModalSearch}
                  onChange={(event) => setContactModalSearch(event.target.value)}
                  placeholder={t('vault.instructions.searchContactsPlaceholder')}
                  className="h-8 w-full border-0 bg-transparent p-0 typo-body text-slate-700 outline-none placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="max-h-[360px] overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 dark:border-ep-border-card dark:bg-ep-surface-subtle">
                {filteredContactOptionsForModal.length > 0 ? (
                  <div className="space-y-1">
                    {filteredContactOptionsForModal.map((contact) => {
                      const isSelected = form.linkedContactId === contact.id
                      return (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => {
                            onSetLinkedContact(contact.id)
                            setIsContactModalOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition',
                            isSelected
                              ? 'bg-ep-primary-softer text-ep-primary-accent dark:bg-ep-primary/20 dark:text-ep-primary-muted'
                              : 'hover:bg-slate-100 dark:hover:bg-ep-primary-dark/40',
                          )}
                        >
                          <User
                            className={cn(
                              'h-4 w-4 shrink-0',
                              isSelected
                                ? 'text-ep-primary dark:text-ep-primary-muted'
                                : 'text-slate-500 dark:text-slate-400',
                            )}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'truncate typo-body-sm-strong',
                                isSelected ? undefined : 'text-slate-900 dark:text-slate-100',
                              )}
                            >
                              {contact.label}
                            </p>
                            <p
                              className={cn(
                                'truncate typo-caption',
                                isSelected
                                  ? 'text-ep-primary/80 dark:text-ep-primary-muted/80'
                                  : 'text-slate-500 dark:text-slate-400',
                              )}
                            >
                              {contact.subtitle || t('vault.instructions.noContactSubtitle')}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="p-2 typo-body-sm text-slate-500 dark:text-slate-400">
                    {contactOptions.length === 0
                      ? t('vault.instructions.noContacts')
                      : t('vault.assets.attachments.searchNoResults')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
