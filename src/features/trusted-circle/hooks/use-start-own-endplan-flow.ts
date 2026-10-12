import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/constants/routes'
import { createBillingUpgradeModalState } from '@/features/billing'

export function useStartOwnEndplanFlow() {
  const location = useLocation()
  const navigate = useNavigate()

  const startOwnEndplan = () => {
    navigate(ROUTES.SETTINGS_BILLING_UPGRADE, {
      state: createBillingUpgradeModalState(location, { source: 'key_person_dashboard' }),
    })
  }

  return {
    startOwnEndplan,
    isStarting: false,
  }
}
