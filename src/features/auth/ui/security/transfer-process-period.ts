const PERIOD_365 = 365

export function periodLabel(
  days: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (days === 1) return t('liveness.oneDay')
  if (days === 2) return t('liveness.twoDays')
  if (days === PERIOD_365) return t('liveness.oneYear')
  return t('liveness.days', { count: days })
}

export function computeSignInByIso(
  lastActiveAt: string | null | undefined,
  inactivityPeriodDays: number | null | undefined,
  releaseTriggerAt?: string | null,
): string | null {
  if (releaseTriggerAt) return releaseTriggerAt
  if (inactivityPeriodDays == null) return null
  const base = lastActiveAt ? new Date(lastActiveAt) : new Date()
  if (Number.isNaN(base.getTime())) return null
  const d = new Date(base)
  d.setDate(d.getDate() + inactivityPeriodDays)
  return d.toISOString()
}
