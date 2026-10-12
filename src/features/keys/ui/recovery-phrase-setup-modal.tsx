import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Checkbox,
  InlineAlert,
  ModalOverlay,
  MutedTextButton,
  ONBOARDING_MODAL_BACKDROP_CLASSNAME,
  PasswordInput,
  toast,
} from '@/shared/ui'
import { useAuthUser, usePatchOnboardingState } from '@/features/auth'
import { upsertRecoveryPhraseToVault } from '@/features/endplan/api/services/recovery-phrase-vault-service'
import { vaultKeys } from '@/features/endplan/api/keys/vault-query-keys'
import { keysKeys } from '../api/hooks/keys-hooks'
import { setupOrRotateRecoveryKey, unlockPrivateKey } from '../api/keys-service'
import type { UserKeysResponse } from '../api/keys-api'
import { useKeyMaterial } from '../hooks/use-key-material'
import { useKeysStore } from '../model/keys-store'
import { generateRecoveryMnemonic12, splitRecoveryMnemonicWords } from '../model/recovery-phrase'
import { printRecoveryPhraseSheet } from '../lib/print-recovery-phrase-sheet'
import { RecoveryPhraseCopyActions } from './recovery-phrase-copy-actions'
import { RecoveryPhraseWordGrid } from './recovery-phrase-word-grid'

const RECOVERY_PHRASE_DEFER_MS = 24 * 60 * 60 * 1000

type RecoveryPhraseSetupModalProps = {
  keys: UserKeysResponse
  onClose: () => void
}

type Step = 'password' | 'phrase'

export function RecoveryPhraseSetupModal({ keys, onClose }: RecoveryPhraseSetupModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { user } = useAuthUser()
  const patchOnboarding = usePatchOnboardingState()
  const {
    privateKeyB64,
    publicKeyB64,
    pqPublicKeyB64,
    pqPrivateKeyB64,
  } = useKeyMaterial({ enabled: true })
  const storeKeys = useKeysStore((s) => s.keys)
  const [keysHydrated, setKeysHydrated] = useState(() => useKeysStore.persist.hasHydrated())

  const [step, setStep] = useState<Step>('password')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [mnemonic, setMnemonic] = useState<string | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)
  const [isWorking, setIsWorking] = useState(false)

  const words = mnemonic ? splitRecoveryMnemonicWords(mnemonic) : []

  useEffect(() => {
    const unsubscribe = useKeysStore.persist.onFinishHydration(() => setKeysHydrated(true))
    return unsubscribe
  }, [])

  const hasSessionKeyMaterial =
    keysHydrated &&
    !!privateKeyB64 &&
    storeKeys != null &&
    storeKeys.publicKeyB64 === keys.publicKeyB64

  /** Skip the unlock step when key material is already in memory after login; password is still required once to encrypt the rotation. */
  useEffect(() => {
    if (!hasSessionKeyMaterial || mnemonic != null) return
    setMnemonic(generateRecoveryMnemonic12())
    setStep('phrase')
  }, [hasSessionKeyMaterial, mnemonic])

  const showPhrasePasswordField = step === 'phrase' && !password.trim()
  const canDeferFromBackdrop = !isWorking && (step === 'password' || showPhrasePasswordField)

  const deferSnooze = useCallback(async () => {
    if (isWorking) return
    setIsWorking(true)
    try {
      const until = new Date(Date.now() + RECOVERY_PHRASE_DEFER_MS).toISOString()
      await patchOnboarding.mutateAsync({ recoveryPhraseOnboardingDeferredUntil: until })
      onClose()
    } catch {
      toast.error(t('dashboard.recoveryPhraseSetup.toast.deferError'))
    } finally {
      setIsWorking(false)
    }
  }, [isWorking, onClose, patchOnboarding, t])

  const handlePasswordContinue = async () => {
    if (!password.trim()) {
      setPasswordError(t('dashboard.recoveryPhraseSetup.passwordRequired'))
      return
    }
    setPasswordError(null)
    setIsWorking(true)
    try {
      await unlockPrivateKey(keys, password)
      setMnemonic(generateRecoveryMnemonic12())
      setStep('phrase')
    } catch {
      setPasswordError(t('dashboard.recoveryPhraseSetup.passwordInvalid'))
    } finally {
      setIsWorking(false)
    }
  }

  const copyPhrase = async () => {
    if (!mnemonic) return
    try {
      await navigator.clipboard.writeText(mnemonic)
      toast.success(t('dashboard.recoveryPhraseSetup.toast.copied'))
    } catch {
      toast.error(t('dashboard.recoveryPhraseSetup.toast.copyError'))
    }
  }

  const handlePrintPdf = () => {
    if (!mnemonic) return
    const opened = printRecoveryPhraseSheet({
      title: t('dashboard.recoveryPhraseSetup.printTitle'),
      subtitle: t('dashboard.recoveryPhraseSetup.printSubtitle'),
      words: splitRecoveryMnemonicWords(mnemonic),
      footerNote: t('dashboard.recoveryPhraseSetup.printFooter'),
    })
    if (!opened) {
      toast.error(t('dashboard.recoveryPhraseSetup.toast.printBlocked'))
    }
  }

  const handleFinalContinue = async () => {
    if (!mnemonic || !password.trim() || !acknowledged) return
    setIsWorking(true)
    setPasswordError(null)
    try {
      await setupOrRotateRecoveryKey(password, { recoveryMnemonic: mnemonic })

      if (user?.id && publicKeyB64 && privateKeyB64) {
        try {
          await upsertRecoveryPhraseToVault({
            ownerId: user.id,
            publicKeyB64,
            privateKeyB64,
            pqPublicKeyB64,
            pqPrivateKeyB64,
            mnemonic,
          })
          await queryClient.invalidateQueries({ queryKey: vaultKeys.all })
        } catch {
          toast.info(t('dashboard.recoveryPhraseSetup.toast.vaultBackupFailed'), { durationMs: 9000 })
        }
      }

      await patchOnboarding.mutateAsync({ recoveryPhraseOnboardingCompleted: true })
      await queryClient.invalidateQueries({ queryKey: keysKeys.all })
      toast.success(t('dashboard.recoveryPhraseSetup.toast.saved'))
      onClose()
    } catch {
      toast.error(t('dashboard.recoveryPhraseSetup.toast.saveError'))
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <ModalOverlay
      onBackdropClick={canDeferFromBackdrop ? () => void deferSnooze() : undefined}
      backdropClassName={ONBOARDING_MODAL_BACKDROP_CLASSNAME}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto scrollbar-hidden rounded-[20px] border border-ep-border-card bg-ep-surface p-6 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recovery-phrase-setup-title"
      >
        <p className="typo-caption-emphasis uppercase tracking-[0.2em] text-ep-primary dark:text-ep-primary-accent">
          {t('dashboard.recoveryPhraseSetup.kicker')}
        </p>
        <h2
          id="recovery-phrase-setup-title"
          className="mt-2 typo-heading-card text-slate-950 dark:text-slate-50 sm:text-xl"
        >
          {step === 'password'
            ? t('dashboard.recoveryPhraseSetup.titlePassword')
            : t('dashboard.recoveryPhraseSetup.titlePhrase')}
        </h2>
        <p className="mt-2 typo-body-sm text-slate-600 dark:text-slate-300">
          {step === 'password'
            ? t('dashboard.recoveryPhraseSetup.introPassword')
            : t('dashboard.recoveryPhraseSetup.introPhrase')}
        </p>
        {step === 'phrase' && showPhrasePasswordField ? (
          <p className="mt-2 typo-body-sm text-slate-600 dark:text-slate-300">
            {t('dashboard.recoveryPhraseSetup.introPhraseSavePassword')}
          </p>
        ) : null}

        {step === 'password' ? (
          <div className="mt-6 space-y-4">
            <PasswordInput
              label={t('dashboard.recoveryPhraseSetup.passwordLabel')}
              placeholder={t('dashboard.recoveryPhraseSetup.passwordPlaceholder')}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPasswordError(null)
              }}
              error={passwordError ?? undefined}
              autoComplete="current-password"
              disabled={isWorking}
            />
            <Button
              type="button"
              className="w-full"
              loading={isWorking}
              disabled={!password.trim()}
              onClick={() => void handlePasswordContinue()}
            >
              {t('dashboard.recoveryPhraseSetup.ctaGenerate')}
            </Button>
            <div className="text-center">
              <MutedTextButton type="button" disabled={isWorking} onClick={() => void deferSnooze()}>
                {t('dashboard.recoveryPhraseSetup.remindLater')}
              </MutedTextButton>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-ep-border-subtle bg-ep-surface px-4 py-4">
              <p className="typo-caption-emphasis uppercase tracking-wider text-ep-body-muted">
                {t('dashboard.recoveryPhraseSetup.phraseLabel')}
              </p>
              <div className="mt-3">
                <RecoveryPhraseWordGrid words={words} />
              </div>
            </div>

            <RecoveryPhraseCopyActions
              copyLabel={t('dashboard.recoveryPhraseSetup.copyAll')}
              downloadLabel={t('dashboard.recoveryPhraseSetup.downloadPdf')}
              disabled={isWorking}
              onCopy={() => void copyPhrase()}
              onDownloadPdf={handlePrintPdf}
            />

            <InlineAlert variant="warning" align="start">
              {t('dashboard.recoveryPhraseSetup.warning')}
            </InlineAlert>

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-600">
              <Checkbox
                id="recovery-phrase-ack"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                disabled={isWorking}
                className="mt-0.5"
              />
              <label htmlFor="recovery-phrase-ack" className="typo-body-sm cursor-pointer text-ep-body">
                {t('dashboard.recoveryPhraseSetup.checkbox')}
              </label>
            </div>

            {showPhrasePasswordField ? (
              <PasswordInput
                label={t('dashboard.recoveryPhraseSetup.passwordLabel')}
                placeholder={t('dashboard.recoveryPhraseSetup.passwordPlaceholder')}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError(null)
                }}
                error={passwordError ?? undefined}
                autoComplete="current-password"
                disabled={isWorking}
              />
            ) : null}

            <Button
              type="button"
              className="w-full"
              loading={isWorking}
              disabled={!acknowledged || !password.trim()}
              onClick={() => void handleFinalContinue()}
            >
              {t('dashboard.recoveryPhraseSetup.ctaContinue')}
            </Button>
            {showPhrasePasswordField ? (
              <div className="text-center">
                <MutedTextButton type="button" disabled={isWorking} onClick={() => void deferSnooze()}>
                  {t('dashboard.recoveryPhraseSetup.remindLater')}
                </MutedTextButton>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </ModalOverlay>
  )
}
