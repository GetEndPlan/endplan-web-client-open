import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'

type VaultAssetsRemoveCategoryDialogProps = {
  isOpen: boolean
  categoryName: string | null
  isCustom?: boolean
  isRemoving: boolean
  onClose: () => void
  onConfirm: () => void
}

export function VaultAssetsRemoveCategoryDialog({
  isOpen,
  categoryName,
  isCustom = false,
  isRemoving,
  onClose,
  onConfirm,
}: VaultAssetsRemoveCategoryDialogProps) {
  const { t } = useTranslation()

  if (!isOpen || !categoryName) {
    return null
  }

  return (
    <ActionDialogFrame
      title={t('vault.assets.removeCategoryDialog.title')}
      subtitle={
        isCustom
          ? t('vault.assets.removeCategoryDialog.subtitleCustom')
          : t('vault.assets.removeCategoryDialog.subtitle')
      }
      description={t(
        isCustom
          ? 'vault.assets.removeCategoryDialog.descriptionCustom'
          : 'vault.assets.removeCategoryDialog.description',
        { name: categoryName },
      )}
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
          {t(
            isCustom
              ? 'vault.assets.removeCategoryDialog.confirmDelete'
              : 'vault.assets.removeCategoryDialog.confirm',
          )}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
