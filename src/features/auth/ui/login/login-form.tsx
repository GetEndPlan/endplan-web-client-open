import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/constants/routes'
import {
  AuthFormFooter,
  AuthFormHeader,
  AuthFormShell,
  Button,
  Checkbox,
  FormRowActions,
  InlineAlert,
  Input,
  PasswordInput,
  TextLink,
} from '@/shared/ui'
import type { User } from '@/entities/user'
import { loginSchema, type LoginFormData } from '../../model'
import { useLogin } from '../../session'

type LoginFormProps = {
  onSuccess: (user: User) => void
  defaultEmail?: string
  inviteToken?: string
}

export function LoginForm({ onSuccess, defaultEmail = '', inviteToken = '' }: LoginFormProps) {
  const { t } = useTranslation()
  const loginMutation = useLogin()
  const [rememberDevice, setRememberDevice] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail, password: '' },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const user = await loginMutation.mutateAsync(data)
      onSuccess(user)
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : t('auth.errors.loginFailed'),
      })
    }
  }

  const isEmailLocked = Boolean(defaultEmail)

  const signupLink = inviteToken
    ? `/signup?invite=${inviteToken}&email=${encodeURIComponent(defaultEmail)}`
    : '/signup'

  return (
    <AuthFormShell>
      <AuthFormHeader
        title={t('auth.login.title')}
        subtitle={inviteToken ? t('auth.login.subtitleInvite') : undefined}
      />

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <fieldset className="space-y-4" disabled={isSubmitting || loginMutation.isPending}>
          <Input
            label={t('auth.form.email')}
            type="email"
            autoComplete="email"
            placeholder={t('auth.form.emailPlaceholder')}
            error={errors.email?.message}
            readOnly={isEmailLocked}
            className={isEmailLocked ? 'bg-slate-100 dark:bg-ep-surface-subtle cursor-not-allowed' : ''}
            {...register('email')}
          />

          <PasswordInput
            label={t('auth.form.masterPassword')}
            autoComplete="current-password"
            placeholder="••••••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <FormRowActions
            start={
              <Checkbox
                id="remember-device"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                label={t('auth.login.rememberDevice')}
              />
            }
            end={
              <TextLink variant="bodyStrong" to={ROUTES.FORGOT_PASSWORD}>
                {t('auth.login.forgotPassword')}
              </TextLink>
            }
          />

          {errors.root?.message ? <InlineAlert>{errors.root.message}</InlineAlert> : null}

          <Button
            type="submit"
            fullWidth
            loading={isSubmitting || loginMutation.isPending}
            disabled={isSubmitting || loginMutation.isPending}
            variant="primary"
          >
            {isSubmitting || loginMutation.isPending ? t('auth.login.loggingIn') : t('auth.login.button')}
          </Button>
        </fieldset>
      </form>

      <AuthFormFooter>
        {t('auth.login.noAccount')}{' '}
        <TextLink to={signupLink}>{t('auth.login.signupLink')}</TextLink>
      </AuthFormFooter>
    </AuthFormShell>
  )
}
