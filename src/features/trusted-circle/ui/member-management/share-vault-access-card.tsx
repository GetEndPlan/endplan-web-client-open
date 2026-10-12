import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast, Card, ActionDialogFrame, Button } from '@/shared/ui'
import type { TrustedCircleMember } from '@/features/trusted-circle'
import type { VaultResponse } from '@/features/endplan'

type ShareVaultAccessCardProps = {
    vault: VaultResponse
    activeRecipients: TrustedCircleMember[]
    sharedRecipientIds: Set<string>
    onShareAccess: (recipientId: string, recipientName: string) => Promise<void>
    isReleasing: boolean
    setSharedRecipientIds: React.Dispatch<React.SetStateAction<Set<string>>>
}

export function ShareVaultAccessCard({
    vault,
    activeRecipients,
    sharedRecipientIds,
    onShareAccess,
    isReleasing,
    setSharedRecipientIds
}: ShareVaultAccessCardProps) {
    const [pendingShare, setPendingShare] = useState<{ id: string; name: string } | null>(null)

    const requestShare = (recipientId: string, recipientName: string) => {
        setPendingShare({ id: recipientId, name: recipientName })
    }

    const confirmShare = async () => {
        if (!pendingShare) return
        const { id, name } = pendingShare
        setPendingShare(null)

        try {
            await onShareAccess(id, name)
            setSharedRecipientIds(prev => new Set([...prev, id]))
            toast.success(`Vault access shared with ${name}`)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to share vault access')
        }
    }

    return (
        <Card className="mt-6 ring-2 ring-emerald-300 dark:ring-emerald-600 bg-emerald-50 dark:bg-emerald-900/20">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <h2 className="typo-heading-card text-gray-900 dark:text-gray-100">Share Vault Access</h2>
                </div>

                {/* Check if vault is configured for release */}
                {!vault?.wrappedDekReleaseB64 ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                        <p className="typo-body-sm text-amber-800 dark:text-amber-200">
                            <strong>Setup Required:</strong> Your vault was created before the release feature was enabled.
                            Please save your EndPlan again to enable sharing with recipients.
                        </p>
                    </div>
                ) : (
                    <>
                        <p className="typo-body-sm text-gray-600 dark:text-gray-400 mb-4">
                            These recipients have accepted their invitations and are ready to receive vault access.
                            Click "Share" to release the encrypted key that allows them to decrypt your EndPlan.
                        </p>

                        <div className="space-y-3">
                            {activeRecipients.map((recipient) => {
                                const isShared = sharedRecipientIds.has(recipient.memberId)
                                const displayName = recipient.member?.name || recipient.member?.email || 'Unknown'

                                return (
                                    <div
                                        key={recipient.id}
                                        className="flex items-center justify-between py-3 px-4 bg-white dark:bg-ep-primary-dark/50 rounded-lg border border-emerald-200 dark:border-emerald-700/50"
                                    >
                                        <div>
                                            <p className="typo-body-sm-strong text-gray-900 dark:text-gray-100">{displayName}</p>
                                            {recipient.member?.name && recipient.member?.email && (
                                                <p className="typo-caption text-gray-500 dark:text-gray-400">{recipient.member.email}</p>
                                            )}
                                            <p className="typo-caption text-gray-400 dark:text-gray-500 mt-0.5">
                                                Accepted {recipient.acceptedAt ? new Date(recipient.acceptedAt).toLocaleDateString() : 'recently'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isShared ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg typo-body-sm-strong bg-emerald-100 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-300">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Shared
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => requestShare(recipient.memberId, displayName)}
                                                    disabled={isReleasing}
                                                    className={`
                            inline-flex items-center gap-2 px-4 py-1.5 rounded-lg typo-body-sm-strong text-white
                            transition-all duration-200
                            bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600
                            ${isReleasing ? 'opacity-75 cursor-wait' : ''}
                          `}
                                                >
                                                    {isReleasing ? (
                                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                                        </svg>
                                                    )}
                                                    Share Access
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <p className="typo-caption text-gray-500 dark:text-gray-400 mt-4">
                            Sharing grants the recipient cryptographic access to decrypt your EndPlan. This action uses the Release Service for secure key transfer.
                        </p>
                    </>
                )}
            </div>

            {pendingShare && (
                <ActionDialogFrame
                    title="Share Vault Access"
                    description={`This will share your vault access with ${pendingShare.name}. They will be able to decrypt and read your EndPlan.`}
                    icon={<AlertTriangle className="h-5 w-5" />}
                    onClose={() => setPendingShare(null)}
                >
                    <div className="flex gap-3 justify-end">
                        <Button variant="secondary" onClick={() => setPendingShare(null)}>Cancel</Button>
                        <Button onClick={() => void confirmShare()} loading={isReleasing}>Share Access</Button>
                    </div>
                </ActionDialogFrame>
            )}
        </Card>
    )
}
