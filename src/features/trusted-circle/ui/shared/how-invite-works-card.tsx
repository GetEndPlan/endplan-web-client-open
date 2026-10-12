import { useTranslation } from 'react-i18next'
import { Card } from '@/shared/ui'

const STEP_KEYS = ['sendInvite', 'pending', 'active'] as const

export function HowInviteWorksCard() {
  const { t } = useTranslation()

  return (
    <Card className="flex h-full w-full flex-col border border-slate-200/90 shadow-sm dark:border-slate-700">
      <div className="flex flex-1 flex-col p-6">
        <h2 className="typo-heading-card text-slate-950 dark:text-slate-50">
          {t('trustedCircle.keyPersonAccess.howItWorks.title')}
        </h2>
        <ol className="mt-6 space-y-6">
          {STEP_KEYS.map((stepKey, index) => (
            <li key={stepKey} className="flex gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ep-primary-softer typo-caption-strong text-ep-primary-accent dark:bg-ep-primary-dark/50 dark:text-ep-primary-muted"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="typo-body-sm-strong text-slate-900 dark:text-slate-100">
                  {t(`trustedCircle.keyPersonAccess.howItWorks.steps.${stepKey}.title`)}
                </p>
                <p className="mt-1 typo-body-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {t(`trustedCircle.keyPersonAccess.howItWorks.steps.${stepKey}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  )
}
