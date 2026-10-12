import { FileDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppVariant } from '@/app/hooks/use-app-variant'
import { toast } from '@/shared/ui'

export function AppSysExportPdfButton() {
  const { t } = useTranslation()
  const appVariant = useAppVariant()

  if (!appVariant.showExportPdfButton) {
    return null
  }

  return (
    <button
      type="button"
      aria-label={t('shell.sysExportPdf.ariaLabel')}
      onClick={() => toast.info(t('shell.sysExportPdf.comingSoon'))}
      className="inline-flex items-center gap-1.5 rounded-ep-pill border border-ep-border-subtle bg-ep-surface px-3 py-1.5 typo-body-sm text-ep-body transition hover:bg-ep-surface-subtle dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
    >
      <FileDown className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span>{t('shell.sysExportPdf.label')}</span>
    </button>
  )
}
