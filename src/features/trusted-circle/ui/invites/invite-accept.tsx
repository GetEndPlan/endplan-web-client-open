import type { TFunction } from 'i18next'
import { useLogout } from '@/features/auth/session'
import { Button, PageTitle } from '@/shared/ui'
import type { Invitation, UserRole } from '../../api'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../shared/role-config'

type InviteAcceptProps = {
    invitation: Invitation
    currentUserEmail?: string
    isAccepting: boolean
    onAccept: () => void
    onDecline: () => void
    t: TFunction
}

export function InviteAccept({ invitation, currentUserEmail, isAccepting, onAccept, onDecline, t }: InviteAcceptProps) {
    const logout = useLogout()
    const isForCurrentUser = currentUserEmail === invitation.inviteeEmail

    return (
        <div className="space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-ep-primary-softer dark:bg-ep-primary-dark/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-ep-primary dark:text-ep-primary-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
            </div>

            {/* Header */}
            <div className="text-center">
                <PageTitle align="center">{t('auth.invite.trustedCircleInvitation')}</PageTitle>
            </div>

            {/* Invitation Details */}
            <div className="bg-slate-50 dark:bg-ep-primary-dark/50 rounded-lg p-4 space-y-3">
                <p className="typo-body-sm text-slate-600 dark:text-slate-400">
                    <span className="typo-emphasis text-slate-900 dark:text-slate-100">{invitation.inviter?.name || 'Someone'}</span>{' '}
                    ({invitation.inviter?.email}) {t('auth.invite.hasInvitedYou')}{' '}
                    <span className="typo-emphasis text-ep-primary dark:text-ep-primary-accent">{ROLE_LABELS[invitation.role as UserRole]}</span>.
                </p>
                <p className="typo-body-sm text-slate-500 dark:text-slate-400">
                    {ROLE_DESCRIPTIONS[invitation.role as UserRole]}
                </p>
                {invitation.message && (
                    <p className="typo-body-sm text-slate-600 dark:text-slate-300 italic border-t border-slate-200 dark:border-slate-700 pt-3">
                        "{invitation.message}"
                    </p>
                )}
            </div>

            {!isForCurrentUser ? (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="typo-body-sm text-amber-700 dark:text-amber-300 mt-2">
                        {t('auth.invite.pleaseLoginCorrect')}
                    </p>
                    <Button
                        variant="primary"
                        fullWidth
                        loading={logout.isPending}
                        disabled={logout.isPending}
                        onClick={() => void logout.mutateAsync()}
                    >
                        {logout.isPending ? t('auth.logout.loggingOut') : t('auth.logout.button')}
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <Button
                        fullWidth
                        loading={isAccepting}
                        disabled={isAccepting}
                        onClick={onAccept}
                        variant="primary"
                    >
                        {isAccepting ? t('auth.invite.accepting') : t('trustedCircle.receivedInvitations.acceptButton')}
                    </Button>
                    <Button
                        variant="secondary"
                        fullWidth
                        disabled={isAccepting}
                        onClick={onDecline}
                    >
                        {t('trustedCircle.receivedInvitations.declineButton')}
                    </Button>
                </div>
            )}

            <p className="typo-caption text-slate-400 dark:text-slate-500 text-center">
                {t('auth.invite.expiresOn', { date: new Date(invitation.expiresAt).toLocaleDateString() })}
            </p>
        </div>
    )
}
