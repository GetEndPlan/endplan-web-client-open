/**
 * Invite-only key person onboarding (free-tier ack, start-own prompts, vault gate).
 * Established accounts are excluded server-side via `keyPersonEstablishedBeforeInvite`.
 */
export function isInviteOnlyKeyPersonOnboarding(input: {
  subscriptionLoaded: boolean
  keyPersonBillingPendingAck?: boolean
  keyPersonEstablishedBeforeInvite?: boolean
}): boolean {
  if (!input.subscriptionLoaded) {
    return false
  }
  if (input.keyPersonEstablishedBeforeInvite === true) {
    return false
  }
  return input.keyPersonBillingPendingAck === true
}
