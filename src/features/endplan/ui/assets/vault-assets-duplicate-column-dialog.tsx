import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'

type VaultAssetsDuplicateColumnDialogProps = {
  isOpen: boolean
  columnLabel: string | null
  categoryName: string | null
  isAdding: boolean
  onClose: () => void
  onConfirm: () => void
}

export function VaultAssetsDuplicateColumnDialog({
  isOpen,
  columnLabel,
  categoryName,
  isAdding,
  onClose,
  onConfirm,
}: VaultAssetsDuplicateColumnDialogProps) {
  const { t } = useTranslation()

  if (!isOpen || !columnLabel || !categoryName) {
    return null
  }

  return (
    <ActionDialogFrame
      title={t('vault.assets.duplicateColumnDialog.title')}
      subtitle={t('vault.assets.duplicateColumnDialog.subtitle')}
      description={t('vault.assets.duplicateColumnDialog.description', {
        column: columnLabel,
        category: categoryName,
      })}
      onClose={onClose}
      icon={<Info className="h-5 w-5" strokeWidth={2.2} />}
      tone="default"
      showCloseButton
      closeButtonLabel={t('common.close')}
      isCloseDisabled={isAdding}
    >
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={isAdding}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" onClick={onConfirm} loading={isAdding}>
          {t('vault.assets.duplicateColumnDialog.confirm')}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
