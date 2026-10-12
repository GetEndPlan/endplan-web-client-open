import { useTranslation } from 'react-i18next'
import { Card, Button } from '@/shared/ui'

export function VaultSectionLoadingState() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[12rem] items-center justify-center">
      <p className="typo-body-sm text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
    </div>
  )
}

type VaultSectionNoVaultStateProps = {
  backLabel: string
  onBack: () => void
  bodyText: string
  ctaLabel: string
  onCta: () => void
}

export function VaultSectionNoVaultState({
  backLabel,
  onBack,
  bodyText,
  ctaLabel,
  onCta,
}: VaultSectionNoVaultStateProps) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        {backLabel}
      </Button>
      <Card className="p-6">
        <p className="typo-body text-slate-600 dark:text-slate-300">{bodyText}</p>
        <div className="mt-4">
          <Button variant="primary" onClick={onCta}>
            {ctaLabel}
          </Button>
        </div>
      </Card>
    </div>
  )
}
