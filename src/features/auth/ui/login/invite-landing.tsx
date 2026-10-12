import type { TFunction } from 'i18next'
import { Link } from 'react-router-dom'
import { Button, PageTitle } from '@/shared/ui'
import type { Invitation, UserRole } from '@/features/trusted-circle'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/features/trusted-circle'

type InviteLandingProps = {
    invitation: Invitation
    token: string
    t: TFunction
}

export function InviteLanding({ invitation, token, t }: InviteLandingProps) {
    return (
        <div className="space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-ep-primary-softer dark:bg-ep-primary-dark/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-ep-primary dark:text-ep-primary-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
            </div>

            {/* Header */}
            <div className="text-center">
                <PageTitle align="center">{t('auth.invite.youveBeenInvited')}</PageTitle>
            </div>

            {/* Invitation Details */}
            <div className="bg-slate-50 dark:bg-ep-primary-dark/50 rounded-lg p-4 space-y-3">
                <p className="typo-body-sm text-slate-600 dark:text-slate-400">
                    <span className="typo-emphasis text-slate-900 dark:text-slate-100">{invitation.inviter?.name || 'Someone'}</span>{' '}
                    {t('auth.invite.hasInvitedYou')}{' '}
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

            <p className="typo-body-sm text-slate-600 dark:text-slate-400 text-center">
                {t('auth.invite.signUpToAccept')}
            </p>

            <div className="space-y-3">
                <Link
                    to={`/signup?invite=${token}&email=${encodeURIComponent(invitation.inviteeEmail)}${invitation.inviteeName ? `&name=${encodeURIComponent(invitation.inviteeName)}` : ''}`}
                    className="block"
                >
                    <Button fullWidth variant="primary">
                        {t('nav.signup')}
                    </Button>
                </Link>
                <Link to={`/login?invite=${token}&email=${encodeURIComponent(invitation.inviteeEmail)}`} className="block">
                    <Button variant="primary" fullWidth>
                        {t('auth.invite.alreadyHaveAccount')}
                    </Button>
                </Link>
            </div>

            <p className="typo-caption text-slate-400 dark:text-slate-500 text-center">
                {t('auth.invite.expiresOn', { date: new Date(invitation.expiresAt).toLocaleDateString() })}
            </p>
        </div>
    )
}
