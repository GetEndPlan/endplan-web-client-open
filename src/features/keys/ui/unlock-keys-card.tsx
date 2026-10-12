import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { KeyRound, Lock, LogOut } from 'lucide-react'
import { ActionDialogFrame, Button, Card, Input, MutedTextButton, PasswordInput, toast } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { clearAllPendingAssetsAutosaveSnapshots } from '@/features/endplan'
import { useKeysStore } from '../model/keys-store'
import { useLogout } from '@/features/auth/session'
import { ROUTES } from '@/app/constants/routes'
import { profileApi } from '@/features/auth/api/profile-api'
import { useKeys, keysKeys } from '../api/hooks/keys-hooks'
import { invalidateCryptoSessionQueries } from '../lib/bootstrap-crypto-session'
import { recoverKeysAfterPasswordReset, unlockPrivateKey } from '../api/keys-service'
import {
  shouldAutoOpenUnlockRecoveryModal,
  shouldShowUnlockRecoveryHelp,
} from '../model/unlock-recovery-gate'

const START_FRESH_CONFIRM = 'START FRESH'

type RecoveryModalStep = 'choose' | 'restore' | 'startFresh'

/** Password unlock; after three failed attempts, users with a recovery wrap can restore or start fresh. */
export function UnlockKeysCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: keysFromApi } = useKeys()
  const unlockKeys = useKeysStore((s) => s.unlockKeys)
  const logout = useLogout()

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [consecutiveFailedUnlocks, setConsecutiveFailedUnlocks] = useState(0)

  const [recoveryModalStep, setRecoveryModalStep] = useState<RecoveryModalStep | null>(null)
  const [recoverySecret, setRecoverySecret] = useState('')
  const [isRecovering, setIsRecovering] = useState(false)
  const [startFreshConfirm, setStartFreshConfirm] = useState('')
  const [isStartingFresh, setIsStartingFresh] = useState(false)

  const resetRecoveryModalState = () => {
    setRecoveryModalStep(null)
    setRecoverySecret('')
    setStartFreshConfirm('')
  }

  const closeRecoveryModal = () => {
    if (isRecovering || isStartingFresh) return
    resetRecoveryModalState()
  }

  const handleUnlock = async () => {
    if (!password.trim()) {
      setError(t('dashboard.unlock.passwordRequired'))
      return
    }

    setIsUnlocking(true)
    setError(null)

    try {
      await unlockKeys(password)
      setPassword('')
      setConsecutiveFailedUnlocks(0)
    } catch {
      const nextFailedCount = consecutiveFailedUnlocks + 1
      setConsecutiveFailedUnlocks(nextFailedCount)
      setError(t('dashboard.unlock.error'))
      if (shouldAutoOpenUnlockRecoveryModal(keysFromApi?.hasRecoveryWrap === true, nextFailedCount)) {
        setRecoveryModalStep('choose')
        setRecoverySecret('')
      }
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleRecover = async () => {
    if (!password.trim()) {
      toast.error(t('dashboard.unlock.recoveryGate.toast.passwordRequired'))
      return
    }
    if (!recoverySecret.trim()) {
      toast.error(t('dashboard.unlock.recovery.toast.missingSecret'))
      return
    }
    setIsRecovering(true)
    try {
      const nextKeys = await recoverKeysAfterPasswordReset(password, recoverySecret)
      const unlocked = await unlockPrivateKey(nextKeys, password)
      useKeysStore.setState({
        keys: nextKeys,
        publicKeyB64: nextKeys.publicKeyB64,
        pqPublicKeyB64: nextKeys.pqPublicKeyB64 ?? null,
        privateKeyB64: unlocked.privateKeyB64,
        pqPrivateKeyB64: unlocked.pqPrivateKeyB64,
        isUnlocking: false,
        error: null,
      })
      await queryClient.invalidateQueries({ queryKey: keysKeys.all })
      setPassword('')
      setRecoverySecret('')
      setConsecutiveFailedUnlocks(0)
      resetRecoveryModalState()
      toast.success(t('dashboard.unlock.recovery.toast.success'))
    } catch {
      toast.error(t('dashboard.unlock.recovery.toast.error'))
    } finally {
      setIsRecovering(false)
    }
  }

  const handleStartFresh = async () => {
    if (startFreshConfirm !== START_FRESH_CONFIRM) {
      return
    }
    setIsStartingFresh(true)
    try {
      await profileApi.startFreshCrypto()
      useKeysStore.getState().clearKeys()
      await clearAllPendingAssetsAutosaveSnapshots()
      invalidateCryptoSessionQueries(queryClient)
      setRecoverySecret('')
      resetRecoveryModalState()
      setPassword('')
      setConsecutiveFailedUnlocks(0)
      toast.success(t('dashboard.unlock.startFresh.toast.success'))
    } catch {
      toast.error(t('dashboard.unlock.startFresh.toast.error'))
    } finally {
      setIsStartingFresh(false)
    }
  }

  const modalTitle =
    recoveryModalStep === 'choose'
      ? t('dashboard.unlock.recoveryModal.title')
      : recoveryModalStep === 'restore'
        ? t('dashboard.unlock.recoveryGate.sectionTitle')
        : t('dashboard.unlock.startFresh.title')

  const modalDescription =
    recoveryModalStep === 'choose' ? (
      <p>{t('dashboard.unlock.recoveryModal.description')}</p>
    ) : recoveryModalStep === 'restore' ? (
      <p>{t('dashboard.unlock.recovery.instructions')}</p>
    ) : (
      <p>{t('dashboard.unlock.startFresh.description')}</p>
    )

  const modalTone = recoveryModalStep === 'startFresh' ? 'danger' : 'default'
  const modalIcon =
    recoveryModalStep === 'startFresh' ? (
      <Lock className="h-5 w-5" strokeWidth={2.2} />
    ) : (
      <KeyRound className="h-5 w-5" strokeWidth={2.2} />
    )

  return (
    <>
      <Card>
        <div className="mx-auto max-w-sm p-6">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
              <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="typo-heading-card text-gray-900 dark:text-gray-100">{t('dashboard.unlock.title')}</h3>
            <p className="mt-1 typo-body-sm text-gray-500 dark:text-gray-400">
              {t('dashboard.unlock.subtitle')}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleUnlock()
            }}
          >
            <PasswordInput
              label={t('auth.form.password')}
              placeholder={t('auth.form.passwordPlaceholder')}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError(null)
              }}
              error={error || undefined}
            />
            <Button type="submit" className="mt-4 w-full" loading={isUnlocking}>
              {t('dashboard.unlock.button')}
            </Button>
            {shouldShowUnlockRecoveryHelp(keysFromApi?.hasRecoveryWrap === true, consecutiveFailedUnlocks) ? (
              <MutedTextButton
                className="mt-3 w-full text-center"
                disabled={isUnlocking}
                onClick={() => {
                  setRecoveryModalStep('choose')
                  setRecoverySecret('')
                }}
              >
                {t('dashboard.unlock.recovery.cantUnlockCta')}
              </MutedTextButton>
            ) : null}
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

      {recoveryModalStep ? (
        <ActionDialogFrame
          title={modalTitle}
          description={modalDescription}
          onClose={closeRecoveryModal}
          icon={modalIcon}
          tone={modalTone}
          showCloseButton
          closeButtonLabel={t('common.close')}
          isCloseDisabled={isRecovering || isStartingFresh}
          maxWidthClassName={recoveryModalStep === 'startFresh' ? 'max-w-lg' : 'max-w-md'}
        >
          {recoveryModalStep === 'choose' ? (
            <div className="flex flex-col gap-3">
              <Button type="button" variant="secondary" className="w-full" onClick={closeRecoveryModal}>
                {t('dashboard.unlock.recoveryModal.tryPasswordAgain')}
              </Button>
              <Button type="button" className="w-full" onClick={() => setRecoveryModalStep('restore')}>
                {t('dashboard.unlock.recoveryModal.restoreCta')}
              </Button>
              <Button type="button" variant="danger" className="w-full" onClick={() => setRecoveryModalStep('startFresh')}>
                {t('dashboard.unlock.startFresh.cta')}
              </Button>
            </div>
          ) : null}

          {recoveryModalStep === 'restore' ? (
            <div className="space-y-4">
              <PasswordInput
                label={t('auth.form.password')}
                placeholder={t('auth.form.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <label className="block typo-label" htmlFor="recovery-secret-input">
                {t('dashboard.unlock.recovery.secretLabel')}
              </label>
              <textarea
                id="recovery-secret-input"
                value={recoverySecret}
                onChange={(e) => setRecoverySecret(e.target.value)}
                placeholder={t('dashboard.unlock.recovery.secretPlaceholder')}
                autoComplete="off"
                disabled={isRecovering}
                rows={3}
                className={cn(
                  'w-full rounded-lg border border-slate-200 px-3 py-2 typo-input shadow-sm transition',
                  'placeholder:text-slate-400',
                  'focus:border-ep-primary focus:outline-none focus:ring-2 focus:ring-ep-primary focus:ring-offset-1',
                  'dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500',
                  'dark:focus:border-ep-primary-accent dark:focus:ring-ep-primary-accent dark:focus:ring-offset-ep-surface',
                )}
              />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setRecoveryModalStep('choose')
                    setRecoverySecret('')
                  }}
                  disabled={isRecovering}
                >
                  {t('dashboard.unlock.recoveryModal.back')}
                </Button>
                <Button
                  type="button"
                  className="sm:min-w-36"
                  loading={isRecovering}
                  disabled={!recoverySecret.trim() || !password.trim()}
                  onClick={() => void handleRecover()}
                >
                  {t('dashboard.unlock.recovery.submit')}
                </Button>
              </div>
            </div>
          ) : null}

          {recoveryModalStep === 'startFresh' ? (
            <div className="space-y-4">
              <Input
                label={t('dashboard.unlock.startFresh.confirmLabel', { phrase: START_FRESH_CONFIRM })}
                value={startFreshConfirm}
                onChange={(e) => setStartFreshConfirm(e.target.value)}
                placeholder={t('dashboard.unlock.startFresh.confirmPlaceholder')}
                autoComplete="off"
                disabled={isStartingFresh}
              />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setRecoveryModalStep('choose')
                    setStartFreshConfirm('')
                  }}
                  disabled={isStartingFresh}
                >
                  {t('dashboard.unlock.recoveryModal.back')}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={startFreshConfirm !== START_FRESH_CONFIRM}
                  loading={isStartingFresh}
                  onClick={() => void handleStartFresh()}
                >
                  {t('dashboard.unlock.startFresh.submit')}
                </Button>
              </div>
            </div>
          ) : null}
        </ActionDialogFrame>
      ) : null}
    </>
  )
}
