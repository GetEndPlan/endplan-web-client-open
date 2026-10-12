/** @deprecated One global id — migrated on read/write; do not write here anymore. */
const LEGACY_LOCAL_KEY = 'endplan:dashboard-nav-tour-settled-user-id'

const SETTLED_VALUE = '1'

function perUserSettledKey(userId: string): string {
  return `endplan:dashboard-nav-tour-settled:${userId}`
}

export function readDashboardNavTourSettled(userId: string | null): boolean {
  if (!userId || typeof window === 'undefined') {
    return false
  }
  try {
    if (window.localStorage.getItem(perUserSettledKey(userId)) === SETTLED_VALUE) {
      return true
    }
    const legacy = window.localStorage.getItem(LEGACY_LOCAL_KEY)
    if (legacy === userId) {
      window.localStorage.setItem(perUserSettledKey(userId), SETTLED_VALUE)
      window.localStorage.removeItem(LEGACY_LOCAL_KEY)
      return true
    }
    return false
  } catch {
    return false
  }
}

export function writeDashboardNavTourSettled(userId: string): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(perUserSettledKey(userId), SETTLED_VALUE)
    if (window.localStorage.getItem(LEGACY_LOCAL_KEY) === userId) {
      window.localStorage.removeItem(LEGACY_LOCAL_KEY)
    }
  } catch {
    // Quota or private mode — tour may repeat; non-fatal.
  }
}
