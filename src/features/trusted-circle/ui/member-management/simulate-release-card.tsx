import { useState } from 'react'
import { Mail } from 'lucide-react'
import { toast, Card, ActionDialogFrame, Button } from '@/shared/ui'
import type { Invitation } from '@/features/trusted-circle'

type SimulateReleaseCardProps = {
    pendingReleaseInvitations: Invitation[]
    isReleasing: boolean
    onRelease: () => Promise<number>
    onReload: () => void
}

export function SimulateReleaseCard({
    pendingReleaseInvitations,
    isReleasing,
    onRelease,
    onReload
}: SimulateReleaseCardProps) {
    const [showConfirm, setShowConfirm] = useState(false)

    const handleSimulateRelease = () => {
        if (pendingReleaseInvitations.length === 0) {
            toast.info('No recipients to send to')
            return
        }
        setShowConfirm(true)
    }

    const confirmRelease = async () => {
        setShowConfirm(false)
        try {
            const released = await onRelease()
            toast.success(`Sent invitations to ${released} recipient(s)`)
            onReload()
        } catch {
            toast.error('Failed to send invitations')
        }
    }

    return (
        <Card className="mt-6 ring-2 ring-ep-primary-muted dark:ring-ep-primary bg-ep-primary-softer dark:bg-ep-primary-dark/20">
            <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <svg className="w-6 h-6 text-ep-primary dark:text-ep-primary-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <h2 className="typo-heading-card text-gray-900 dark:text-gray-100">Simulate Release</h2>
                        </div>
                        <p className="typo-body-sm text-gray-600 dark:text-gray-400 mt-1">
                            Send or resend invitations to your recipients.
                        </p>
                    </div>
                    <button
                        onClick={handleSimulateRelease}
                        disabled={isReleasing}
                        className={`
              inline-flex items-center gap-2 px-5 py-2.5 rounded-lg typo-emphasis text-white
              transition-all duration-200 shadow-md
              bg-ep-primary hover:bg-ep-primary-accent hover:shadow-lg dark:bg-ep-primary dark:hover:bg-ep-primary
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        )}
                        {pendingReleaseInvitations.length > 0
                            ? `Send to ${pendingReleaseInvitations.length} Recipient${pendingReleaseInvitations.length > 1 ? 's' : ''}`
                            : 'Send to Recipients'
                        }
                    </button>
                </div>

                {pendingReleaseInvitations.length > 0 && (
                    <div className="mt-4 border-t border-ep-primary-soft dark:border-ep-primary-accent/50 pt-4">
                        <p className="typo-body-sm-strong text-gray-700 dark:text-gray-300 mb-2">Recipients:</p>
                        <div className="space-y-2">
                            {pendingReleaseInvitations.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-ep-primary-dark/50 rounded-lg">
                                    <div>
                                        <p className="typo-body-sm-strong text-gray-900 dark:text-gray-100">
                                            {inv.inviteeName || inv.inviteeEmail}
                                        </p>
                                        {inv.inviteeName && (
                                            <p className="typo-caption text-gray-500 dark:text-gray-400">{inv.inviteeEmail}</p>
                                        )}
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded typo-caption-strong ${inv.status === 'pending_release'
                                        ? 'bg-amber-100 dark:bg-amber-800/50 text-amber-800 dark:text-amber-300'
                                        : 'bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-300'
                                        }`}>
                                        {inv.status === 'pending_release' ? 'Not yet sent' : 'Sent - awaiting acceptance'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <p className="typo-caption text-gray-500 dark:text-gray-400 mt-4">
                    Recipients will receive an email invitation. You can resend at any time. They must accept and create an account to access your EndPlan.
                </p>
            </div>

            {showConfirm && (
                <ActionDialogFrame
                    title="Send Invitations"
                    description={`This will send invitation emails to ${pendingReleaseInvitations.length} recipient(s). Continue?`}
                    icon={<Mail className="h-5 w-5" />}
                    onClose={() => setShowConfirm(false)}
                >
                    <div className="flex gap-3 justify-end">
                        <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancel</Button>
                        <Button onClick={() => void confirmRelease()} loading={isReleasing}>Send</Button>
                    </div>
                </ActionDialogFrame>
            )}
        </Card>
    )
}
