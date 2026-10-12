import { useTranslation } from 'react-i18next'
import { Card, PageTitle } from '@/shared/ui'
import { formatDate } from '@/shared/lib'
import type { SharedVault } from '../../api/clients/vault-api'

type SharedVaultHeaderProps = {
    vault: SharedVault
    roleLabel: string
    roleDescription: string
}

export function SharedVaultHeader({ vault, roleLabel, roleDescription }: SharedVaultHeaderProps) {
    const { t } = useTranslation()

    return (
        <>
            <Card>
                <div className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded typo-body-sm-strong bg-ep-primary-softer text-ep-primary-dark dark:bg-ep-primary-dark/50 dark:text-ep-primary-muted">
                                    {roleLabel}
                                </span>
                            </div>
                            <PageTitle as="h1" tone="gray">
                                {vault.name}
                            </PageTitle>
                            <p className="mt-1 text-gray-600 dark:text-gray-400">
                                {t('dashboard.sharedWithMe.from', { name: vault.ownerName })}
                            </p>
                            {vault.description && (
                                <p className="mt-2 typo-body-sm text-gray-500 dark:text-gray-400">
                                    {vault.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4 typo-body-sm text-gray-500 dark:text-gray-400">
                        <span>{t('dashboard.sharedWithMe.shared', { date: formatDate(vault.grantedAt) })}</span>
                        {vault.expiresAt && (
                            <span className="text-amber-600 dark:text-amber-400">
                                {t('dashboard.sharedWithMe.expires', { date: formatDate(vault.expiresAt) })}
                            </span>
                        )}
                    </div>
                </div>
            </Card>

            {/* Role Info */}
            <div className="mt-4 p-4 bg-ep-primary-softer dark:bg-ep-primary-dark/30 rounded-lg border border-ep-primary-soft dark:border-ep-primary-dark">
                <div className="flex gap-3">
                    <svg className="w-5 h-5 text-ep-primary dark:text-ep-primary-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="typo-body-sm text-ep-primary-dark dark:text-ep-primary-soft">
                        <p>{roleDescription}</p>
                    </div>
                </div>
            </div>
        </>
    )
}
