import { useTranslation } from 'react-i18next'
import {
  AuthFormFooter,
  AuthFormHeader,
  AuthFormShell,
  Button,
  InlineAlert,
  MutedTextButton,
  TextLinkButton,
} from '@/shared/ui'
import { AuthLayout, VerificationCodeInput, useVerifyEmailPage } from '@/features/auth'

export function VerifyEmailPage() {
  const { t } = useTranslation()
  const {
    user,
    code,
    isLoading,
    isSending,
    error,
    success,
    countdown,
    canVerify,
    setCode,
    resendCode,
    verifyCode,
    logoutAndRetry,
  } = useVerifyEmailPage()

  if (!user) {
    return null
  }

  return (
    <AuthLayout>
      <AuthFormShell>
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-ep-primary-softer dark:bg-ep-primary-dark/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-ep-primary dark:text-ep-primary-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        <AuthFormHeader
          align="center"
          title={t('auth.verify.title')}
          subtitle={
            <>
              {t('auth.verify.subtitle')}{' '}
              <strong className="text-slate-900 dark:text-slate-100">{user.email}</strong>
            </>
          }
        />

        <VerificationCodeInput
          value={code}
          onChange={setCode}
          onComplete={verifyCode}
          error={!!error}
          disabled={isLoading}
        />

        {error ? (
          <InlineAlert variant="error" align="center">
            {error}
          </InlineAlert>
        ) : null}

        {success ? (
          <InlineAlert variant="success" align="center">
            {success}
          </InlineAlert>
        ) : null}

        <Button
          type="button"
          fullWidth
          loading={isLoading}
          disabled={!canVerify || isLoading}
          onClick={() => verifyCode(code.join(''))}
          variant="primary"
        >
          {isLoading ? t('auth.verify.verifying') : t('auth.verify.button')}
        </Button>

        <div className="text-center">
          <MutedTextButton onClick={resendCode} disabled={countdown > 0 || isSending}>
            {isSending
              ? t('auth.verify.sending')
              : countdown > 0
                ? t('auth.verify.resendIn', { seconds: countdown })
                : t('auth.verify.resend')}
          </MutedTextButton>
        </div>

        <AuthFormFooter divided>
          <p>
            {t('auth.verify.wrongEmail')}{' '}
            <TextLinkButton variant="emphasis" onClick={logoutAndRetry}>
              {t('auth.logout.button')}
            </TextLinkButton>{' '}
            {t('auth.verify.andTryAgain')}
          </p>
        </AuthFormFooter>
      </AuthFormShell>
    </AuthLayout>
  )
}
