import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/constants/routes'
import { createBillingUpgradeModalState } from '@/features/billing'
import { ActionDialogFrame, Button } from '@/shared/ui'

export type VaultPlanQuotaLimitKind =
  | 'category'
  | 'row'
  | 'contact'
  | 'instruction'
  | 'document_file'
  | 'document_folder'

const QUOTA_LIMIT_COPY_PREFIX: Record<VaultPlanQuotaLimitKind, string> = {
  category: 'vault.categoryQuotaLimitModal',
  row: 'vault.rowQuotaLimitModal',
  contact: 'vault.contactQuotaLimitModal',
  instruction: 'vault.instructionQuotaLimitModal',
  document_file: 'vault.documentFileQuotaLimitModal',
  document_folder: 'vault.documentFolderQuotaLimitModal',
}

type VaultCategoryQuotaLimitModalProps = {
  isOpen: boolean
  kind?: VaultPlanQuotaLimitKind
  onClose: () => void
}

export function VaultCategoryQuotaLimitModal({
  isOpen,
  kind = 'category',
  onClose,
}: VaultCategoryQuotaLimitModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  if (!isOpen) return null

  const copyPrefix = QUOTA_LIMIT_COPY_PREFIX[kind]

  const handleUpgrade = () => {
    onClose()
    navigate(ROUTES.SETTINGS_BILLING_UPGRADE, {
      state: createBillingUpgradeModalState(location),
    })
  }

  return (
    <ActionDialogFrame
      title={t(`${copyPrefix}.title`)}
      description={
        <p className="typo-body-sm text-slate-600 dark:text-slate-300">
          {t(`${copyPrefix}.description`)}
        </p>
      }
      onClose={onClose}
      icon={<Sparkles className="h-5 w-5" strokeWidth={2.2} />}
      tone="default"
      maxWidthClassName="max-w-md"
      showCloseButton
      closeButtonLabel={t('common.close')}
    >
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          {t(`${copyPrefix}.notNow`)}
        </Button>
        <Button variant="primary" onClick={handleUpgrade}>
          {t(`${copyPrefix}.upgrade`)}
        </Button>
      </div>
    </ActionDialogFrame>
  )
}
