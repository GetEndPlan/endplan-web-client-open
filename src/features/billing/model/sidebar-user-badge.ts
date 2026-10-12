const MS_PER_DAY = 24 * 60 * 60 * 1000

export function getTrialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null

  const trialEndDate = new Date(trialEndsAt)
  if (Number.isNaN(trialEndDate.getTime())) return null

  const remainingMs = trialEndDate.getTime() - Date.now()
  if (remainingMs <= 0) return 0

  return Math.max(1, Math.ceil(remainingMs / MS_PER_DAY))
}

export function getUserInitials(name: string | undefined, email: string | undefined): string {
  const trimmed = name?.trim()
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      const first = parts[0]?.[0] ?? ''
      const last = parts[parts.length - 1]?.[0] ?? ''
      return `${first}${last}`.toUpperCase()
    }
    return trimmed.slice(0, 2).toUpperCase()
  }

  const emailChar = email?.trim().charAt(0)
  return emailChar ? emailChar.toUpperCase() : '?'
}
