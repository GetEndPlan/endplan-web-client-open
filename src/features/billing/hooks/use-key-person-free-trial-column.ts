import { useEffect } from 'react'
import type { BillingUpgradeModalLocationState } from '../model/upgrade-modal-route'
import { shouldShowKeyPersonFreeTrialColumn } from '../model/key-person-free-trial-column'
import { useBillingPage } from './use-billing-page'
import { useSubscription } from '../api/hooks/billing-hooks'

export function useKeyPersonFreeTrialColumn(
  locationState: BillingUpgradeModalLocationState | null,
) {
  const billing = useBillingPage()
  const fromKeyPersonStartOwnFlow = locationState?.source === 'key_person_dashboard'
  const { refetch, isFetching } = useSubscription({ enabled: !!billing.user })

  useEffect(() => {
    if (!fromKeyPersonStartOwnFlow || !billing.user) {
      return
    }
    void refetch()
  }, [billing.user, fromKeyPersonStartOwnFlow, refetch])

  const showKeyPersonFreeTrial = shouldShowKeyPersonFreeTrialColumn({
    keyPersonBillingPendingAck: billing.keyPersonBillingPendingAck,
    hasActiveSubscription: billing.hasActiveSubscription,
    isLoadingSubscription: billing.isLoadingSubscription,
    isFetchingSubscription: isFetching,
    fromKeyPersonStartOwnFlow,
  })

  return {
    billing,
    showKeyPersonFreeTrial,
  }
}
