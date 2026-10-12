import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES, invitePath } from '@/app/constants/routes'
import { LoginForm, AuthLayout } from '@/features/auth'
import { billingApi } from '@/features/billing'
import type { User } from '@/entities/user'
import { setApiRequestsBlocked } from '@/shared/api/client'

async function shouldRedirectToBilling(): Promise<boolean> {
  try {
    const subscription = await billingApi.getSubscription()
    return !subscription.canAccess && !subscription.hasActiveSubscription && !subscription.inTrial
  } catch {
    return false
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    setApiRequestsBlocked(false)
  }, [])

  const inviteEmail = searchParams.get('email') || ''
  const inviteToken = searchParams.get('invite') || ''

  const handleSuccess = async (user: User) => {
    if (user && !user.emailVerified) {
      navigate(ROUTES.VERIFY_EMAIL, { replace: true })
      return
    }

    if (inviteToken) {
      navigate(invitePath(inviteToken), { replace: true })
      return
    }

    if (await shouldRedirectToBilling()) {
      navigate(ROUTES.SETTINGS_BILLING_UPGRADE, {
        replace: true,
        state: { returnTo: ROUTES.DASHBOARD },
      })
      return
    }

    navigate(ROUTES.DASHBOARD, { replace: true })
  }

  return (
    <AuthLayout>
      <LoginForm
        onSuccess={handleSuccess}
        defaultEmail={inviteEmail}
        inviteToken={inviteToken}
      />
    </AuthLayout>
  )
}
