import { useNavigate } from 'react-router-dom'
import { ROUTES, sharedEndplanPath } from '@/app/constants/routes'
import { ChevronRight } from 'lucide-react'
import { formatDate } from '@/shared/lib'
import { Card, EssentialIcon } from '@/shared/ui'
import { useTranslation } from 'react-i18next'
import type { SharedVault } from '../../api/clients/vault-api'

type SharedVaultsListProps = {
  sharedVaults: SharedVault[]
  isLoading?: boolean
  isTrustedMemberView?: boolean
  variant?: 'default' | 'featured'
}

export function SharedVaultsList({
  sharedVaults,
  isLoading = false,
  isTrustedMemberView = false,
  variant = 'default',
}: SharedVaultsListProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const roleLabels: Record<string, string> = {
    key_person: t('trustedCircle.roles.key_person'),
    recipient: t('trustedCircle.roles.recipient'),
    advisor: t('trustedCircle.roles.advisor'),
    trustee: 'Trustee',
  }

  if (sharedVaults.length === 0 && !isLoading && variant !== 'featured') {
    if (isTrustedMemberView) {
      return (
        <Card className="rounded-ep-card border-ep-border bg-ep-surface shadow-none">
          <Card.Header
            title={t('dashboard.sharedWithMe.title')}
            subtitle={t('dashboard.sharedWithMe.pageSubtitle')}
          />
          <Card.Body>
            <p className="py-4 text-center font-ep text-ep-body-02 text-ep-body/60 dark:text-white/50">
              {t('dashboard.sharedWithMe.emptyDescription')}
            </p>
          </Card.Body>
        </Card>
      )
    }
    return null
  }

  const listContent = isLoading ? (
    <div className="flex justify-center py-8">
      <div className="size-8 animate-spin rounded-full border-b-2 border-white/60" />
    </div>
  ) : sharedVaults.length === 0 && variant === 'featured' ? (
    <p className="font-ep text-ep-body-02 text-white/70">{t('dashboard.sharedWithMe.emptyDescription')}</p>
  ) : (
    <>
      <div className={variant === 'featured' ? 'flex flex-col gap-3 sm:flex-row sm:overflow-x-auto' : 'divide-y divide-ep-border dark:divide-ep-border'}>
        {sharedVaults.slice(0, 5).map((sharedVault) => {
          const roleLabel = roleLabels[sharedVault.role] || sharedVault.role

          if (variant === 'featured') {
            return (
              <button
                key={sharedVault.id}
                type="button"
                onClick={() => navigate(sharedEndplanPath(sharedVault.id))}
                className="flex h-[60px] w-full min-w-0 items-center rounded-ep-card border border-white/10 bg-white/10 p-3 text-left backdrop-blur-[50px] transition hover:bg-white/20 sm:min-w-[280px] sm:flex-1"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <EssentialIcon name="share-with-you" size={24} tone="white" className="size-8 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-ep text-ep-body-03 text-white">
                      {t('dashboard.sharedWithMe.featuredCardTitle')}
                    </p>
                    <p className="mt-1 font-ep text-ep-body-04 text-white/70">
                      {t('dashboard.sharedWithMe.from', { name: sharedVault.ownerName })} ·{' '}
                      {t('dashboard.sharedWithMe.shared', { date: formatDate(sharedVault.grantedAt) })}
                    </p>
                  </div>
                </div>
              </button>
            )
          }

          return (
            <button
              key={sharedVault.id}
              type="button"
              onClick={() => navigate(sharedEndplanPath(sharedVault.id))}
              className="-mx-4 flex w-[calc(100%+2rem)] items-center justify-between px-4 py-4 text-left transition first:pt-0 last:pb-0 hover:bg-ep-surface-subtle"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="typo-emphasis truncate font-ep text-ep-body-01 text-ep-body dark:text-white">
                    {sharedVault.name}
                  </h3>
                  <span className="inline-flex items-center rounded-ep-button bg-ep-primary-softer px-2 py-0.5 font-ep text-ep-caption text-ep-primary dark:bg-ep-primary/20">
                    {roleLabel}
                  </span>
                </div>
                <p className="mt-1 font-ep text-ep-body-02 text-ep-body/60 dark:text-white/50">
                  {t('dashboard.sharedWithMe.from', { name: sharedVault.ownerName })}
                </p>
                {sharedVault.description ? (
                  <p className="mt-1 truncate font-ep text-ep-body-02 text-ep-body/40 dark:text-white/40">
                    {sharedVault.description}
                  </p>
                ) : null}
                <p className="mt-1 font-ep text-ep-body-04 text-ep-body/40 dark:text-white/40">
                  {t('dashboard.sharedWithMe.shared', { date: formatDate(sharedVault.grantedAt) })}
                  {sharedVault.expiresAt
                    ? ` · ${t('dashboard.sharedWithMe.expires', { date: formatDate(sharedVault.expiresAt) })}`
                    : null}
                </p>
              </div>
              <ChevronRight className="ml-4 size-5 shrink-0 text-ep-body/30 dark:text-white/30" />
            </button>
          )
        })}
      </div>
      {variant !== 'featured' && sharedVaults.length > 0 ? (
        <div className="mt-4 border-t border-ep-border pt-4 dark:border-ep-border">
          <button
            type="button"
            onClick={() => navigate(ROUTES.SHARED_WITH_ME)}
            className="font-ep text-ep-body-03 text-ep-primary hover:underline"
          >
            {sharedVaults.length > 5
              ? `${t('nav.sharedWithMe')} (${sharedVaults.length})`
              : t('nav.sharedWithMe')}
          </button>
        </div>
      ) : null}
    </>
  )

  if (variant === 'featured') {
    return (
      <section className="shrink-0 rounded-ep-card bg-gradient-to-br from-ep-gradient-end/60 via-ep-gradient-mid/60 to-ep-gradient-start/60 p-4 backdrop-blur-[50px]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="typo-heading-section text-white">{t('dashboard.sharedWithMe.title')}</h2>
            <p className="mt-0.5 typo-caption text-white/70">
              {t('dashboard.sharedWithMe.pageSubtitle')}
            </p>
          </div>
          {sharedVaults[0] ? (
            <span className="rounded-ep-button border border-white px-2.5 py-1 typo-caption-strong text-white">
              {roleLabels[sharedVaults[0].role] || sharedVaults[0].role}
            </span>
          ) : (
            <span className="rounded-ep-button border border-white px-2.5 py-1 typo-caption-strong text-white">
              {t('trustedCircle.roles.key_person')}
            </span>
          )}
        </div>
        <div className="mt-3">{listContent}</div>
      </section>
    )
  }

  return (
    <Card className="rounded-ep-card border-ep-border bg-ep-surface shadow-none">
      <Card.Header title={t('dashboard.sharedWithMe.title')} subtitle={t('dashboard.sharedWithMe.pageSubtitle')} />
      <Card.Body>{listContent}</Card.Body>
    </Card>
  )
}
