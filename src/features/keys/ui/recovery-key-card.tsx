import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Eye, KeyRound, RefreshCw } from 'lucide-react'
import {
  ActionDialogFrame,
  Button,
  Card,
  InlineAlert,
  PasswordInput,
  settingsSubCardClassName,
  settingsSubCardPaddingClassName,
  toast,
} from '@/shared/ui'
import { formatDate } from '@/shared/lib'
import { cn } from '@/shared/lib/cn'
import { useAuthUser } from '@/features/auth'
import {
  decryptRecoveryPhraseVaultPayload,
  upsertRecoveryPhraseToVault,
} from '@/features/endplan/api/services/recovery-phrase-vault-service'
import { vaultKeys } from '@/features/endplan/api/keys/vault-query-keys'
import {
  useDecryptedUserVault,
  useVaultSections,
} from '@/features/endplan/api/hooks/queries/use-vault-queries'
import { SECTION_ID } from '@/features/endplan/model/vault-section-types'
import { useKeyMaterial } from '../hooks/use-key-material'
import { useKeys } from '../api/hooks/keys-hooks'
import { setupOrRotateRecoveryKey } from '../api/keys-service'
import { splitRecoveryMnemonicWords } from '../model/recovery-phrase'
import { printRecoveryPhraseSheet } from '../lib/print-recovery-phrase-sheet'
import { RecoveryPhraseCopyActions } from './recovery-phrase-copy-actions'
import { RecoveryPhraseWordGrid } from './recovery-phrase-word-grid'

export function RecoveryKeyCard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { user } = useAuthUser()
  const { data: keys, refetch, isLoading } = useKeys()
  const { vault, isResolved: vaultResolved } = useDecryptedUserVault({
    enabled: !!user,
    ownerUserId: user?.id ?? null,
  })
  const { publicKeyB64, privateKeyB64, pqPublicKeyB64, pqPrivateKeyB64 } = useKeyMaterial({ enabled: !!user })
  const [isOpen, setIsOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedPhrase, setGeneratedPhrase] = useState<string | null>(null)

  const [viewMnemonic, setViewMnemonic] = useState<string | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState<'noVault' | 'noSection' | 'decrypt' | 'noKeys' | null>(null)

  const sectionsQuery = useVaultSections(vault?.id, {
    enabled: Boolean(user && vault?.id && isViewOpen),
  })

  const hasRecoveryWrap = Boolean(keys?.hasRecoveryWrap)
  const recoverySetupDate =
    hasRecoveryWrap && keys
      ? formatDate(keys.rotatedAt ?? keys.createdAt)
      : null

  const closeDialog = () => {
    if (isSubmitting) return
    setIsOpen(false)
    setPassword('')
    setGeneratedPhrase(null)
  }

  const closeViewDialog = () => {
    setIsViewOpen(false)
    setViewMnemonic(null)
    setViewLoading(false)
    setViewError(null)
  }

  useEffect(() => {
    if (!isViewOpen) return

    setViewMnemonic(null)
    setViewError(null)

    if (!vaultResolved) {
      setViewLoading(true)
      return
    }
    if (!vault) {
      setViewLoading(false)
      setViewError('noVault')
      return
    }
    if (!publicKeyB64 || !privateKeyB64) {
      setViewLoading(false)
      setViewError('noKeys')
      return
    }
    if (sectionsQuery.isLoading || !sectionsQuery.isFetched) {
      setViewLoading(true)
      return
    }

    const section = sectionsQuery.data?.find((s) => s.sectionType === SECTION_ID.RECOVERY)
    if (!section) {
      setViewLoading(false)
      setViewError('noSection')
      return
    }

    let cancelled = false
    setViewLoading(true)
    void decryptRecoveryPhraseVaultPayload({
      vault,
      section,
      publicKeyB64,
      privateKeyB64,
      pqPrivateKeyB64,
    })
      .then((payload) => {
        if (!cancelled) {
          setViewMnemonic(payload.mnemonic)
          setViewLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setViewError('decrypt')
          setViewLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    isViewOpen,
    vault,
    vaultResolved,
    sectionsQuery.isLoading,
    sectionsQuery.isFetched,
    sectionsQuery.data,
    publicKeyB64,
    privateKeyB64,
    pqPrivateKeyB64,
  ])

  const handleSubmit = async () => {
    if (!password.trim()) {
      return
    }
    setIsSubmitting(true)
    try {
      const result = await setupOrRotateRecoveryKey(password)
      setGeneratedPhrase(result.recoverySecret)
      await refetch()

      if (user?.id && publicKeyB64 && privateKeyB64) {
        try {
          await upsertRecoveryPhraseToVault({
            ownerId: user.id,
            publicKeyB64,
            privateKeyB64,
            pqPublicKeyB64,
            pqPrivateKeyB64,
            mnemonic: result.recoverySecret,
          })
          await queryClient.invalidateQueries({ queryKey: vaultKeys.all })
        } catch {
          toast.info(t('settings.erasure.recovery.toast.vaultBackupFailed'), { durationMs: 9000 })
        }
      }

      toast.success(t('settings.erasure.recovery.toast.saved'))
    } catch {
      toast.error(t('settings.erasure.recovery.toast.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyPhrase = async (phrase: string) => {
    try {
      await navigator.clipboard.writeText(phrase)
      toast.success(t('settings.erasure.recovery.toast.copied'))
    } catch {
      toast.error(t('settings.erasure.recovery.toast.copyError'))
    }
  }

  const handlePrint = (phrase: string) => {
    const opened = printRecoveryPhraseSheet({
      title: t('dashboard.recoveryPhraseSetup.printTitle'),
      subtitle: t('dashboard.recoveryPhraseSetup.printSubtitle'),
      words: splitRecoveryMnemonicWords(phrase),
      footerNote: t('dashboard.recoveryPhraseSetup.printFooter'),
    })
    if (!opened) {
      toast.error(t('dashboard.recoveryPhraseSetup.toast.printBlocked'))
    }
  }

  return (
    <>
      <Card padding="none" className={cn(settingsSubCardClassName, settingsSubCardPaddingClassName)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1">
            <h3 className="typo-body-md-emphasis text-slate-900 dark:text-slate-100">
              {t('settings.erasure.recovery.title')}
            </h3>
            <p className="mt-2 typo-body-sm text-slate-600 dark:text-slate-300">
              {t('settings.erasure.recovery.body')}
            </p>
            {hasRecoveryWrap && recoverySetupDate ? (
              <p className="mt-2 flex items-center gap-2 typo-body-sm text-slate-600 dark:text-slate-300">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                {t('settings.erasure.recovery.statusConfiguredWithDate', { date: recoverySetupDate })}
              </p>
            ) : (
              <p className="mt-2 typo-body-sm text-slate-600 dark:text-slate-300">
                {t('settings.erasure.recovery.statusMissing')}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            {hasRecoveryWrap ? (
              <>
                <Button
                  variant="secondary"
                  className="w-full gap-2 sm:w-auto"
                  disabled={isLoading}
                  onClick={() => setIsViewOpen(true)}
                >
                  <Eye className="h-4 w-4 shrink-0" aria-hidden />
                  {t('settings.erasure.recovery.actionViewAndSave')}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full gap-2 sm:w-auto"
                  disabled={isLoading}
                  onClick={() => setIsOpen(true)}
                >
                  <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                  {t('settings.erasure.recovery.actionRegenerate')}
                </Button>
              </>
            ) : (
              <Button variant="secondary" className="w-full sm:w-auto" disabled={isLoading} onClick={() => setIsOpen(true)}>
                {t('settings.erasure.recovery.actionGenerate')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {isViewOpen ? (
        <ActionDialogFrame
          title={t('settings.erasure.recovery.viewModal.title')}
          description={<p>{t('settings.erasure.recovery.viewModal.description')}</p>}
          onClose={closeViewDialog}
          icon={<KeyRound className="h-5 w-5" strokeWidth={2.2} />}
          tone="default"
          showCloseButton
          closeButtonLabel={t('common.close')}
          isCloseDisabled={viewLoading}
          maxWidthClassName="max-w-lg"
        >
          <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
            {viewLoading ? (
              <p className="typo-body-sm text-slate-600 dark:text-slate-300">{t('settings.erasure.recovery.viewModal.loading')}</p>
            ) : null}

            {viewError === 'noSection' ? (
              <InlineAlert variant="warning" align="start">
                {t('settings.erasure.recovery.viewModal.loadErrorNoSection')}
              </InlineAlert>
            ) : null}
            {viewError === 'noVault' ? (
              <InlineAlert variant="warning" align="start">
                {t('settings.erasure.recovery.viewModal.loadErrorNoVault')}
              </InlineAlert>
            ) : null}
            {viewError === 'noKeys' ? (
              <InlineAlert variant="warning" align="start">
                {t('settings.erasure.recovery.viewModal.loadErrorNoKeys')}
              </InlineAlert>
            ) : null}
            {viewError === 'decrypt' ? (
              <InlineAlert variant="warning" align="start">
                {t('settings.erasure.recovery.viewModal.loadErrorDecrypt')}
              </InlineAlert>
            ) : null}

            {!viewLoading && viewMnemonic ? (
              <>
                <p className="typo-caption-emphasis uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('dashboard.recoveryPhraseSetup.phraseLabel')}
                </p>
                <div className="rounded-xl bg-slate-900 px-3 py-3 dark:bg-slate-950">
                  <RecoveryPhraseWordGrid words={splitRecoveryMnemonicWords(viewMnemonic)} />
                </div>
                <p className="typo-body-sm text-amber-700 dark:text-amber-300">
                  {t('settings.erasure.recovery.modal.generatedWarning')}
                </p>
                <RecoveryPhraseCopyActions
                  copyLabel={t('settings.erasure.recovery.modal.copy')}
                  downloadLabel={t('dashboard.recoveryPhraseSetup.downloadPdf')}
                  onCopy={() => void copyPhrase(viewMnemonic)}
                  onDownloadPdf={() => handlePrint(viewMnemonic)}
                />
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button variant="secondary" onClick={closeViewDialog}>
                    {t('common.close')}
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </ActionDialogFrame>
      ) : null}

      {isOpen ? (
        <ActionDialogFrame
          title={t('settings.erasure.recovery.modal.title')}
          description={
            generatedPhrase ? (
              <p>{t('settings.erasure.recovery.modal.generatedDescription')}</p>
            ) : (
              <p>{t('settings.erasure.recovery.modal.description')}</p>
            )
          }
          onClose={closeDialog}
          icon={<KeyRound className="h-5 w-5" strokeWidth={2.2} />}
          tone="default"
          showCloseButton
          closeButtonLabel={t('common.close')}
          isCloseDisabled={isSubmitting}
          maxWidthClassName="max-w-lg"
        >
          <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
            {generatedPhrase ? (
              <>
                <p className="typo-caption-emphasis uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('dashboard.recoveryPhraseSetup.phraseLabel')}
                </p>
                <div className="rounded-xl bg-slate-900 px-3 py-3 dark:bg-slate-950">
                  <RecoveryPhraseWordGrid words={splitRecoveryMnemonicWords(generatedPhrase)} />
                </div>
                <p className="typo-body-sm text-amber-700 dark:text-amber-300">
                  {t('settings.erasure.recovery.modal.generatedWarning')}
                </p>
                <RecoveryPhraseCopyActions
                  copyLabel={t('settings.erasure.recovery.modal.copy')}
                  downloadLabel={t('dashboard.recoveryPhraseSetup.downloadPdf')}
                  onCopy={() => void copyPhrase(generatedPhrase)}
                  onDownloadPdf={() => handlePrint(generatedPhrase)}
                />
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button variant="secondary" onClick={closeDialog}>
                    {t('common.close')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <PasswordInput
                  label={t('settings.erasure.recovery.modal.passwordLabel')}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t('settings.erasure.recovery.modal.passwordPlaceholder')}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  required
                />
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button variant="secondary" onClick={closeDialog} disabled={isSubmitting}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={() => void handleSubmit()} disabled={!password.trim()} loading={isSubmitting}>
                    {hasRecoveryWrap
                      ? t('settings.erasure.recovery.modal.regenerate')
                      : t('settings.erasure.recovery.modal.generate')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </ActionDialogFrame>
      ) : null}
    </>
  )
}
