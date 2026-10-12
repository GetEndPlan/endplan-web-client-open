import type { SharedVault } from '../../api/clients/vault-api'
import { SharedVaultsList } from '../shared-vault/shared-vaults-list'

type DashboardTrustedMemberStateProps = {
  sharedVaults: SharedVault[]
  isLoadingShared: boolean
}

export function DashboardTrustedMemberState({
  sharedVaults,
  isLoadingShared,
}: DashboardTrustedMemberStateProps) {

  return (
    <>

      <SharedVaultsList
        sharedVaults={sharedVaults}
        isLoading={isLoadingShared}
        isTrustedMemberView={true}
      />
    </>
  )
}
