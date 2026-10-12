import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'

type VaultPoliciesDeleteRowDialogProps = {
  isOpen: boolean
  categoryName: string | null
  /** 1-based row index for display */
  rowNumber: number | null
  onClose: () => void
  onConfirm: () => void
}

export function VaultPoliciesDeleteRowDialog({
  isOpen,
  categoryName,
  rowNumber,
  onClose,
  onConfirm,
}: VaultPoliciesDeleteRowDialogProps) {
  const { t } = useTranslation()

  if (!isOpen || !categoryName || rowNumber == null || rowNumber < 1) {
    return null
  }

  const rowLabel = t('vault.policies.deleteRowDialog.rowLabel', { number: rowNumber })

  return (
    <ActionDialogFrame
      title={t('vault.policies.deleteRowDialog.title')}
      subtitle={t('vault.policies.deleteRowDialog.subtitle')}
      description={t('vault.policies.deleteRowDialog.description', {
        category: categoryName,
        row: rowLabel,
      })}
      onClose={onClose}
      icon={<AlertTriangle className="h-5 w-5" strokeWidth={2.2} />}
      tone="danger"
      showCloseButton
      closeButtonLabel={t('common.close')}
    >
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {t('vault.policies.deleteRowDialog.confirm')}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
