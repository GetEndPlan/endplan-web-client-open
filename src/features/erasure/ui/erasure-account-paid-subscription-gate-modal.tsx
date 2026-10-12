import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'

type ErasureAccountPaidSubscriptionGateModalProps = {
  isOpen: boolean
  planLine: string
  periodEndLabel: string
  onClose: () => void
  onContinue: () => void
}

export function ErasureAccountPaidSubscriptionGateModal({
  isOpen,
  planLine,
  periodEndLabel,
  onClose,
  onContinue,
}: ErasureAccountPaidSubscriptionGateModalProps) {
  const { t } = useTranslation()
  const [acknowledged, setAcknowledged] = useState(false)
  const [prevOpen, setPrevOpen] = useState<boolean | null>(null)
  if (prevOpen === null || isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      setAcknowledged(false)
    }
  }

  if (!isOpen) return null

  return (
    <ActionDialogFrame
      title={t('settings.erasure.paidGate.title')}
      description={
        <div className="space-y-4">
          <p>{t('settings.erasure.paidGate.intro')}</p>
          <div className="rounded-lg border border-ep-border-subtle bg-ep-surface p-4">
            <p className="typo-body-sm-emphasis text-ep-body">{planLine}</p>
            <p className="mt-2 typo-body-sm text-slate-700 dark:text-slate-200">
              {t('settings.erasure.paidGate.billingPeriodPrefix')}{' '}
              <strong>{periodEndLabel}</strong>
              {t('settings.erasure.paidGate.billingPeriodSuffix')}
            </p>
          </div>
        </div>
      }
      onClose={onClose}
      icon={<CreditCard className="h-5 w-5" strokeWidth={2.2} />}
      tone="default"
      maxWidthClassName="max-w-lg"
      showCloseButton
      closeButtonLabel={t('common.close')}
    >
      <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
        <label className="flex cursor-pointer items-start gap-3 typo-body-sm text-ep-body">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 rounded border-ep-border-card bg-ep-surface text-ep-primary focus:ring-ep-primary"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          <span>{t('settings.erasure.paidGate.checkboxLabel')}</span>
        </label>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t('settings.erasure.paidGate.keepAccount')}
          </Button>
          <Button variant="danger" disabled={!acknowledged} onClick={onContinue}>
            {t('settings.erasure.paidGate.continue')}
          </Button>
        </div>
      </div>
    </ActionDialogFrame>
  )
}
