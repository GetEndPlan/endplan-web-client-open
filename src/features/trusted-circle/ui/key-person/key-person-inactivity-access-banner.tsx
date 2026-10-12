import { ArrowRight, FileLock2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'

type KeyPersonInactivityAccessBannerProps = {
  ownerName?: string | null
  onAccessNow: () => void
}

export function KeyPersonInactivityAccessBanner({
  ownerName,
  onAccessNow,
}: KeyPersonInactivityAccessBannerProps) {
  const { t } = useTranslation()

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ep-primary-softer text-ep-primary dark:bg-ep-primary-dark/40 dark:text-ep-primary-muted">
            <FileLock2 className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="typo-body-base-strong text-slate-900 dark:text-slate-100">
              {t('dashboard.inactivityAccessBanner.title', {
                name: ownerName || t('dashboard.keyPersonPrompt.someone'),
              })}
            </h2>
            <p className="mt-1 typo-body-sm text-slate-600 dark:text-slate-300">
              {t('dashboard.inactivityAccessBanner.subtitle')}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          className="shrink-0"
          onClick={onAccessNow}
        >
          {t('dashboard.inactivityAccessBanner.cta')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  )
}
