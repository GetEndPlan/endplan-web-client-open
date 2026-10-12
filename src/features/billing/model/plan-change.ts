import type { BillingTier, Subscription } from '../api/billing-api'

export type BillingInterval = 'monthly' | 'yearly'

export function billingIntervalKey(interval: BillingInterval): 'month' | 'year' {
  return interval === 'monthly' ? 'month' : 'year'
}

export function isSelectedPlanDifferent(
  subscription: Subscription | null | undefined,
  tier: BillingTier,
  interval: BillingInterval,
): boolean {
  if (!subscription) return false
  return subscription.tier !== tier || subscription.billingInterval !== billingIntervalKey(interval)
}

/** Existing Polar subscribers change plans in the customer portal, not via new checkout. */
export function shouldOpenBillingPortalForSubscribe(
  hasActiveSubscription: boolean,
  subscription: Subscription | null | undefined,
  tier: BillingTier,
  interval: BillingInterval,
): boolean {
  return hasActiveSubscription && isSelectedPlanDifferent(subscription, tier, interval)
}
