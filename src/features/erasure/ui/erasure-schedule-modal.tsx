import { useState } from 'react'
import { AlertCircle, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button, Input } from '@/shared/ui'

const CONFIRM_PHRASE = 'DELETE'

type ErasureScheduleModalProps = {
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => void
}

/** Two-step flow for scheduling vault data deletion only (DELETE confirmation). */
export function ErasureScheduleModal({ isOpen, isSubmitting, onClose, onConfirm }: ErasureScheduleModalProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<1 | 2>(1)
  const [confirmText, setConfirmText] = useState('')
  const [prevOpen, setPrevOpen] = useState<boolean | null>(null)
  if (prevOpen === null || isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      setStep(1)
      setConfirmText('')
    }
  }

  if (!isOpen) return null

  const canSubmit = confirmText === CONFIRM_PHRASE && !isSubmitting
  const handleClose = isSubmitting ? () => {} : onClose

  if (step === 1) {
    return (
      <ActionDialogFrame
        title={t('settings.erasure.modal.intro.titleData')}
        description={
          <div className="space-y-4">
            <p>{t('settings.erasure.modal.intro.descriptionData')}</p>
            <div className="rounded-lg border border-ep-border-subtle bg-ep-surface p-4">
              <p className="typo-body-sm-emphasis text-ep-body">
                {t('settings.erasure.modal.intro.whatTitleData')}
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 typo-body-sm text-slate-700 dark:text-slate-200">
                {(['item1Data', 'item2Data'] as const).map((key) => (
                  <li key={key}>{t(`settings.erasure.modal.intro.${key}`)}</li>
                ))}
              </ul>
            </div>
          </div>
        }
        onClose={handleClose}
        icon={<AlertCircle className="h-5 w-5" strokeWidth={2.2} />}
        tone="default"
        maxWidthClassName="max-w-lg"
        showCloseButton
        closeButtonLabel={t('common.close')}
        isCloseDisabled={isSubmitting}
      >
        <div className="flex flex-col-reverse gap-3 px-4 pb-4 sm:flex-row sm:justify-end sm:px-5 sm:pb-5">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" disabled={isSubmitting} onClick={() => setStep(2)}>
            {t('settings.erasure.modal.intro.continue')}
          </Button>
        </div>
      </ActionDialogFrame>
    )
  }

  return (
    <ActionDialogFrame
      title={t('settings.erasure.modal.step2.title')}
      description={<p>{t('settings.erasure.modal.step2.warning')}</p>}
      onClose={handleClose}
      icon={<Trash2 className="h-5 w-5" strokeWidth={2.2} />}
      tone="danger"
      showCloseButton
      closeButtonLabel={t('common.close')}
      isCloseDisabled={isSubmitting}
    >
      <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
        <Input
          label={t('settings.erasure.modal.step2.confirmLabel', { phrase: CONFIRM_PHRASE })}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={t('settings.erasure.modal.step2.confirmPlaceholder')}
          autoComplete="off"
          disabled={isSubmitting}
          required
        />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" disabled={!canSubmit} loading={isSubmitting} onClick={() => onConfirm()}>
            {t('settings.erasure.modal.step2.submitData')}
          </Button>
        </div>
      </div>
    </ActionDialogFrame>
  )
}
