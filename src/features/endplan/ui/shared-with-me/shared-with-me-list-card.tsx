import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { Card } from '@/shared/ui'
import type { SharedVault } from '../../api/clients/vault-api'

type SharedWithMeListCardProps = {
  sharedVaults: SharedVault[]
  isLoadingShared: boolean
  onOpenVault: (vaultId: string) => void
}

const roleLabelsByTranslationKey: Record<string, string> = {
  key_person: 'trustedCircle.roles.key_person',
  recipient: 'trustedCircle.roles.recipient',
  advisor: 'trustedCircle.roles.advisor',
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getRoleLabel(role: string, t: (key: string, options?: Record<string, string>) => string) {
  const translationKey = roleLabelsByTranslationKey[role]
  if (!translationKey) {
    return role === 'trustee' ? 'Trustee' : role
  }
  return t(translationKey)
}

export function SharedWithMeListCard({
  sharedVaults,
  isLoadingShared,
  onOpenVault,
}: SharedWithMeListCardProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <Card.Body className="mt-0">
        {isLoadingShared ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ep-primary dark:border-ep-primary-accent" />
          </div>
        ) : sharedVaults.length === 0 ? null : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {sharedVaults.map((sharedVault) => (
              <button
                key={sharedVault.id}
                onClick={() => onOpenVault(sharedVault.id)}
                className="w-full text-left py-4 first:pt-0 last:pb-0 hover:bg-slate-50 dark:hover:bg-ep-primary-dark/50 -mx-4 px-4 rounded-lg transition-colors flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="typo-body-base-strong text-slate-900 dark:text-slate-100 truncate">
                      {sharedVault.name}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded typo-caption-strong bg-ep-primary-softer dark:bg-ep-primary-dark/50 text-ep-primary-dark dark:text-ep-primary-muted">
                      {getRoleLabel(sharedVault.role, t)}
                    </span>
                  </div>
                  <p className="mt-1 typo-body-sm text-slate-500 dark:text-slate-400">
                    {t('dashboard.sharedWithMe.from', { name: sharedVault.ownerName })}
                  </p>
                  {sharedVault.description && (
                    <p className="mt-1 typo-body-sm text-slate-400 dark:text-slate-500 truncate">
                      {sharedVault.description}
                    </p>
                  )}
                  <p className="mt-1 typo-caption text-slate-400 dark:text-slate-500">
                    {t('dashboard.sharedWithMe.shared', { date: formatDate(sharedVault.grantedAt) })}
                    {sharedVault.expiresAt && (
                      <> · {t('dashboard.sharedWithMe.expires', { date: formatDate(sharedVault.expiresAt) })}</>
                    )}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0 ml-4" />
              </button>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  )
}
