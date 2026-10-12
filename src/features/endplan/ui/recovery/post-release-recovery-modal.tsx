import { ShieldCheck, RotateCcw, Users, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { VerificationCodeInput } from '@/features/auth'
import type { PostReleaseRecoveryDecision } from '@/features/endplan/api/clients/release-api'
import { Button, ModalOverlay } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { usePostReleaseRecoveryFlow } from '../../hooks/recovery/use-post-release-recovery-flow'

/** Bordered content blocks — matches step 3 option cards / platform surfaces */
const recoveryCardClass =
  'rounded-2xl border border-ep-border-card bg-ep-surface p-5'

const lucideSm = { className: 'h-4 w-4' as const, strokeWidth: 2.2 as const }

type RecoveryStepHeaderProps = {
  step: number
  titleId: string
  title: string
  subtitle: string
}

function RecoveryStepHeader({ step, titleId, title, subtitle }: RecoveryStepHeaderProps) {
  const { t } = useTranslation()
  return (
    <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-700">
      <div className="min-w-0 flex-1">
        <p className="typo-caption-emphasis uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {t('dashboard.recovery.flow.stepLabel', { current: step, total: 3 })}
        </p>
        <h2 id={titleId} className="mt-2 typo-heading-card text-balance text-slate-950 dark:text-slate-50">
          {title}
        </h2>
        <p className="mt-2 typo-body-sm text-balance text-slate-600 dark:text-slate-300">{subtitle}</p>
      </div>
      <div
        className="hidden shrink-0 rounded-2xl bg-ep-primary-softer p-3 text-ep-primary dark:bg-ep-primary/10 dark:text-ep-primary-muted sm:block"
        aria-hidden
      >
        <ShieldCheck className="h-6 w-6" strokeWidth={2.2} />
      </div>
    </div>
  )
}
type PostReleaseRecoveryModalProps = {
  /** Display name for the wireframe greeting (e.g. first name). */
  userName: string
  email: string
  /** Owner's configured inactivity period in days; null uses a sensible default in copy. */
  inactivityPeriodDays?: number | null
  /** Active access-now key persons for "what happened" copy. */
  accessNowKeyPersonNames?: string[]
  onCompleted: (decision: PostReleaseRecoveryDecision) => Promise<void> | void
}

export function PostReleaseRecoveryModal({
  userName,
  email,
  inactivityPeriodDays = null,
  accessNowKeyPersonNames = [],
  onCompleted,
}: PostReleaseRecoveryModalProps) {
  const flow = usePostReleaseRecoveryFlow({
    email,
    userName,
    inactivityPeriodDays,
    accessNowKeyPersonNames,
    onCompleted,
  })

  const {
    t,
    step,
    code,
    setCode,
    countdown,
    isSendingCode,
    isVerifyingCode,
    isResolvingDecision,
    statusMessage,
    stepOneError,
    decisionError,
    verificationCodeSent,
    canVerify,
    displayName,
    inactivityDaysForCopy,
    keyPersonListLabel,
    sendCode,
    verifyCode,
    resolveDecision,
    goToStep3,
  } = flow

  const stepOneTitleId = 'post-release-recovery-step1-title'
  const stepTwoTitleId = 'post-release-recovery-step2-title'

  const step1Title =
    displayName.length > 0
      ? t('dashboard.recovery.flow.step1.greetingNamed', { name: displayName })
      : t('dashboard.recovery.flow.step1.greetingGeneric')
  const step2Title =
    displayName.length > 0
      ? t('dashboard.recovery.flow.step2.welcomeNamed', { name: displayName })
      : t('dashboard.recovery.flow.step2.welcomeGeneric')

  const iconWellClass =
    'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ep-primary-softer text-ep-primary dark:bg-ep-primary/15 dark:text-ep-primary-muted'

  const stepBadgeClass =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ep-primary typo-body-sm-emphasis text-white dark:bg-ep-primary'

  return (
    <ModalOverlay lockScroll>
      <div
        className={cn(
          'relative w-full max-w-2xl overflow-hidden rounded-3xl border border-ep-border-card bg-ep-surface p-8 shadow-2xl shadow-slate-950/15 dark:shadow-black/40',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={
          step === 1
            ? stepOneTitleId
            : step === 2
              ? stepTwoTitleId
              : 'post-release-recovery-title'
        }
      >
        {step === 1 ? (
          <>
            <RecoveryStepHeader
              step={1}
              titleId={stepOneTitleId}
              title={step1Title}
              subtitle={t('dashboard.recovery.flow.step1.intro')}
            />
            <div className="space-y-4">
              <div className={cn(recoveryCardClass)}>
                <div className="flex gap-3">
                  <div className={iconWellClass} aria-hidden>
                    <ShieldCheck {...lucideSm} />
                  </div>
                  <p className="min-w-0 typo-body-sm text-slate-600 dark:text-slate-300">
                    {t('dashboard.recovery.flow.step1.securityCallout')}
                  </p>
                </div>
              </div>
              <div className={cn(recoveryCardClass, 'space-y-4')}>
                <div className="flex gap-3 sm:gap-4">
                  <div className={iconWellClass} aria-hidden>
                    <Mail {...lucideSm} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-center gap-4">
                    {!verificationCodeSent ? (
                      <p className="text-center typo-body-sm text-slate-600 dark:text-slate-400">
                        {t('dashboard.recovery.flow.step1.sendCodeHint')}{' '}
                        <span className="typo-emphasis-strong text-slate-900 dark:text-slate-100">{email}</span>
                      </p>
                    ) : (
                      <>
                        <VerificationCodeInput
                          value={code}
                          onChange={setCode}
                          error={stepOneError != null}
                          disabled={isVerifyingCode || isResolvingDecision}
                        />
                        <p className="text-center typo-body-sm text-slate-600 dark:text-slate-400">
                          {t('dashboard.recovery.flow.step1.codeSentToPrefix')}{' '}
                          <span className="typo-emphasis-strong text-slate-900 dark:text-slate-100">{email}</span>
                        </p>
                        {statusMessage ? (
                          <p className="text-center typo-body-sm text-emerald-700 dark:text-emerald-300">
                            {statusMessage}
                          </p>
                        ) : null}
                      </>
                    )}
                    {stepOneError ? (
                      <p className="text-center typo-body-sm text-rose-600 dark:text-rose-300">
                        {stepOneError}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-600">
                  {!verificationCodeSent ? (
                    <Button
                      type="button"
                      variant="primary"
                      fullWidth
                      onClick={() => void sendCode(false)}
                      loading={isSendingCode}
                      disabled={!email || isResolvingDecision}
                    >
                      {t('dashboard.recovery.flow.step1.sendCodeButton')}
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        fullWidth
                        onClick={() => void verifyCode()}
                        loading={isVerifyingCode}
                        disabled={!canVerify || isResolvingDecision}
                      >
                        {t('dashboard.recovery.flow.step1.verifyButton')}
                      </Button>
                      <button
                        type="button"
                        className="w-full typo-body-sm text-ep-primary underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-ep-primary-accent"
                        onClick={() => void sendCode(true)}
                        disabled={countdown > 0 || isResolvingDecision || isVerifyingCode || isSendingCode}
                      >
                        {isSendingCode
                          ? t('dashboard.recovery.flow.step1.resendSending')
                          : countdown > 0
                            ? t('dashboard.recovery.flow.step1.resendIn', { seconds: countdown })
                            : t('dashboard.recovery.flow.step1.resend')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <RecoveryStepHeader
              step={2}
              titleId={stepTwoTitleId}
              title={step2Title}
              subtitle={t('dashboard.recovery.flow.step2.subtitle')}
            />
            <div className="space-y-4">
              <div className={cn(recoveryCardClass)}>
                <p className="typo-caption-emphasis uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  {t('dashboard.recovery.flow.step2.whatHappened')}
                </p>
                <ol className="mt-5 list-none space-y-4 p-0">
                  <li className="flex gap-3">
                    <span className={stepBadgeClass} aria-hidden>
                      1
                    </span>
                    <p className="pt-0.5 typo-body-sm text-slate-700 dark:text-slate-200">
                      {t('dashboard.recovery.flow.step2.list1', { days: inactivityDaysForCopy })}
                    </p>
                  </li>
                  <li className="flex gap-3">
                    <span className={stepBadgeClass} aria-hidden>
                      2
                    </span>
                    <p className="pt-0.5 typo-body-sm text-slate-700 dark:text-slate-200">
                      {accessNowKeyPersonNames.length === 0 ? (
                        t('dashboard.recovery.flow.step2.list2Fallback')
                      ) : (
                        <>
                          <span className="typo-emphasis-strong text-slate-900 dark:text-slate-50">
                            {keyPersonListLabel}
                          </span>
                          {accessNowKeyPersonNames.length === 1
                            ? t('dashboard.recovery.flow.step2.list2suffixOne')
                            : t('dashboard.recovery.flow.step2.list2suffixOther')}
                        </>
                      )}
                    </p>
                  </li>
                  <li className="flex gap-3">
                    <span className={stepBadgeClass} aria-hidden>
                      3
                    </span>
                    <p className="pt-0.5 typo-body-sm text-slate-700 dark:text-slate-200">
                      {t('dashboard.recovery.flow.step2.list3')}
                    </p>
                  </li>
                </ol>
              </div>
              <div className="flex justify-end">
                <Button type="button" size="lg" variant="primary" onClick={goToStep3}>
                  {t('dashboard.recovery.flow.step2.continue')}
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <RecoveryStepHeader
              step={3}
              titleId="post-release-recovery-title"
              title={t('dashboard.recovery.flow.step3.title')}
              subtitle={t('dashboard.recovery.flow.step3.subtitle')}
            />
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => void resolveDecision('restore_endplan')}
                disabled={isResolvingDecision}
                className={cn(
                  'w-full rounded-2xl border border-ep-border-card bg-ep-surface p-5 text-left transition hover:border-ep-primary-muted hover:bg-ep-primary-softer/40',
                  'disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-ep-primary-accent dark:hover:bg-ep-primary/10',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={iconWellClass}>
                    <RotateCcw {...lucideSm} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="typo-body-sm-emphasis text-slate-900 dark:text-slate-50">
                      {t('dashboard.recovery.flow.step3.restore.title')}
                    </p>
                    <p className="typo-body-sm text-slate-600 dark:text-slate-300">
                      {t('dashboard.recovery.flow.step3.restore.description')}
                    </p>
                    <p className="typo-caption-strong text-ep-primary-accent dark:text-ep-primary-muted">
                      {t('dashboard.recovery.flow.step3.restore.cta')}
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => void resolveDecision('keep_trusted_circle')}
                disabled={isResolvingDecision}
                className={cn(
                  'w-full rounded-2xl border border-ep-border-card bg-ep-surface p-5 text-left transition hover:border-ep-primary-muted hover:bg-ep-primary-softer/40',
                  'disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-ep-primary-accent dark:hover:bg-ep-primary/10',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={iconWellClass}>
                    <Users {...lucideSm} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="typo-body-sm-emphasis text-slate-900 dark:text-slate-50">
                      {t('dashboard.recovery.flow.step3.keep.title')}
                    </p>
                    <p className="typo-body-sm text-slate-600 dark:text-slate-300">
                      {t('dashboard.recovery.flow.step3.keep.description')}
                    </p>
                    <p className="typo-caption-strong text-ep-primary-accent dark:text-ep-primary-muted">
                      {t('dashboard.recovery.flow.step3.keep.cta')}
                    </p>
                  </div>
                </div>
              </button>

              {isResolvingDecision ? (
                <p className="text-center typo-body-sm text-slate-500 dark:text-slate-300">
                  {t('dashboard.recovery.flow.step3.resolving')}
                </p>
              ) : null}
              {decisionError ? (
                <p className="text-center typo-body-sm text-rose-600 dark:text-rose-300">{decisionError}</p>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </ModalOverlay>
  )
}
