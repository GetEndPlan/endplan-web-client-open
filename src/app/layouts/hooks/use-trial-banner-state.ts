import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/constants/routes'
import { usePatchOnboardingState } from '@/features/auth'
import { useAuthUser } from '@/features/auth/session'
import { useSubscription } from '@/features/billing'

export type TrialPlanBadge = {
  key: string
  label: string
  actionLabel?: string
  actionHref?: string
  tone: 'warning' | 'expired'
  /** When true, show the upgrade action even in trusted-member (shared vault) view */
  showActionInTrustedMemberView?: boolean
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function formatTrialEndLabel(trialEndsAt: string | null, locale: string): string | null {
  if (!trialEndsAt) return null

  const trialEndDate = new Date(trialEndsAt)
  if (Number.isNaN(trialEndDate.getTime())) return null

  return trialEndDate.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })
}

function getTrialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null

  const trialEndDate = new Date(trialEndsAt)
  if (Number.isNaN(trialEndDate.getTime())) return null

  const remainingMs = trialEndDate.getTime() - Date.now()
  if (remainingMs <= 0) return 0

  return Math.max(1, Math.ceil(remainingMs / MS_PER_DAY))
}

function firstNameFromFullName(name: string | undefined): string {
  const trimmed = name?.trim()
  if (!trimmed) return ''
  return trimmed.split(/\s+/)[0] ?? ''
}

function buildKeyPersonWelcomeBadge(args: {
  t: (key: string, options?: Record<string, unknown>) => string
  firstName: string
  ownerName: string
  badgeKey: string
}): TrialPlanBadge {
  const { t, firstName, ownerName, badgeKey } = args
  const label = firstName
    ? t('billing.trialBanner.keyPersonWelcomeWithName', { firstName, ownerName })
    : t('billing.trialBanner.keyPersonWelcomeNoName', { ownerName })

  return {
    key: badgeKey,
    label,
    actionLabel: t('billing.actions.upgrade'),
    actionHref: ROUTES.SETTINGS_BILLING_UPGRADE,
    tone: 'warning',
    showActionInTrustedMemberView: true,
  }
}

export function useTrialBannerState() {
  const { t, i18n } = useTranslation()
  const { user, onboarding } = useAuthUser()
  const patchOnboardingState = usePatchOnboardingState()
  const { data: subscriptionResponse } = useSubscription({ enabled: !!user?.id })

  const planBadge = useMemo<TrialPlanBadge | null>(() => {
    const firstName = firstNameFromFullName(user?.name)
    const ownerNameRaw = subscriptionResponse?.keyPersonBillingOwnerName?.trim()
    const ownerName = ownerNameRaw || t('dashboard.keyPersonPrompt.someone')

    if (subscriptionResponse?.keyPersonBillingPendingAck) {
      return buildKeyPersonWelcomeBadge({
        t,
        firstName,
        ownerName,
        badgeKey: 'key-person-billing-pending',
      })
    }

    const inTrial = subscriptionResponse?.inTrial ?? false
    const hasActiveSubscription = subscriptionResponse?.hasActiveSubscription ?? false
    const canAccess = subscriptionResponse?.canAccess ?? true
    const trialEndsAtRaw = subscriptionResponse?.trialEndsAt ?? null
    const trialEndLabel = formatTrialEndLabel(trialEndsAtRaw, i18n.language)
    const trialDaysLeft = getTrialDaysLeft(trialEndsAtRaw)

    // Post-paid access: entitlement blocks access for users with subscription history and no active
    // sub/trial; API omits trialEndsAt. Trial expiry still sends trialEndsAt, so this branch is
    // subscription-ended only (not key-person ack, handled above).
    const noTrialEndInPayload = trialEndsAtRaw == null || trialEndsAtRaw === ''
    const isSubscriptionAccessEnded =
      !canAccess &&
      !hasActiveSubscription &&
      !inTrial &&
      !subscriptionResponse?.keyPersonBillingPendingAck &&
      noTrialEndInPayload

    if (isSubscriptionAccessEnded) {
      return {
        key: 'subscription-access-ended',
        label: t('billing.trialBanner.subscriptionEnded'),
        actionLabel: t('billing.actions.upgrade'),
        actionHref: ROUTES.SETTINGS_BILLING_UPGRADE,
        tone: 'expired',
        showActionInTrustedMemberView: true,
      }
    }

    if (hasActiveSubscription || !trialEndLabel) return null

    if (inTrial && trialDaysLeft != null) {
      return {
        key: `trial:${subscriptionResponse?.trialEndsAt ?? trialEndLabel}`,
        label: t('billing.trialBanner.endsOn', {
          count: trialDaysLeft,
          date: trialEndLabel,
        }),
        actionLabel: t('billing.actions.upgrade'),
        actionHref: ROUTES.SETTINGS_BILLING_UPGRADE,
        tone: 'warning',
      }
    }

    if (!canAccess) {
      return {
        key: `expired:${subscriptionResponse?.trialEndsAt ?? trialEndLabel}`,
        label: t('billing.trialBanner.endedOn', {
          date: trialEndLabel,
        }),
        actionLabel: t('billing.actions.upgrade'),
        actionHref: ROUTES.SETTINGS_BILLING_UPGRADE,
        tone: 'expired',
        showActionInTrustedMemberView: true,
      }
    }

    return null
  }, [i18n.language, subscriptionResponse, t, user?.name])

  const isPlanBadgeDismissed = !!planBadge && onboarding.trialPlanBadgeDismissedKey === planBadge.key

  const dismissPlanBadge = useCallback(() => {
    const key = planBadge?.key
    if (!key) return
    patchOnboardingState.mutate({ trialPlanBadgeDismissedKey: key })
  }, [patchOnboardingState, planBadge])

  return {
    planBadge: isPlanBadgeDismissed ? null : planBadge,
    dismissPlanBadge,
  }
}
