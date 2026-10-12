import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES, endplanSectionPath } from '@/app/constants/routes'
import { SECTION_ID } from '../../model/vault-section-types'
import { useSetupProgress } from '../../hooks/dashboard/use-setup-progress'

function setupContinueHref(labelKey: string): string {
  switch (labelKey) {
    case 'setupStepVault':
      return ROUTES.CREATE_ENDPLAN
    case 'setupStepContent':
      return endplanSectionPath(SECTION_ID.ASSETS)
    case 'setupStepKeyPerson':
      return ROUTES.TRUSTED_CIRCLE
    case 'configureTransferProcess':
      return ROUTES.CONFIGURE_TRANSFER_PROCESS
    default:
      return ROUTES.DASHBOARD
  }
}

function setupStepHref(labelKey: string): string | null {
  if (labelKey === 'setupStepVault') {
    return null
  }
  return setupContinueHref(labelKey)
}

export function DashboardReadinessCard() {
  const { t } = useTranslation()
  const { steps, percentage, isReady } = useSetupProgress()

  if (!isReady) {
    return null
  }

  const isComplete = percentage >= 100
  const firstIncomplete = steps.find((step) => !step.done)
  const continueHref = firstIncomplete
    ? setupContinueHref(firstIncomplete.labelKey)
    : ROUTES.DASHBOARD
  const nextActionLabel = firstIncomplete
    ? t(`nav.${firstIncomplete.labelKey}`)
    : t('dashboard.readiness.completeSetup')

  const completeSetupButton = !isComplete ? (
    <Link
      to={continueHref}
      className="inline-flex shrink-0 items-center justify-center rounded-ep-button border border-ep-primary px-3 py-2 typo-button-sm text-ep-primary transition hover:bg-ep-primary-softer dark:border-white dark:text-white dark:hover:bg-ep-primary/10 lg:py-1.5"
    >
      {nextActionLabel}
    </Link>
  ) : null

  return (
    <div className="w-full min-w-0 rounded-ep-card border border-ep-border-card bg-ep-surface p-4 lg:flex-[4] lg:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-4">
        <div>
          <p className="typo-body-sm-strong text-ep-body dark:text-white lg:typo-body">
            {t('dashboard.readiness.title')}
          </p>
          <p className="mt-0.5 typo-heading-section text-ep-primary-accent dark:text-white lg:mt-1 lg:typo-heading-page-static">
            {t('dashboard.readiness.complete', { percent: percentage })}
          </p>
        </div>
        {completeSetupButton ? <div className="hidden lg:block">{completeSetupButton}</div> : null}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-2 lg:mt-4 lg:gap-3">
        {steps.map((step) => {
          const href = setupStepHref(step.labelKey)
          const barClassName = `h-1.5 rounded-ep-progress lg:h-2 ${
            step.done ? 'bg-ep-primary' : 'bg-ep-primary/20'
          }`
          const labelClassName =
            'truncate typo-caption text-ep-body/70 dark:text-white/60 lg:typo-body-sm'
          const label = t(`nav.${step.labelKey}`)

          if (!href) {
            return (
              <div key={step.labelKey} className="flex min-w-0 flex-col gap-1 lg:gap-1.5">
                <div className={barClassName} aria-hidden />
                <p className={labelClassName}>{label}</p>
              </div>
            )
          }

          return (
            <Link
              key={step.labelKey}
              to={href}
              className="group flex min-w-0 flex-col gap-1 rounded-md outline-none lg:gap-1.5 focus-visible:ring-2 focus-visible:ring-ep-primary focus-visible:ring-offset-2"
            >
              <div
                className={`${barClassName} transition-colors ${
                  step.done
                    ? 'group-hover:bg-ep-primary-accent'
                    : 'group-hover:bg-ep-primary/40'
                }`}
                aria-hidden
              />
              <p
                className={`${labelClassName} underline-offset-2 transition-colors group-hover:text-ep-primary group-hover:underline dark:group-hover:text-white`}
              >
                {label}
              </p>
            </Link>
          )
        })}
      </div>

      {completeSetupButton ? <div className="mt-3 lg:hidden">{completeSetupButton}</div> : null}
    </div>
  )
}
