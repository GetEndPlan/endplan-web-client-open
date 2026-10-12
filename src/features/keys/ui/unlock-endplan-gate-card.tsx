import { useTranslation } from 'react-i18next'
import { Card } from '@/shared/ui'
import { useKeys } from '../api/hooks/keys-hooks'
import { useKeyMaterial } from '../hooks/use-key-material'
import { SetupEncryptionKeysCard } from './setup-encryption-keys-card'
import { UnlockKeysCard } from './unlock-keys-card'

/**
 * After login: loading state, then unlock or key setup.
 * - No server keys → {@link SetupEncryptionKeysCard} (e.g. after Start fresh)
 * - Has keys, locked → {@link UnlockKeysCard} (unlock; recovery / start-fresh after three failed passwords)
 */
export function UnlockEndplanGateCard() {
  const { t } = useTranslation()
  const { isLoading: isKeysQueryLoading } = useKeys()
  const { hasServerKeys, isServerKeysLoading } = useKeyMaterial({ enabled: true })

  if (isKeysQueryLoading || isServerKeysLoading) {
    return (
      <Card>
        <div className="mx-auto max-w-sm p-8 text-center">
          <p className="typo-body-sm text-slate-500 dark:text-slate-400">{t('dashboard.unlock.gateLoading')}</p>
        </div>
      </Card>
    )
  }

  if (!hasServerKeys) {
    return <SetupEncryptionKeysCard />
  }

  return <UnlockKeysCard />
}
