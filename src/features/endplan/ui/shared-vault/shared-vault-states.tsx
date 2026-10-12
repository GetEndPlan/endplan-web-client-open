import { useTranslation } from 'react-i18next'
import { Card, Button } from '@/shared/ui'
import type { SharedVaultSectionsHiddenReason } from '../../api/clients/vault-api'

type SharedVaultStateCardProps = {
  title: string
  message: string
  iconColorClassName: string
  iconPath: string
  onBack: () => void
}

function SharedVaultStateCard(props: SharedVaultStateCardProps) {
  const { title, message, iconColorClassName, iconPath, onBack } = props
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-ep-surface py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="p-6 text-center">
            <svg className={`mx-auto h-12 w-12 ${iconColorClassName}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
            </svg>
            <h2 className="mt-4 typo-heading-subcard text-gray-900 dark:text-gray-100">{title}</h2>
            <p className="mt-2 typo-body-sm text-gray-500 dark:text-gray-400">{message}</p>
            <Button className="mt-6" onClick={onBack}>
              {t('common.back')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export function SharedVaultLoadingState() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-ep-surface flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ep-primary dark:border-ep-primary-accent mx-auto" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('sharedVault.states.loading')}</p>
      </div>
    </div>
  )
}

type SharedVaultErrorStateProps = {
  message: string
  onBack: () => void
}

export function SharedVaultErrorState({ message, onBack }: SharedVaultErrorStateProps) {
  const { t } = useTranslation()

  return (
    <SharedVaultStateCard
      title={t('sharedVault.states.errorTitle')}
      message={message}
      iconColorClassName="text-red-400"
      iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      onBack={onBack}
    />
  )
}

type SharedVaultNotFoundStateProps = {
  onBack: () => void
}

export function SharedVaultNotFoundState({ onBack }: SharedVaultNotFoundStateProps) {
  const { t } = useTranslation()

  return (
    <SharedVaultStateCard
      title={t('sharedVault.states.notFoundTitle')}
      message={t('sharedVault.states.notFoundMessage')}
      iconColorClassName="text-gray-400"
      iconPath="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      onBack={onBack}
    />
  )
}

type SharedVaultDecryptUnavailableStateProps = {
  onBack: () => void
}

export function SharedVaultDecryptUnavailableState({ onBack }: SharedVaultDecryptUnavailableStateProps) {
  const { t } = useTranslation()

  return (
    <SharedVaultStateCard
      title={t('sharedVault.states.decryptUnavailableTitle')}
      message={t('sharedVault.states.decryptUnavailableMessage')}
      iconColorClassName="text-red-400"
      iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      onBack={onBack}
    />
  )
}

const SECTIONS_HIDDEN_REASONS = new Set<string>([
  'post_release_recovery',
  'awaiting_key_share',
  'deferred_grant',
])

function normalizeSectionsHiddenReason(
  value: string | undefined,
): SharedVaultSectionsHiddenReason {
  if (value && SECTIONS_HIDDEN_REASONS.has(value)) {
    return value as SharedVaultSectionsHiddenReason
  }
  return 'deferred_grant'
}

type SharedVaultKeyPersonSectionsBlockedProps = {
  ownerName: string
  /** From GET /shared-vaults; when missing, treat as deferred (in_end) messaging. */
  sectionsHiddenReason?: string
}

/**
 * When the shared decrypt flow is off for a key person (see sharedVaultDecryptFlowEnabled), the API distinguishes:
 * - deferred_grant: access in the end, not released yet
 * - awaiting_key_share: release recorded but owner has not granted wrapped vault access yet
 * - post_release_recovery: owner must complete recovery before shared content unlocks
 */
export function SharedVaultKeyPersonSectionsBlocked({
  ownerName,
  sectionsHiddenReason,
}: SharedVaultKeyPersonSectionsBlockedProps) {
  const reason = normalizeSectionsHiddenReason(sectionsHiddenReason)
  if (reason === 'awaiting_key_share') {
    return <SharedVaultAwaitingKeyShareState ownerName={ownerName} />
  }
  if (reason === 'post_release_recovery') {
    return <SharedVaultPostReleaseRecoveryBlockedState ownerName={ownerName} />
  }
  return <SharedVaultDeferredAccessState ownerName={ownerName} />
}

type SharedVaultAwaitingKeyShareStateProps = {
  ownerName: string
}

function SharedVaultAwaitingKeyShareState({ ownerName }: SharedVaultAwaitingKeyShareStateProps) {
  const { t } = useTranslation()
  return (
    <Card className="border-slate-200 bg-slate-50 dark:border-ep-border-card dark:bg-ep-surface-panel">
      <div className="px-8 py-10 text-center sm:px-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z"
            />
          </svg>
        </div>
        <h2 className="mt-8 typo-heading-subcard text-slate-900 dark:text-slate-100">
          {t('sharedVault.awaitingKeyShare.title')}
        </h2>
        <p className="mx-auto mt-6 max-w-3xl typo-body-base text-slate-700 dark:text-slate-300">
          {t('sharedVault.awaitingKeyShare.message', { name: ownerName })}
        </p>
      </div>
    </Card>
  )
}

type SharedVaultPostReleaseRecoveryBlockedStateProps = {
  ownerName: string
}

function SharedVaultPostReleaseRecoveryBlockedState({
  ownerName,
}: SharedVaultPostReleaseRecoveryBlockedStateProps) {
  const { t } = useTranslation()
  return (
    <Card className="border-slate-200 bg-slate-50 dark:border-ep-border-card dark:bg-ep-surface-panel">
      <div className="px-8 py-10 text-center sm:px-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-200 text-slate-600 dark:bg-ep-surface-panel dark:text-slate-300">
          <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="mt-8 typo-heading-subcard text-slate-900 dark:text-slate-100">
          {t('sharedVault.postReleaseRecovery.title')}
        </h2>
        <p className="mx-auto mt-6 max-w-3xl typo-body-base text-slate-700 dark:text-slate-300">
          {t('sharedVault.postReleaseRecovery.message', { name: ownerName })}
        </p>
      </div>
    </Card>
  )
}

type SharedVaultDeferredAccessStateProps = {
  ownerName: string
}

export function SharedVaultDeferredAccessState({
  ownerName,
}: SharedVaultDeferredAccessStateProps) {
  const { t } = useTranslation()

  return (
    <Card className="border-slate-200 bg-slate-50 dark:border-ep-border-card dark:bg-ep-surface-panel">
      <div className="px-8 py-10 text-center sm:px-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-200 text-slate-600 dark:bg-ep-surface-panel dark:text-slate-300">
          <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M12 11c0-1.657 1.343-3 3-3h1V6a4 4 0 10-8 0v2h1c1.657 0 3 1.343 3 3zm-6 0h12v7H6v-7z"
            />
          </svg>
        </div>

        <h2 className="mt-8 typo-heading-subcard text-slate-900 dark:text-slate-100">
          {t('sharedVault.deferredAccess.title')}
        </h2>

        <div className="mt-3 inline-flex items-center rounded-md bg-slate-700 px-3 py-1 typo-badge text-white dark:bg-slate-200 dark:text-slate-900">
          {t('sharedVault.deferredAccess.badge')}
        </div>

        <p className="mx-auto mt-8 max-w-3xl typo-body-base text-slate-700 dark:text-slate-300">
          {t('sharedVault.deferredAccess.message', { name: ownerName })}
        </p>
      </div>
    </Card>
  )
}

type SharedVaultPendingTransferStateProps = {
  ownerName: string
}

export function SharedVaultPendingTransferState({
  ownerName,
}: SharedVaultPendingTransferStateProps) {
  const { t } = useTranslation()

  return (
    <Card className="border-slate-200 bg-slate-50 dark:border-ep-border-card dark:bg-ep-surface-panel">
      <div className="px-8 py-10 text-center sm:px-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-200 text-slate-600 dark:bg-ep-surface-panel dark:text-slate-300">
          <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M8 7V4m8 3V4m-9 8h10m2 7H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <h2 className="mt-8 typo-heading-subcard text-slate-900 dark:text-slate-100">
          {t('sharedVault.pendingTransfer.title')}
        </h2>

        <p className="mx-auto mt-6 max-w-3xl typo-body-base text-slate-700 dark:text-slate-300">
          {t('sharedVault.pendingTransfer.message', { name: ownerName })}
        </p>
      </div>
    </Card>
  )
}
