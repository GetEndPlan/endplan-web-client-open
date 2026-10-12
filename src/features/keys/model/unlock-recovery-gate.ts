/** Consecutive failed password unlocks before auto-opening restore / start-fresh. */
export const FAILED_UNLOCKS_BEFORE_RECOVERY_MODAL = 3

export function shouldAutoOpenUnlockRecoveryModal(
  hasRecoveryWrap: boolean,
  consecutiveFailedUnlocks: number,
): boolean {
  return hasRecoveryWrap && consecutiveFailedUnlocks >= FAILED_UNLOCKS_BEFORE_RECOVERY_MODAL
}

export function shouldShowUnlockRecoveryHelp(
  hasRecoveryWrap: boolean,
  consecutiveFailedUnlocks: number,
): boolean {
  return hasRecoveryWrap && consecutiveFailedUnlocks >= 1
}
