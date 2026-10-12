import { useNavigate } from 'react-router-dom'
import { Key } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Card } from '@/shared/ui'
import { ROUTES } from '@/app/constants/routes'
import { cn } from '@/shared/lib/cn'

type SharedWithMeEmptyStateProps = {
  showKeyPersonPrompt?: boolean
}

export function SharedWithMeEmptyState({ showKeyPersonPrompt = true }: SharedWithMeEmptyStateProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="ml-6 space-y-8 sm:ml-8">
      <Card
        padding="lg"
        className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm dark:border-ep-border-card"
      >
        <p className="typo-caption-emphasis uppercase tracking-[0.14em] text-ep-primary dark:text-ep-primary-accent">
          {t('dashboard.sharedWithMe.empty.kicker')}
        </p>
        <h2 className="mt-4 typo-heading-section text-slate-950 dark:text-slate-50">
          {t('dashboard.sharedWithMe.empty.title')}
        </h2>
        <p className="mt-4 typo-body-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {t('dashboard.sharedWithMe.empty.body')}
        </p>

        {/* Grey covers full width + bottom of first card (bleed inside Card padding) */}
        <div
          className={cn(
            '-mx-8 -mb-8 mt-10 border-t border-slate-200/80 bg-slate-50/90 px-8 pb-8 pt-5 dark:border-ep-border-card/80 dark:bg-ep-surface-panel',
          )}
        >
          <p className="typo-caption-emphasis uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {t('dashboard.sharedWithMe.empty.previewLabel')}
          </p>
          <div
            className={cn(
              'mt-4 flex flex-col gap-6 rounded-xl border border-dashed border-ep-primary-muted bg-white p-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8',
              'dark:border-ep-primary/50 dark:bg-ep-primary-dark/40',
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ep-primary-softer typo-body-base-strong text-ep-primary-accent dark:bg-ep-primary-dark/40 dark:text-ep-primary-muted"
                aria-hidden
              >
                {t('dashboard.sharedWithMe.empty.previewInitials')}
              </div>
              <div className="min-w-0 space-y-2">
                <p className="typo-body-base-strong text-slate-950 dark:text-slate-50">
                  {t('dashboard.sharedWithMe.empty.previewName')}
                </p>
                <p className="typo-caption text-slate-500 dark:text-slate-400">
                  {t('dashboard.sharedWithMe.empty.previewSubtitle')}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="rounded-full border border-green-300 bg-green-50 px-3.5 py-1 typo-caption-strong text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {t('dashboard.sharedWithMe.empty.previewBadgeAssets')}
                  </span>
                </div>
              </div>
            </div>
            <span
              className="inline-flex shrink-0 self-end items-center rounded-md bg-slate-500 px-2.5 py-0.5 typo-caption-strong text-white sm:self-auto dark:bg-slate-600"
              aria-hidden
            >
              {t('trustedCircle.roles.key_person')}
            </span>
          </div>
        </div>
      </Card>

      {showKeyPersonPrompt ? (
        <div
          className={cn(
            'flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6',
            'dark:border-slate-700 dark:bg-slate-900/50',
          )}
        >
          <div className="flex min-w-0 flex-1 gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              aria-hidden
            >
              <Key className="h-5 w-5" strokeWidth={2} />
            </div>
            <p className="min-w-0 whitespace-pre-line typo-body-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <strong className="typo-body-sm-emphasis text-slate-900 dark:text-slate-100">
                {t('dashboard.sharedWithMe.empty.bannerBodyLead')}
              </strong>
              {'\n'}
              {t('dashboard.sharedWithMe.empty.bannerBodyRest')}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <Button type="button" variant="primary" size="md" onClick={() => navigate(ROUTES.TRUSTED_CIRCLE)}>
              {t('dashboard.sharedWithMe.empty.setupTrustedCircle')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
