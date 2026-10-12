import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { KeyRound, LogOut } from 'lucide-react'
import { useAuthUser, useLogout } from '@/features/auth/session'
import { useSubscription } from '@/features/billing'
import { ROUTES } from '@/app/constants/routes'
import { Button, Card, PasswordInput, toast } from '@/shared/ui'
import { bootstrapCryptoSessionAfterKeySetup } from '../lib/bootstrap-crypto-session'

/** Shown when the account has no encryption keys (e.g. after Start fresh). */
export function SetupEncryptionKeysCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthUser()
  const logout = useLogout()
  const { isPending: isSubscriptionPending } = useSubscription({ enabled: !!user })

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSettingUp, setIsSettingUp] = useState(false)

  const handleSetup = async () => {
    if (!password.trim()) {
      setError(t('dashboard.unlock.passwordRequired'))
      return
    }
    if (!user?.id) {
      setError(t('dashboard.unlock.setupAfterFresh.error'))
      return
    }

    setIsSettingUp(true)
    setError(null)

    try {
      await bootstrapCryptoSessionAfterKeySetup({
        queryClient,
        userId: user.id,
        password,
      })
      setPassword('')
      toast.success(t('dashboard.unlock.setupAfterFresh.toast.success'))
    } catch {
      setError(t('dashboard.unlock.setupAfterFresh.error'))
    } finally {
      setIsSettingUp(false)
    }
  }

  return (
    <Card>
      <div className="mx-auto max-w-sm p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ep-primary-softer dark:bg-ep-primary-dark/50">
            <KeyRound className="h-6 w-6 text-ep-primary dark:text-ep-primary-accent" />
          </div>
          <h3 className="typo-heading-card text-gray-900 dark:text-gray-100">
            {t('dashboard.unlock.setupAfterFresh.title')}
          </h3>
          <p className="mt-1 typo-body-sm text-gray-500 dark:text-gray-400">
            {t('dashboard.unlock.setupAfterFresh.subtitle')}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSetup()
          }}
        >
          <PasswordInput
            label={t('auth.form.password')}
            placeholder={t('auth.form.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error || undefined}
            autoComplete="current-password"
          />
          <Button
            type="submit"
            className="mt-4 w-full"
            loading={isSettingUp || isSubscriptionPending}
            disabled={isSubscriptionPending}
          >
            {t('dashboard.unlock.setupAfterFresh.button')}
          </Button>
          <button
            type="button"
            onClick={async () => {
              await logout.mutateAsync()
              navigate(ROUTES.LOGIN, { replace: true })
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 typo-body-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <LogOut className="h-4 w-4" />
            {t('nav.logout')}
          </button>
        </form>
      </div>
    </Card>
  )
}
