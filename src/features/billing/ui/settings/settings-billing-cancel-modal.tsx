import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'

type SettingsBillingCancelModalProps = {
  isOpen: boolean
  isCanceling: boolean
  periodEnd: string | null
  formatDate: (dateString: string) => string
  onClose: () => void
  onConfirm: () => void
}

export function SettingsBillingCancelModal({
  isOpen,
  isCanceling,
  periodEnd,
  formatDate,
  onClose,
  onConfirm,
}: SettingsBillingCancelModalProps) {
  const { t } = useTranslation()

  if (!isOpen) {
    return null
  }

  return (
    <ActionDialogFrame
      title={t('settings.billing.cancelModal.title')}
      subtitle={t('settings.billing.cancelModal.subtitle')}
      description={t('settings.billing.cancelModal.description', {
        date: periodEnd ? formatDate(periodEnd) : '-',
      })}
      onClose={onClose}
      icon={<AlertTriangle className="h-5 w-5" strokeWidth={2.2} />}
      tone="danger"
      showCloseButton
      closeButtonLabel={t('common.close')}
      isCloseDisabled={isCanceling}
    >
      <Button
        variant="danger"
        className="w-full justify-center"
        onClick={onConfirm}
        loading={isCanceling}
      >
        {t('settings.billing.cancelModal.confirm')}
      </Button>
    </ActionDialogFrame>
  )
}
