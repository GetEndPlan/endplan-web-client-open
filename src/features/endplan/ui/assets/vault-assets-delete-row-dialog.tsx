import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'

type VaultAssetsDeleteRowDialogProps = {
  isOpen: boolean
  categoryName: string | null
  /** 1-based row index for display */
  rowNumber: number | null
  onClose: () => void
  onConfirm: () => void
}

export function VaultAssetsDeleteRowDialog({
  isOpen,
  categoryName,
  rowNumber,
  onClose,
  onConfirm,
}: VaultAssetsDeleteRowDialogProps) {
  const { t } = useTranslation()

  if (!isOpen || !categoryName || rowNumber == null || rowNumber < 1) {
    return null
  }

  const rowLabel = t('vault.assets.deleteRowDialog.rowLabel', { number: rowNumber })

  return (
    <ActionDialogFrame
      title={t('vault.assets.deleteRowDialog.title')}
      subtitle={t('vault.assets.deleteRowDialog.subtitle')}
      description={t('vault.assets.deleteRowDialog.description', {
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
          {t('vault.assets.deleteRowDialog.confirm')}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
