import { useState } from 'react'
import {
  Clock,
  FileText,
  FolderOpen,
  Lock,
  PenLine,
  RefreshCw,
  ShieldCheck,
  Users,
  UserCheck,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, ModalOverlay, ONBOARDING_MODAL_BACKDROP_CLASSNAME } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'

const TOTAL_STEPS = 3

/** Keeps step transitions from resizing the modal shell. */
const stepContentMinHeight = 'min-h-[26rem] sm:min-h-[22rem]'

const welcomeTitleClass = 'typo-welcome-title text-slate-950 dark:text-slate-50'
const welcomeHeroTitleClass = 'typo-welcome-hero-title text-slate-950 dark:text-slate-50'
const welcomeSubtitleClass = 'typo-welcome-subtitle text-slate-600 dark:text-slate-300'
const welcomeFeatureTitleClass = 'typo-welcome-feature-title text-slate-900 dark:text-slate-100'
const welcomeFeatureDescriptionClass = 'typo-welcome-feature-description text-slate-600 dark:text-slate-300'
const welcomeBadgeTextClass = 'typo-welcome-badge text-emerald-800 dark:text-emerald-300'

const featureIconWell =
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ep-primary-softer text-ep-primary dark:bg-ep-primary/15 dark:text-ep-primary-muted'

const lucideIconProps = { className: 'h-[1.375rem] w-[1.375rem]' as const, strokeWidth: 2.2 as const }

type DashboardWelcomeModalProps = {
  onClose: () => void
  /** Called when the user clicks Continue / primary (every step); persists “do not show again” after this session */
  onContinueAck: () => void
  onFinish: () => void
}

type WelcomeFeatureCardProps = {
  icon: LucideIcon
  title: string
  description: string
}

function WelcomeFeatureCard({ icon: Icon, title, description }: WelcomeFeatureCardProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-4 rounded-xl border border-ep-border-card bg-ep-surface px-4 py-5',
      )}
    >
      <div className={featureIconWell} aria-hidden>
        <Icon {...lucideIconProps} />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className={welcomeFeatureTitleClass}>{title}</p>
        <p className={welcomeFeatureDescriptionClass}>{description}</p>
      </div>
    </div>
  )
}

function padStep(n: number) {
  return String(n).padStart(2, '0')
}

export function DashboardWelcomeModal({ onClose, onContinueAck, onFinish }: DashboardWelcomeModalProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)

  const isLastStep = step === TOTAL_STEPS

  const primaryLabel = isLastStep
    ? t('dashboard.welcome.flow.goToEndplan')
    : t('dashboard.welcome.flow.continue')

  const handlePrimary = () => {
    if (isLastStep) {
      // Final step: `onFinish` persists dismiss + intro ack; skip `onContinueAck` to avoid racing a second patch.
      onFinish()
      return
    }
    onContinueAck()
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  const handlePrevious = () => {
    setStep((s) => Math.max(1, s - 1))
  }

  const handleCloseClick = () => {
    setShowSkipConfirm(true)
  }

  const handleSkipConfirm = () => {
    setShowSkipConfirm(false)
    onClose()
  }

  const stepTitleId = 'dashboard-welcome-title'
  const skipConfirmTitleId = 'dashboard-welcome-skip-confirm-title'

  return (
    <>
    <ModalOverlay
      onBackdropClick={onClose}
      backdropClassName={ONBOARDING_MODAL_BACKDROP_CLASSNAME}
    >
      <div
        className={cn(
          'welcome-modal-enter relative flex w-full max-w-[50rem] flex-col overflow-hidden rounded-[20px] border border-ep-border-card bg-ep-surface shadow-2xl shadow-slate-950/15 dark:shadow-black/35',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={stepTitleId}
      >
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-3">
              <p className="typo-caption-emphasis uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {t('dashboard.welcome.flow.stepLabel', {
                  current: padStep(step),
                  total: padStep(TOTAL_STEPS),
                })}
              </p>
              <div className="flex max-w-[220px] gap-1.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors',
                      i <= step ? 'bg-ep-primary dark:bg-ep-primary' : 'bg-slate-200 dark:bg-slate-600',
                    )}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseClick}
              className={cn(
                'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition',
                'hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ep-primary',
              )}
              aria-label={t('dashboard.welcome.flow.close')}
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>

          <div className={cn('mt-8', stepContentMinHeight)}>
            {step === 1 ? (
              <div className="flex h-full flex-col space-y-6">
                <div className="space-y-3">
                  <h2 id={stepTitleId} className={welcomeTitleClass}>
                    {t('dashboard.welcome.flow.step1.title')}
                  </h2>
                  <p className={welcomeSubtitleClass}>{t('dashboard.welcome.flow.step1.subtitle')}</p>
                </div>
                <div className="space-y-3">
                  <WelcomeFeatureCard
                    icon={FolderOpen}
                    title={t('dashboard.welcome.flow.step1.items.documents.title')}
                    description={t('dashboard.welcome.flow.step1.items.documents.description')}
                  />
                  <WelcomeFeatureCard
                    icon={FileText}
                    title={t('dashboard.welcome.flow.step1.items.instructions.title')}
                    description={t('dashboard.welcome.flow.step1.items.instructions.description')}
                  />
                  <WelcomeFeatureCard
                    icon={ShieldCheck}
                    title={t('dashboard.welcome.flow.step1.items.security.title')}
                    description={t('dashboard.welcome.flow.step1.items.security.description')}
                  />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid h-full gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-center md:gap-8">
                <div className="flex flex-col justify-center space-y-5">
                  <div className="space-y-3">
                    <h2 id={stepTitleId} className={welcomeHeroTitleClass}>
                      {t('dashboard.welcome.flow.step2.title')}
                    </h2>
                    <p className={welcomeSubtitleClass}>{t('dashboard.welcome.flow.step2.subtitle')}</p>
                  </div>
                  <div
                    className={cn(
                      'inline-flex items-center gap-2.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2',
                      'dark:border-emerald-800/60 dark:bg-emerald-950/40',
                    )}
                  >
                    <Lock className="h-[1.125rem] w-[1.125rem] shrink-0 text-emerald-700 dark:text-emerald-400" strokeWidth={2.2} />
                    <span className={welcomeBadgeTextClass}>{t('dashboard.welcome.flow.step2.badge')}</span>
                  </div>
                </div>
                <div
                  className={cn(
                    'flex h-full flex-col space-y-3 rounded-xl border border-ep-border-card bg-ep-surface p-3',
                  )}
                >
                  <WelcomeFeatureCard
                    icon={Clock}
                    title={t('dashboard.welcome.flow.step2.items.checkIn.title')}
                    description={t('dashboard.welcome.flow.step2.items.checkIn.description')}
                  />
                  <WelcomeFeatureCard
                    icon={RefreshCw}
                    title={t('dashboard.welcome.flow.step2.items.reminders.title')}
                    description={t('dashboard.welcome.flow.step2.items.reminders.description')}
                  />
                  <WelcomeFeatureCard
                    icon={UserCheck}
                    title={t('dashboard.welcome.flow.step2.items.access.title')}
                    description={t('dashboard.welcome.flow.step2.items.access.description')}
                  />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid h-full gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-stretch md:gap-5">
                <div
                  className={cn(
                    'flex flex-col justify-center rounded-2xl border border-ep-border-subtle bg-ep-surface px-6 py-8 text-ep-body',
                  )}
                >
                  <h2 id={stepTitleId} className={welcomeHeroTitleClass}>
                    {t('dashboard.welcome.flow.step3.title')}
                  </h2>
                  <p className="typo-welcome-subtitle mt-3 text-ep-body-muted">
                    {t('dashboard.welcome.flow.step3.subtitle')}
                  </p>
                </div>
                <div className="space-y-3">
                  <WelcomeFeatureCard
                    icon={Users}
                    title={t('dashboard.welcome.flow.step3.items.trust.title')}
                    description={t('dashboard.welcome.flow.step3.items.trust.description')}
                  />
                  <WelcomeFeatureCard
                    icon={FileText}
                    title={t('dashboard.welcome.flow.step3.items.documents.title')}
                    description={t('dashboard.welcome.flow.step3.items.documents.description')}
                  />
                  <WelcomeFeatureCard
                    icon={PenLine}
                    title={t('dashboard.welcome.flow.step3.items.guidance.title')}
                    description={t('dashboard.welcome.flow.step3.items.guidance.description')}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 px-6 py-6 dark:border-slate-600 sm:px-8">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handlePrevious}
              className={cn('min-h-[48px]', step === 1 && 'invisible pointer-events-none')}
              tabIndex={step === 1 ? -1 : 0}
              aria-hidden={step === 1}
            >
              {t('dashboard.welcome.flow.previous')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handlePrimary}
              className="min-h-[48px] min-w-[200px] tracking-wide"
            >
              {primaryLabel}
            </Button>
          </div>
        </div>
      </div>
    </ModalOverlay>

    {showSkipConfirm ? (
      <ModalOverlay
        containerClassName="z-[80]"
        onBackdropClick={() => setShowSkipConfirm(false)}
        backdropClassName={ONBOARDING_MODAL_BACKDROP_CLASSNAME}
      >
        <div
          className={cn(
            'welcome-modal-enter w-full max-w-md overflow-hidden rounded-[20px] border border-ep-border-card bg-ep-surface p-6 shadow-2xl shadow-slate-950/15 dark:shadow-black/35 sm:p-8',
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={skipConfirmTitleId}
        >
          <h2 id={skipConfirmTitleId} className="typo-heading-card text-slate-950 dark:text-slate-50">
            {t('dashboard.welcome.flow.skipConfirm.title')}
          </h2>
          <p className="typo-body-sm mt-3 text-slate-600 dark:text-slate-300">
            {t('dashboard.welcome.flow.skipConfirm.description')}
          </p>
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => setShowSkipConfirm(false)}
              className="min-h-[48px]"
            >
              {t('dashboard.welcome.flow.skipConfirm.continueOnboarding')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleSkipConfirm}
              className="min-h-[48px]"
            >
              {t('dashboard.welcome.flow.skipConfirm.skipForNow')}
            </Button>
          </div>
        </div>
      </ModalOverlay>
    ) : null}
    </>
  )
}
