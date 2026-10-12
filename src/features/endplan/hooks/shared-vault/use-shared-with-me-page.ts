import { useVaultsShared } from '../../api/hooks/queries/use-vault-queries'
import type { SharedVault } from '../../api/clients/vault-api'
import { useKeyMaterial } from '@/features/keys'
import { useAuthUser } from '@/features/auth/session'
import { useSentInvitations, useTrustedCircle } from '@/features/trusted-circle'
import { countActiveKeyPersons } from '../../model/plan-quota-guards'

type UseSharedWithMePageResult = {
  sharedVaults: SharedVault[]
  isLoadingShared: boolean
  keysAvailable: boolean
  hasOwnKeyPerson: boolean
}

export function useSharedWithMePage(): UseSharedWithMePageResult {
  const { user } = useAuthUser()
  const queryEnabled = !!user
  const { data: sharedVaults = [], isLoading: isLoadingShared } = useVaultsShared({ enabled: queryEnabled })
  const { hasRequiredKeys } = useKeyMaterial({ enabled: queryEnabled })
  const { data: members = [] } = useTrustedCircle({ enabled: queryEnabled })
  const { data: sentInvitations = [] } = useSentInvitations({ enabled: queryEnabled })
  const hasOwnKeyPerson = countActiveKeyPersons({ members, sentInvitations }) > 0

  return {
    sharedVaults,
    isLoadingShared,
    keysAvailable: hasRequiredKeys,
    hasOwnKeyPerson,
  }
}
