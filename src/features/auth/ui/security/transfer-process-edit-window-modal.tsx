import { Info, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Card, ModalOverlay } from '@/shared/ui'
import { TransferProcessWindowSetupForm } from './transfer-process-window-setup-form'

type TransferProcessEditWindowModalProps = {
  isOpen: boolean
  selectedDays: number | null
  currentPeriodDays: number
  isSaving: boolean
  onSelectDays: (days: number) => void
  onClose: () => void
  onSave: () => void
}

export function TransferProcessEditWindowModal({
  isOpen,
  selectedDays,
  currentPeriodDays,
  isSaving,
  onSelectDays,
  onClose,
  onSave,
}: TransferProcessEditWindowModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <ModalOverlay onBackdropClick={isSaving ? undefined : onClose}>
      <Card className="scrollbar-hidden max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200/90 p-0 shadow-xl dark:border-slate-700">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
          <div className="min-w-0 pr-2">
            <h2 className="typo-heading-card text-slate-950 dark:text-slate-50">
              {t('liveness.transferPage.editModal.title')}
            </h2>
            <p className="mt-2 typo-body-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {t('liveness.transferPage.editModal.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ep-border-card bg-ep-surface text-ep-body-muted transition hover:bg-ep-surface-subtle hover:text-ep-body disabled:opacity-50"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="w-full space-y-5">
            <div className="space-y-3">
              <p className="typo-caption-emphasis uppercase tracking-[0.18em] text-slate-500 dark:text-white">
                {t('liveness.inactivityPeriodLabel')}
              </p>
              <TransferProcessWindowSetupForm
                variant="edit"
                selectedDays={selectedDays}
                currentPeriodDays={currentPeriodDays}
                deadlineLabel={null}
                onSelectDays={onSelectDays}
              />
            </div>

            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3.5 dark:border-amber-800 dark:bg-amber-950/40">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-ep-primary dark:bg-ep-primary"
                aria-hidden
              >
                <Info className="h-3 w-3 text-white" strokeWidth={2.5} />
              </span>
              <p className="typo-body-sm leading-relaxed text-amber-900 dark:text-amber-100">
                {t('liveness.transferPage.editModal.saveNotice')}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="flex-1 rounded-lg"
                disabled={isSaving}
                onClick={onClose}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                size="lg"
                className="flex-1 rounded-lg"
                disabled={isSaving || selectedDays == null}
                loading={isSaving}
                onClick={onSave}
              >
                {t('liveness.transferPage.editModal.saveChanges')}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </ModalOverlay>
  )
}
