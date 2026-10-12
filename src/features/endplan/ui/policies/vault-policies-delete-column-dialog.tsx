import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'

type VaultPoliciesDeleteColumnDialogProps = {
  isOpen: boolean
  columnLabel: string | null
  categoryName: string | null
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function VaultPoliciesDeleteColumnDialog({
  isOpen,
  columnLabel,
  categoryName,
  isDeleting,
  onClose,
  onConfirm,
}: VaultPoliciesDeleteColumnDialogProps) {
  const { t } = useTranslation()

  if (!isOpen || !columnLabel || !categoryName) {
    return null
  }

  return (
    <ActionDialogFrame
      title={t('vault.policies.deleteColumnDialog.title')}
      subtitle={t('vault.policies.deleteColumnDialog.subtitle')}
      description={t('vault.policies.deleteColumnDialog.description', {
        column: columnLabel,
        category: categoryName,
      })}
      onClose={onClose}
      icon={<AlertTriangle className="h-5 w-5" strokeWidth={2.2} />}
      tone="danger"
      showCloseButton
      closeButtonLabel={t('common.close')}
      isCloseDisabled={isDeleting}
    >
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={isDeleting}>
          {t('vault.policies.deleteColumnDialog.confirm')}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
