/** One-time migration from localStorage nav-tour settled flags to DB-backed onboarding state. */
const LEGACY_LOCAL_KEY = 'endplan:dashboard-nav-tour-settled-user-id'
const SETTLED_VALUE = '1'

function perUserSettledKey(userId: string): string {
  return `endplan:dashboard-nav-tour-settled:${userId}`
}

export function consumeLegacyDashboardNavTourSettled(userId: string | null): boolean {
  if (!userId || typeof window === 'undefined') {
    return false
  }

  try {
    const perUserKey = perUserSettledKey(userId)
    const perUserSettled = window.localStorage.getItem(perUserKey) === SETTLED_VALUE
    const legacyUserId = window.localStorage.getItem(LEGACY_LOCAL_KEY)
    const legacySettled = legacyUserId === userId
    const settled = perUserSettled || legacySettled

    return settled
  } catch {
    return false
  }
}
