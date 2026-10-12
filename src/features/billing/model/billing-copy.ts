type BillingSubtitleParams = {
  hasActiveSubscription: boolean
  inTrial: boolean
  trialEndsAt: string | null
  canAccess: boolean
  formatDate: (dateString: string) => string
  t: (key: string, options?: Record<string, unknown>) => string
}

export function getBillingHeaderSubtitle({
  hasActiveSubscription,
  inTrial,
  trialEndsAt,
  canAccess,
  formatDate,
  t,
}: BillingSubtitleParams): string {
  if (hasActiveSubscription) {
    return t('billing.header.activeSubtitle')
  }

  if (inTrial && trialEndsAt) {
    return t('billing.header.trialSubtitle', { date: formatDate(trialEndsAt) })
  }

  if (!canAccess) {
    return t('billing.header.endedSubtitle')
  }

  return t('billing.header.chooserSubtitle')
}
