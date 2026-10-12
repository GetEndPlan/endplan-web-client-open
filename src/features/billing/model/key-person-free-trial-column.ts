/**
 * Whether the upgrade modal should include the key-person free tier column.
 *
 * Server `keyPersonBillingPendingAck` is required once subscription is loaded.
 * While loading from the start-own EndPlan entry path, keep the third column visible.
 */
export function shouldShowKeyPersonFreeTrialColumn(input: {
  keyPersonBillingPendingAck: boolean
  hasActiveSubscription: boolean
  isLoadingSubscription: boolean
  isFetchingSubscription: boolean
  fromKeyPersonStartOwnFlow: boolean
}): boolean {
  if (input.hasActiveSubscription) {
    return false
  }
  if (input.keyPersonBillingPendingAck) {
    return true
  }
  if (!input.fromKeyPersonStartOwnFlow) {
    return false
  }
  return input.isLoadingSubscription || input.isFetchingSubscription
}
