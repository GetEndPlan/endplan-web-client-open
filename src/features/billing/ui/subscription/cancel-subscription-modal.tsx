import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'

type CancelSubscriptionModalProps = {
  isOpen: boolean
  periodEnd: string | null
  formatDate: (dateString: string) => string
  isCanceling: boolean
  onClose: () => void
  onConfirm: () => void
}

export function CancelSubscriptionModal({
  isOpen,
  periodEnd,
  formatDate,
  isCanceling,
  onClose,
  onConfirm,
}: CancelSubscriptionModalProps) {
  const { t } = useTranslation()

  if (!isOpen) {
    return null
  }

  return (
    <ActionDialogFrame
      title={t('billing.cancelModal.title')}
      subtitle={t('billing.cancelModal.subtitle')}
      description={t('billing.cancelModal.description', {
        date: periodEnd ? formatDate(periodEnd) : '-',
      })}
      onClose={onClose}
      icon={<AlertTriangle className="h-5 w-5" strokeWidth={2.2} />}
      tone="danger"
    >
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={isCanceling}>
          {t('billing.cancelModal.keep')}
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={isCanceling}>
          {t('billing.cancelModal.confirm')}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
