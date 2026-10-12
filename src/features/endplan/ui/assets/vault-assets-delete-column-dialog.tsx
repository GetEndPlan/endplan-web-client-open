import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'

type VaultAssetsDeleteColumnDialogProps = {
  isOpen: boolean
  columnLabel: string | null
  categoryName: string | null
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function VaultAssetsDeleteColumnDialog({
  isOpen,
  columnLabel,
  categoryName,
  isDeleting,
  onClose,
  onConfirm,
}: VaultAssetsDeleteColumnDialogProps) {
  const { t } = useTranslation()

  if (!isOpen || !columnLabel || !categoryName) {
    return null
  }

  return (
    <ActionDialogFrame
      title={t('vault.assets.deleteColumnDialog.title')}
      subtitle={t('vault.assets.deleteColumnDialog.subtitle')}
      description={t('vault.assets.deleteColumnDialog.description', {
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
          {t('vault.assets.deleteColumnDialog.confirm')}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
