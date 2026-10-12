import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Checkbox,
  InlineAlert,
  ModalOverlay,
  MutedTextButton,
  ONBOARDING_MODAL_BACKDROP_CLASSNAME,
  toast,
} from '@/shared/ui'
import { usePatchOnboardingState } from '@/features/auth'
import { decryptRecoveryPhraseVaultPayload } from '@/features/endplan/api/services/recovery-phrase-vault-service'
import { useVaultSections } from '@/features/endplan/api/hooks/queries/use-vault-queries'
import { SECTION_ID } from '@/features/endplan/model/vault-section-types'
import type { VaultResponse } from '@/features/endplan/api/clients/vault-api'
import { keysKeys } from '../api/hooks/keys-hooks'
import { splitRecoveryMnemonicWords } from '../model/recovery-phrase'
import { printRecoveryPhraseSheet } from '../lib/print-recovery-phrase-sheet'
import { useKeyMaterial } from '../hooks/use-key-material'
import { RecoveryPhraseCopyActions } from './recovery-phrase-copy-actions'
import { RecoveryPhraseWordGrid } from './recovery-phrase-word-grid'

const RECOVERY_PHRASE_DEFER_MS = 24 * 60 * 60 * 1000

type RecoveryPhraseDisclosureModalProps = {
  vault: VaultResponse
  onClose: () => void
}

export function RecoveryPhraseDisclosureModal({ vault, onClose }: RecoveryPhraseDisclosureModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const patchOnboarding = usePatchOnboardingState()
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial({ enabled: true })
  const sectionsQuery = useVaultSections(vault.id, { enabled: !!vault.id })

  const recoverySection = useMemo(
    () => sectionsQuery.data?.find((s) => s.sectionType === SECTION_ID.RECOVERY),
    [sectionsQuery.data],
  )

  const [mnemonic, setMnemonic] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [isWorking, setIsWorking] = useState(false)

  const words = mnemonic ? splitRecoveryMnemonicWords(mnemonic) : []

  useEffect(() => {
    if (!recoverySection || !publicKeyB64 || !privateKeyB64) return
    let cancelled = false
    void (async () => {
      try {
        const payload = await decryptRecoveryPhraseVaultPayload({
          vault,
          section: recoverySection,
          publicKeyB64,
          privateKeyB64,
          pqPrivateKeyB64,
        })
        if (!cancelled) setMnemonic(payload.mnemonic)
      } catch {
        if (!cancelled) setLoadError(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [vault, recoverySection, publicKeyB64, privateKeyB64, pqPrivateKeyB64])

  const deferSnooze = useCallback(async () => {
    if (isWorking) return
    setIsWorking(true)
    try {
      const until = new Date(Date.now() + RECOVERY_PHRASE_DEFER_MS).toISOString()
      await patchOnboarding.mutateAsync({ recoveryPhraseOnboardingDeferredUntil: until })
      onClose()
    } catch {
      toast.error(t('dashboard.recoveryPhraseDisclosure.toast.deferError'))
    } finally {
      setIsWorking(false)
    }
  }, [isWorking, onClose, patchOnboarding, t])

  const copyPhrase = async () => {
    if (!mnemonic) return
    try {
      await navigator.clipboard.writeText(mnemonic)
      toast.success(t('dashboard.recoveryPhraseDisclosure.toast.copied'))
    } catch {
      toast.error(t('dashboard.recoveryPhraseDisclosure.toast.copyError'))
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

  const handleContinue = async () => {
    if (!acknowledged) return
    setIsWorking(true)
    try {
      await patchOnboarding.mutateAsync({ recoveryPhraseOnboardingCompleted: true })
      await queryClient.invalidateQueries({ queryKey: keysKeys.all })
      toast.success(t('dashboard.recoveryPhraseDisclosure.toast.acknowledged'))
      onClose()
    } catch {
      toast.error(t('dashboard.recoveryPhraseDisclosure.toast.saveError'))
    } finally {
      setIsWorking(false)
    }
  }

  const canDeferFromBackdrop = !isWorking
  const showLoading =
    sectionsQuery.isLoading || (!loadError && !mnemonic && !sectionsQuery.isError && !!recoverySection)

  return (
    <ModalOverlay
      onBackdropClick={canDeferFromBackdrop ? () => void deferSnooze() : undefined}
      backdropClassName={ONBOARDING_MODAL_BACKDROP_CLASSNAME}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto scrollbar-hidden rounded-[20px] border border-ep-border-card bg-ep-surface p-6 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recovery-phrase-disclosure-title"
      >
        <p className="typo-caption-emphasis uppercase tracking-[0.2em] text-ep-primary dark:text-ep-primary-accent">
          {t('dashboard.recoveryPhraseDisclosure.kicker')}
        </p>
        <h2
          id="recovery-phrase-disclosure-title"
          className="mt-2 typo-heading-card text-slate-950 dark:text-slate-50 sm:text-xl"
        >
          {t('dashboard.recoveryPhraseDisclosure.title')}
        </h2>
        <p className="mt-2 typo-body-sm text-slate-600 dark:text-slate-300">
          {t('dashboard.recoveryPhraseDisclosure.intro')}
        </p>

        {loadError ? (
          <InlineAlert variant="warning" className="mt-6" align="start">
            {t('dashboard.recoveryPhraseDisclosure.loadError')}
          </InlineAlert>
        ) : null}

        {showLoading && !loadError ? (
          <p className="mt-6 typo-body-sm text-slate-600 dark:text-slate-300">
            {t('dashboard.recoveryPhraseDisclosure.loading')}
          </p>
        ) : null}

        {!loadError && mnemonic ? (
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
                id="recovery-phrase-disclosure-ack"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                disabled={isWorking}
                className="mt-0.5"
              />
              <label
                htmlFor="recovery-phrase-disclosure-ack"
                className="typo-body-sm cursor-pointer text-ep-body"
              >
                {t('dashboard.recoveryPhraseSetup.checkbox')}
              </label>
            </div>

            <Button
              type="button"
              className="w-full"
              loading={isWorking}
              disabled={!acknowledged}
              onClick={() => void handleContinue()}
            >
              {t('dashboard.recoveryPhraseDisclosure.ctaContinue')}
            </Button>
            <div className="text-center">
              <MutedTextButton type="button" disabled={isWorking} onClick={() => void deferSnooze()}>
                {t('dashboard.recoveryPhraseSetup.remindLater')}
              </MutedTextButton>
            </div>
          </div>
        ) : null}

        {loadError ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" type="button" disabled={isWorking} onClick={() => void deferSnooze()}>
              {t('dashboard.recoveryPhraseSetup.remindLater')}
            </Button>
          </div>
        ) : null}
      </div>
    </ModalOverlay>
  )
}
