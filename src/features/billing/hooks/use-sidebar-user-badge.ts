import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthUser } from '@/features/auth/session'
import { getTrialDaysLeft, getUserInitials } from '../model/sidebar-user-badge'
import { useSubscription } from '../api'

type SidebarUserBadgeView = {
  displayName: string
  initials: string
  statusLine: string | null
}

export function useSidebarUserBadge(options?: { enabled?: boolean }): SidebarUserBadgeView | null {
  const { t } = useTranslation()
  const { user } = useAuthUser()
  const enabled = options?.enabled ?? true

  const { data: subscriptionResponse } = useSubscription({
    enabled: enabled && !!user?.id,
  })

  return useMemo(() => {
    if (!user) return null

    const displayName = user.name?.trim() || t('common.user')
    const initials = getUserInitials(user.name, user.email)

    const inTrial = subscriptionResponse?.inTrial ?? false
    const trialEndsAt = subscriptionResponse?.trialEndsAt ?? null
    const trialDaysLeft = getTrialDaysLeft(trialEndsAt)

    let statusLine: string | null = null
    if (inTrial && trialDaysLeft != null) {
      statusLine = t('billing.sidebarUserBadge.freeTrialDaysLeft', { count: trialDaysLeft })
    }

    return { displayName, initials, statusLine }
  }, [subscriptionResponse?.inTrial, subscriptionResponse?.trialEndsAt, t, user])
}
