import { type ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthUser } from '@/features/auth/session'
import { useSubscription } from '@/features/billing'
import { ROUTES } from '../constants/routes'
import { FullPageSpinner } from '@/shared/ui'
import { setApiRequestsBlocked } from '@/shared/api/client'

type ProtectedRouteProps = {
  children: ReactNode
  requireVerified?: boolean
}

export function ProtectedRoute({ children, requireVerified = false }: ProtectedRouteProps) {
  const { isAuthenticated, user, isInitialized } = useAuthUser()
  const location = useLocation()

  const subscriptionQueryEnabled = isInitialized && isAuthenticated
  const {
    data: subscriptionResponse,
    isPending: isSubscriptionQueryPending,
    isError: isSubscriptionError,
  } = useSubscription({
    enabled: subscriptionQueryEnabled,
  })

  // Only treat as "pending" when the query is actually running; disabled query stays idle.
  const isSubscriptionPending = subscriptionQueryEnabled && isSubscriptionQueryPending

  // While subscription is loading, do not assume access (prevents vault/dashboard API spam).
  // After load: use API value; on fetch error, block like no access so user can recover on /billing.
  const canAccess = isSubscriptionError ? false : (subscriptionResponse?.canAccess ?? true)

  useEffect(() => {
    if (!isAuthenticated) {
      setApiRequestsBlocked(false)
      return
    }
    if (isSubscriptionPending) {
      setApiRequestsBlocked(true)
      return
    }
    setApiRequestsBlocked(!canAccess)
  }, [isAuthenticated, isSubscriptionPending, canAccess])

  if (!isInitialized) {
    return <FullPageSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (requireVerified && !user?.emailVerified) {
    return <Navigate to={ROUTES.VERIFY_EMAIL} state={{ from: location }} replace />
  }

  return <>{children}</>
}
