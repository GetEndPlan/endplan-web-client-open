import { useTranslation } from 'react-i18next'
import { formatDate } from '@/shared/lib'
import { Card, Button } from '@/shared/ui'
import type { PendingClaim } from '@/features/endplan'

type PendingClaimsCardProps = {
  claims: PendingClaim[]
  isLoading: boolean
  onClaim: (claim: PendingClaim) => void
  claimingId: string | null
}

export function PendingClaimsCard({ claims, isLoading, onClaim, claimingId }: PendingClaimsCardProps) {
  const { t } = useTranslation()

  const roleLabels: Record<string, string> = {
    key_person: t('trustedCircle.roles.key_person'),
    recipient: t('trustedCircle.roles.recipient'),
    advisor: t('trustedCircle.roles.advisor'),
    trustee: 'Trustee',
  }

  if (claims.length === 0 && !isLoading) return null

  return (
    <Card className="ring-2 ring-amber-300 dark:ring-amber-600 bg-amber-50 dark:bg-amber-900/20">
      <Card.Header
        title={t('dashboard.pendingAccess.title')}
        subtitle={t('dashboard.pendingAccess.subtitle')}
      />
      <Card.Body>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 dark:border-amber-400" />
          </div>
        ) : (
          <div className="divide-y divide-amber-200 dark:divide-amber-700/50">
            {claims.map((claim) => (
              <div
                key={claim.membershipId}
                className="py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="typo-body-base-strong text-gray-900 dark:text-gray-100 truncate">
                        {claim.vaultName}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded typo-caption-strong bg-amber-100 dark:bg-amber-800/50 text-amber-800 dark:text-amber-300">
                        {roleLabels[claim.role] || claim.role}
                      </span>
                    </div>
                    <p className="mt-1 typo-body-sm text-gray-600 dark:text-gray-300">
                      {t('dashboard.pendingAccess.from')} <strong>{claim.ownerName}</strong>
                    </p>
                    <p className="typo-caption text-gray-500 dark:text-gray-400">
                      {claim.ownerEmail}
                    </p>
                    <p className="mt-1 typo-caption text-gray-400 dark:text-gray-500">
                      {t('dashboard.pendingAccess.invited', { date: formatDate(claim.invitedAt) })}
                      {claim.acceptedAt && (
                        <> · {t('dashboard.pendingAccess.accepted', { date: formatDate(claim.acceptedAt) })}</>
                      )}
                    </p>
                    {claim.claimRequestedAt ? (
                      <p className="mt-1 typo-caption text-amber-700 dark:text-amber-300">
                        {t('dashboard.pendingAccess.claimSubmitted', { defaultValue: 'Claim submitted · waiting for key person login' })}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    onClick={() => onClaim(claim)}
                    loading={claimingId === claim.membershipId}
                    disabled={claimingId !== null || Boolean(claim.claimRequestedAt)}
                    className="flex-shrink-0"
                  >
                    {claim.claimRequestedAt
                      ? t('dashboard.pendingAccess.claimed', { defaultValue: 'Claimed' })
                      : claimingId === claim.membershipId
                        ? t('dashboard.pendingAccess.claiming', { defaultValue: 'Claiming...' })
                        : t('dashboard.pendingAccess.claimAccess', { defaultValue: 'Claim Access' })}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  )
}
