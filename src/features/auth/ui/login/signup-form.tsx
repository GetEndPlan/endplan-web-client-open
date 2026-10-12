import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/constants/routes'
import {
  AuthFormFooter,
  AuthFormHeader,
  AuthFormShell,
  Button,
  InlineAlert,
  Input,
  PasswordInput,
  TextLink,
} from '@/shared/ui'
import { AUTH_ERROR_CODE, AuthClientError, isAuthClientError, signupSchema, type SignupFormData } from '../../model'
import { toast } from '@/shared/ui'
import { useSignup } from '../../session'
import { PasswordStrength } from '../security/password-strength'

type SignupFormProps = {
  onSuccess: () => void
  defaultEmail?: string
  defaultName?: string
  inviteToken?: string
}

export function SignupForm({ onSuccess, defaultEmail = '', defaultName = '', inviteToken = '' }: SignupFormProps) {
  const { t } = useTranslation()
  const signupMutation = useSignup()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    trigger,
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: defaultName, email: defaultEmail, password: '', confirmPassword: '', passwordHint: '' },
  })

  // eslint-disable-next-line react-hooks/incompatible-library -- watch is stable per form instance
  const password = watch('password')
  // eslint-disable-next-line react-hooks/incompatible-library -- watch is stable per form instance
  const confirmPassword = watch('confirmPassword')
  const passwordsMatch = Boolean(confirmPassword) && password === confirmPassword

  const emailField = register('email')
  const passwordField = register('password')
  const confirmPasswordField = register('confirmPassword')

  const onSubmit = async (data: SignupFormData) => {
    try {
      const { confirmPassword, passwordHint, ...rest } = data
      void confirmPassword
      await signupMutation.mutateAsync({
        ...rest,
        passwordHint: passwordHint?.trim() || undefined,
      })
      onSuccess()
    } catch (err) {
      if (isAuthClientError(err) && err.code === AUTH_ERROR_CODE.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL) {
        toast.error(t('auth.errors.userAlreadyExists'), { durationMs: 10_000 })
        return
      }
      const message =
        err instanceof AuthClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('auth.errors.signupFailed')
      setError('root', { message })
    }
  }

  const isEmailLocked = Boolean(defaultEmail)

  const loginLink = inviteToken
    ? `${ROUTES.LOGIN}?invite=${inviteToken}&email=${encodeURIComponent(defaultEmail)}`
    : ROUTES.LOGIN

  return (
    <AuthFormShell>
      <AuthFormHeader
        title={t('auth.signup.title')}
        subtitle={inviteToken ? t('auth.signup.subtitleInvite') : undefined}
      />

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <fieldset className="space-y-4" disabled={isSubmitting || signupMutation.isPending}>
          <Input
            label={t('auth.form.name')}
            type="text"
            autoComplete="name"
            placeholder={t('auth.form.namePlaceholder')}
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label={t('auth.form.email')}
            type="email"
            autoComplete="email"
            placeholder={t('auth.form.emailPlaceholder')}
            error={errors.email?.message}
            readOnly={isEmailLocked}
            className={isEmailLocked ? 'bg-slate-100 dark:bg-ep-surface-subtle cursor-not-allowed' : ''}
            {...emailField}
            onChange={(event) => {
              void emailField.onChange(event)
              if (event.target.value.length > 0) {
                void trigger('email')
              } else {
                clearErrors('email')
              }
            }}
          />

          <div>
            <PasswordInput
              label={t('auth.form.masterPassword')}
              autoComplete="new-password"
              placeholder="••••••••••••"
              error={errors.password?.message}
              {...passwordField}
              onChange={(event) => {
                void passwordField.onChange(event)
                if (confirmPassword) {
                  void trigger('confirmPassword')
                }
              }}
            />
            <PasswordStrength password={password || ''} />
          </div>

          <PasswordInput
            label={t('auth.form.confirmMasterPassword')}
            autoComplete="new-password"
            placeholder="••••••••••••"
            error={passwordsMatch || !confirmPassword ? undefined : errors.confirmPassword?.message}
            success={passwordsMatch}
            successLabel={t('auth.form.passwordsMatch')}
            {...confirmPasswordField}
            onChange={(event) => {
              void confirmPasswordField.onChange(event)
              if (event.target.value.length > 0) {
                void trigger('confirmPassword')
              } else {
                clearErrors('confirmPassword')
              }
            }}
          />

          <Input
            label={t('auth.form.passwordHint')}
            autoComplete="off"
            placeholder={t('auth.form.passwordHintPlaceholder')}
            {...register('passwordHint')}
          />
          <p className="typo-caption text-slate-500 dark:text-slate-400 -mt-2">{t('auth.form.passwordHintHelp')}</p>

          {errors.root?.message ? <InlineAlert>{errors.root.message}</InlineAlert> : null}

          <Button
            type="submit"
            fullWidth
            loading={isSubmitting || signupMutation.isPending}
            disabled={isSubmitting || signupMutation.isPending}
            variant="primary"
          >
            {isSubmitting || signupMutation.isPending ? t('auth.signup.creating') : t('auth.signup.button')}
          </Button>
        </fieldset>
      </form>

      <AuthFormFooter>
        {t('auth.signup.hasAccount')}{' '}
        <TextLink to={loginLink}>{t('auth.signup.loginLink')}</TextLink>
      </AuthFormFooter>
    </AuthFormShell>
  )
}
