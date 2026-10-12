import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionDialogFrame, Button } from '@/shared/ui'

type VaultPoliciesDuplicateColumnDialogProps = {
  isOpen: boolean
  columnLabel: string | null
  categoryName: string | null
  isAdding: boolean
  onClose: () => void
  onConfirm: () => void
}

export function VaultPoliciesDuplicateColumnDialog({
  isOpen,
  columnLabel,
  categoryName,
  isAdding,
  onClose,
  onConfirm,
}: VaultPoliciesDuplicateColumnDialogProps) {
  const { t } = useTranslation()

  if (!isOpen || !columnLabel || !categoryName) {
    return null
  }

  return (
    <ActionDialogFrame
      title={t('vault.policies.duplicateColumnDialog.title')}
      subtitle={t('vault.policies.duplicateColumnDialog.subtitle')}
      description={t('vault.policies.duplicateColumnDialog.description', {
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
          {t('vault.policies.duplicateColumnDialog.confirm')}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
