import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { ROUTES } from '@/app/constants/routes'
import { Button, toast } from '@/shared/ui'
import { AuthLayout, InviteLanding } from '@/features/auth'
import { useAuthUser } from '@/features/auth/session'
import {
  InviteAccept,
  useInvitationByToken,
  useAcceptInvitation
} from '@/features/trusted-circle'

export function InvitePage() {
  const { t } = useTranslation()
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const { user, isAuthenticated } = useAuthUser()

  const { data: invitation, isLoading, error: queryError } = useInvitationByToken(token)
  const acceptInvitationMutation = useAcceptInvitation()

  // Local state for accepting logic
  const [isAccepting, setIsAccepting] = useState(false)

  const handleAccept = async () => {
    if (!invitation) return
    setIsAccepting(true)
    try {
      await acceptInvitationMutation.mutateAsync(invitation.id)
      toast.success(t('trustedCircle.receivedInvitations.acceptSuccess'))
      navigate(ROUTES.DASHBOARD)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('trustedCircle.receivedInvitations.error'))
      setIsAccepting(false)
    }
  }

  const handleDecline = () => {
    navigate(ROUTES.DASHBOARD)
  }

  // Invalid token check (client side)
  if (!token) {
    return (
      <AuthLayout>
        <ErrorState
          title={t('auth.invite.invalidTitle')}
          message={t('auth.invite.invalidLink')}
          t={t}
        />
      </AuthLayout>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <AuthLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ep-primary dark:border-ep-primary-accent mx-auto" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">{t('auth.invite.loading')}</p>
        </div>
      </AuthLayout>
    )
  }

  // Error state (from API)
  if (queryError || !invitation) {
    const errorMessage = queryError instanceof Error ? queryError.message : t('auth.invite.expiredOrInvalid')
    return (
      <AuthLayout>
        <ErrorState
          title={t('auth.invite.invalidTitle')}
          message={errorMessage}
          t={t}
        />
      </AuthLayout>
    )
  }

  // Not logged in - show landing
  if (!isAuthenticated || !user) {
    return (
      <AuthLayout>
        <InviteLanding invitation={invitation} token={token} t={t} />
      </AuthLayout>
    )
  }

  // Logged in - show accept/decline
  return (
    <AuthLayout>
      <InviteAccept
        invitation={invitation}
        currentUserEmail={user.email}
        isAccepting={isAccepting}
        onAccept={handleAccept}
        onDecline={handleDecline}
        t={t}
      />
    </AuthLayout>
  )
}

function ErrorState({ title, message, t }: { title: string; message: string; t: TFunction }) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>
      <h2 className="typo-heading-section text-slate-900 dark:text-slate-100">{title}</h2>
      <p className="typo-body-sm text-slate-600 dark:text-slate-400">
        {message}
      </p>
      <Link to={ROUTES.ROOT}>
        <Button variant="danger">{t('auth.invite.goHome')}</Button>
      </Link>
    </div>
  )
}
