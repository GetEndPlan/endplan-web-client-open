import type { Location } from 'react-router-dom'

export type BillingUpgradeModalSource = 'key_person_dashboard'

export type BillingUpgradeModalLocationState = {
  backgroundLocation?: Location
  returnTo?: string
  source?: BillingUpgradeModalSource
}

export function createBillingUpgradeModalState(
  location: Location,
  options?: Pick<BillingUpgradeModalLocationState, 'source'>,
): BillingUpgradeModalLocationState {
  return {
    backgroundLocation: location,
    returnTo: `${location.pathname}${location.search}${location.hash}`,
    ...options,
  }
}
