import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/constants/routes'
import {
  AuthFormFooter,
  AuthFormHeader,
  AuthFormShell,
  Button,
  InlineAlert,
  Input,
  MutedTextButton,
  PasswordInput,
  TextLink,
} from '@/shared/ui'
import { AuthLayout, VerificationCodeInput, useForgotPasswordPage } from '@/features/auth'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const {
    step,
    email,
    code,
    newPassword,
    confirmPassword,
    isLoading,
    isSending,
    error,
    success,
    countdown,
    passwordMatch,
    canVerifyCode,
    canSubmitPassword,
    setEmail,
    setCode,
    setNewPassword,
    setConfirmPassword,
    sendCode,
    resendCode,
    verifyCode,
    resetPassword,
  } = useForgotPasswordPage()

  return (
    <AuthLayout>
      <AuthFormShell>
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-ep-primary-softer dark:bg-ep-primary-dark/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-ep-primary dark:text-ep-primary-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
        </div>

        {step === 1 ? (
          <>
            <AuthFormHeader
              align="center"
              title={t('auth.forgotPassword.title')}
              subtitle={t('auth.forgotPassword.subtitle')}
            />
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void sendCode()
              }}
              className="space-y-4"
            >
              <Input
                label={t('auth.form.email')}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.form.emailPlaceholder')}
                error={error ?? undefined}
                disabled={isSending}
                required
              />
              {success ? (
                <InlineAlert variant="success" align="center">
                  {success}
                </InlineAlert>
              ) : null}
              <Button type="submit" fullWidth loading={isSending} disabled={!email.trim() || isSending}>
                {isSending ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.sendCode')}
              </Button>
            </form>
          </>
        ) : step === 2 ? (
          <>
            <AuthFormHeader
              align="center"
              title={t('auth.forgotPassword.title')}
              subtitle={
                <>
                  {t('auth.forgotPassword.subtitleStep2')}{' '}
                  <strong className="text-slate-900 dark:text-slate-100">{email}</strong>
                </>
              }
            />
            <div className="space-y-4">
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
                disabled={!canVerifyCode || isLoading}
                onClick={() => verifyCode(code.join(''))}
              >
                {isLoading ? t('auth.forgotPassword.verifying') : t('auth.forgotPassword.verifyCode')}
              </Button>
              <div className="text-center">
                <MutedTextButton onClick={resendCode} disabled={countdown > 0 || isSending}>
                  {isSending
                    ? t('auth.forgotPassword.sending')
                    : countdown > 0
                      ? t('auth.forgotPassword.resendIn', { seconds: countdown })
                      : t('auth.forgotPassword.resend')}
                </MutedTextButton>
              </div>
            </div>
          </>
        ) : (
          <>
            <AuthFormHeader
              align="center"
              title={t('auth.forgotPassword.title')}
              subtitle={t('auth.forgotPassword.subtitleStep3')}
            />
            <div className="space-y-4">
              <PasswordInput
                label={t('auth.forgotPassword.newPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <PasswordInput
                label={t('auth.forgotPassword.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                error={confirmPassword && !passwordMatch ? t('auth.errors.passwordMismatch') : undefined}
                disabled={isLoading}
                autoComplete="new-password"
              />
              {error ? (
                <InlineAlert variant="error" align="center">
                  {error}
                </InlineAlert>
              ) : null}
              <Button
                type="button"
                fullWidth
                loading={isLoading}
                disabled={!canSubmitPassword || isLoading}
                onClick={() => void resetPassword()}
              >
                {isLoading ? t('auth.forgotPassword.resetting') : t('auth.forgotPassword.resetButton')}
              </Button>
            </div>
          </>
        )}

        <AuthFormFooter divided>
          <TextLink to={ROUTES.LOGIN}>{t('auth.forgotPassword.backToLogin')}</TextLink>
        </AuthFormFooter>
      </AuthFormShell>
    </AuthLayout>
  )
}
