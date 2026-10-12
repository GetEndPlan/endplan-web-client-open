import { useEffect, useRef, useState } from 'react'
import type { ComponentProps } from 'react'
import { AlertTriangle, ArrowRightLeft, PencilLine } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { ActionDialogFrame, Button, Input } from '@/shared/ui'

type ButtonVariant = ComponentProps<typeof Button>['variant']
const DELETE_CONFIRMATION_TEXT = 'DELETE'
const ACTION_BUTTON_CLASSNAME = 'min-h-10 rounded-lg px-4 shadow-none'
const SECONDARY_ACTION_BUTTON_CLASSNAME =
  'bg-slate-100 text-slate-900 ring-1 ring-inset ring-slate-200 hover:bg-slate-200 dark:bg-ep-surface-subtle dark:text-slate-100 dark:ring-ep-border-card dark:hover:bg-ep-primary-dark/50'
const DIALOG_INPUT_CLASSNAME =
  'min-h-11 rounded-lg border-slate-200 bg-slate-50 px-3.5 dark:border-ep-border-card dark:bg-ep-surface-subtle'
function useDeleteConfirmation() {
  const [confirmationValue, setConfirmationValue] = useState('')

  return {
    confirmationValue,
    setConfirmationValue,
    hasConfirmedDelete:
      confirmationValue.trim().toUpperCase() === DELETE_CONFIRMATION_TEXT,
  }
}

function DocumentsDeleteConfirmationField({
  open,
  value,
  onChange,
}: {
  open: boolean
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const inputId = 'documents-delete-confirmation'

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  return (
    <div className="space-y-3">
      <label
        htmlFor={inputId}
        className="block typo-caption-emphasis uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200"
      >
        {t('vault.documentsManager.typeDeleteToConfirm')}
      </label>
      <Input
        id={inputId}
        ref={inputRef}
        value={value}
        placeholder={t('vault.documentsManager.typeDeletePlaceholder')}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        className={DIALOG_INPUT_CLASSNAME}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

type DocumentsTextInputDialogProps = {
  open: boolean
  title: string
  description: string
  label: string
  placeholder: string
  value: string
  submitLabel: string
  onChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
  isBusy?: boolean
  submitVariant?: ButtonVariant
}

export function DocumentsTextInputDialog({
  open,
  title,
  description,
  label,
  placeholder,
  value,
  submitLabel,
  onChange,
  onClose,
  onSubmit,
  isBusy = false,
  submitVariant = 'primary',
}: DocumentsTextInputDialogProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [open])

  if (!open) return null

  return (
    <ActionDialogFrame
      title={title}
      subtitle={t('vault.documentsManager.dialogStandardSubtitle')}
      description={description}
      onClose={onClose}
      icon={<PencilLine className="h-5 w-5" strokeWidth={2.2} />}
    >
      <Input
        ref={inputRef}
        label={label}
        value={value}
        placeholder={placeholder}
        className={DIALOG_INPUT_CLASSNAME}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && value.trim()) {
            event.preventDefault()
            onSubmit()
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
          }
        }}
      />
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          size="md"
          className={cn(ACTION_BUTTON_CLASSNAME, SECONDARY_ACTION_BUTTON_CLASSNAME)}
          onClick={onClose}
          disabled={isBusy}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          variant={submitVariant}
          size="md"
          className={ACTION_BUTTON_CLASSNAME}
          onClick={onSubmit}
          disabled={!value.trim() || isBusy}
          loading={isBusy}
        >
          {submitLabel}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}

type DocumentsConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  isBusy?: boolean
  confirmVariant?: ButtonVariant
}

export function DocumentsConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  isBusy = false,
  confirmVariant = 'danger',
}: DocumentsConfirmDialogProps) {
  const { t } = useTranslation()
  const { confirmationValue, setConfirmationValue, hasConfirmedDelete } = useDeleteConfirmation()

  if (!open) return null

  return (
    <ActionDialogFrame
      title={title}
      subtitle={t('vault.documentsManager.dialogDangerSubtitle')}
      description={description}
      onClose={onClose}
      icon={<AlertTriangle className="h-5 w-5" strokeWidth={2.2} />}
      tone="danger"
    >
      <DocumentsDeleteConfirmationField
        open={open}
        value={confirmationValue}
        onChange={setConfirmationValue}
      />
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          size="md"
          className={cn(ACTION_BUTTON_CLASSNAME, SECONDARY_ACTION_BUTTON_CLASSNAME)}
          onClick={onClose}
          disabled={isBusy}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          variant={confirmVariant}
          size="md"
          className={ACTION_BUTTON_CLASSNAME}
          onClick={onConfirm}
          disabled={isBusy || !hasConfirmedDelete}
          loading={isBusy}
        >
          {confirmLabel}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}

type DocumentsFolderDeleteOptionsDialogProps = {
  open: boolean
  title: string
  description: string
  moveLabel: string
  deleteLabel: string
  moveDescription?: string
  moveDisabled?: boolean
  moveDisabledReason?: string
  onMove: () => void
  onDelete: () => void
  onClose: () => void
  isBusy?: boolean
}

export function DocumentsFolderDeleteOptionsDialog({
  open,
  title,
  description,
  moveLabel,
  deleteLabel,
  moveDescription,
  moveDisabled = false,
  moveDisabledReason,
  onMove,
  onDelete,
  onClose,
  isBusy = false,
}: DocumentsFolderDeleteOptionsDialogProps) {
  const { t } = useTranslation()
  const { confirmationValue, setConfirmationValue, hasConfirmedDelete } = useDeleteConfirmation()

  if (!open) return null

  return (
    <ActionDialogFrame
      title={title}
      subtitle={t('vault.documentsManager.dialogDangerSubtitle')}
      description={description}
      onClose={onClose}
      icon={<AlertTriangle className="h-5 w-5" strokeWidth={2.2} />}
      tone="danger"
      maxWidthClassName="max-w-lg"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className={cn(ACTION_BUTTON_CLASSNAME, SECONDARY_ACTION_BUTTON_CLASSNAME, 'w-full justify-center')}
            onClick={onMove}
            disabled={isBusy || moveDisabled}
          >
            {moveLabel}
          </Button>
          {moveDescription ? (
            <p className="typo-body-sm text-slate-500 dark:text-slate-400">{moveDescription}</p>
          ) : null}
          {moveDisabledReason ? (
            <p className="typo-body-sm text-amber-600 dark:text-amber-400">{moveDisabledReason}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <DocumentsDeleteConfirmationField
            open={open}
            value={confirmationValue}
            onChange={setConfirmationValue}
          />
          <Button
            type="button"
            variant="danger"
            size="md"
            className={cn(ACTION_BUTTON_CLASSNAME, 'w-full justify-center')}
            onClick={onDelete}
            disabled={isBusy || !hasConfirmedDelete}
            loading={isBusy}
          >
            {deleteLabel}
          </Button>
        </div>

        <div>
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            className={cn(ACTION_BUTTON_CLASSNAME, SECONDARY_ACTION_BUTTON_CLASSNAME)}
            onClick={onClose}
            disabled={isBusy}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </ActionDialogFrame>
  )
}

type DocumentsFolderSelectOption = {
  id: string
  label: string
}

type DocumentsSelectFolderDialogProps = {
  open: boolean
  title: string
  description: string
  label: string
  options: DocumentsFolderSelectOption[]
  value: string
  submitLabel: string
  onChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
  isBusy?: boolean
  requireDeleteConfirmation?: boolean
}

export function DocumentsSelectFolderDialog({
  open,
  title,
  description,
  label,
  options,
  value,
  submitLabel,
  onChange,
  onClose,
  onSubmit,
  isBusy = false,
  requireDeleteConfirmation = false,
}: DocumentsSelectFolderDialogProps) {
  const { t } = useTranslation()
  const { confirmationValue, setConfirmationValue, hasConfirmedDelete } = useDeleteConfirmation()

  if (!open) return null

  return (
    <ActionDialogFrame
      title={title}
      subtitle={t(
        requireDeleteConfirmation
          ? 'vault.documentsManager.dialogDangerSubtitle'
          : 'vault.documentsManager.dialogStandardSubtitle',
      )}
      description={description}
      onClose={onClose}
      icon={
        requireDeleteConfirmation ? (
          <AlertTriangle className="h-5 w-5" strokeWidth={2.2} />
        ) : (
          <ArrowRightLeft className="h-5 w-5" strokeWidth={2.2} />
        )
      }
      tone={requireDeleteConfirmation ? 'danger' : 'default'}
    >
      <div className="space-y-5">
        <label className="block space-y-2">
          <span className="typo-caption-emphasis uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300">
            {label}
          </span>
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="block min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 typo-body-sm text-slate-900 shadow-sm transition focus:border-ep-primary focus:outline-none focus:ring-2 focus:ring-ep-primary-soft dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-ep-primary-accent dark:focus:ring-ep-primary/30"
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {requireDeleteConfirmation ? (
          <DocumentsDeleteConfirmationField
            open={open}
            value={confirmationValue}
            onChange={setConfirmationValue}
          />
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className={cn(ACTION_BUTTON_CLASSNAME, SECONDARY_ACTION_BUTTON_CLASSNAME)}
            onClick={onClose}
            disabled={isBusy}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant={requireDeleteConfirmation ? 'danger' : 'primary'}
            size="md"
            className={ACTION_BUTTON_CLASSNAME}
            onClick={onSubmit}
            disabled={!value || isBusy || (requireDeleteConfirmation && !hasConfirmedDelete)}
            loading={isBusy}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </ActionDialogFrame>
  )
}
