import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'

type TrustedCircleRemoveMemberModalProps = {
  isOpen: boolean
  memberName: string | null
  isRemoving: boolean
  onClose: () => void
  onConfirm: () => void
}

export function TrustedCircleRemoveMemberModal({
  isOpen,
  memberName,
  isRemoving,
  onClose,
  onConfirm,
}: TrustedCircleRemoveMemberModalProps) {
  const { t } = useTranslation()

  if (!isOpen || !memberName) {
    return null
  }

  return (
    <ActionDialogFrame
      title={t('trustedCircle.members.removeTitle')}
      subtitle={t('trustedCircle.members.removeSubtitle')}
      description={t('trustedCircle.members.removeConfirm', { name: memberName })}
      onClose={onClose}
      icon={<AlertTriangle className="h-5 w-5" strokeWidth={2.2} />}
      tone="danger"
      showCloseButton
      closeButtonLabel={t('common.close')}
      isCloseDisabled={isRemoving}
    >
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={isRemoving}>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={isRemoving}>
          {t('trustedCircle.members.removeButton')}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
