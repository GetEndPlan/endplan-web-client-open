import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useKeyMaterial } from '@/features/keys'
import { useAuthUser } from '@/features/auth/session'
import { useMemberships, type TrustedCircleMembership } from '@/features/trusted-circle'
import { useDecryptedSharedSections, type DecryptedSharedSection } from '../../api/hooks/decryption/use-decrypted-shared-sections'
import { useSharedVaultView } from '../../api/hooks/views/use-shared-vault-view'
import { useVaultSections, useVaultsShared } from '../../api/hooks/queries/use-vault-queries'
import {
  sharedVaultDecryptFlowEnabledWithMembership,
  vaultApi,
  type SharedVault,
} from '../../api/clients/vault-api'
import { vaultKeys } from '../../api/keys/vault-query-keys'
import { isVisibleVaultSectionType } from '../../model/vault-section-types'

type UseSharedVaultPageParams = {
  id: string | undefined
}

type UseSharedVaultPageResult = {
  selectedSharedVault: SharedVault | null
  /** Whether to load ciphertext, decrypt, and show section content (list + membership aligned for in-end KPs). */
  decryptFlowEnabled: boolean
  sharedVaultData: ReturnType<typeof useSharedVaultView>['sharedVaultData']
  isLoading: boolean
  error: string | null
  showOwnerInactiveBanner: boolean
  sharedSections: DecryptedSharedSection[]
  sectionsLoadingOrDecrypting: boolean
  sectionsError: string | null
}

function normalizeEmail(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

function hasInEndAccessReleased(
  memberships: TrustedCircleMembership[],
  ownerEmail: string | undefined,
): boolean {
  const normalizedOwnerEmail = normalizeEmail(ownerEmail)
  if (!normalizedOwnerEmail) {
    return false
  }

  return memberships.some((membership) =>
    membership.role === 'key_person' &&
    membership.status === 'active' &&
    membership.accessTiming === 'in_end' &&
    membership.accessGrantStatus === 'available' &&
    normalizeEmail(membership.member?.email) === normalizedOwnerEmail,
  )
}

export function useSharedVaultPage(params: UseSharedVaultPageParams): UseSharedVaultPageResult {
  const { id } = params
  const { user } = useAuthUser()
  const queryEnabled = !!user

  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial({ enabled: queryEnabled })

  const {
    data: sharedVaults = [],
    isLoading: isLoadingSharedList,
    refetch: refetchSharedVaults,
  } = useVaultsShared({ enabled: queryEnabled })

  useEffect(() => {
    if (!queryEnabled || !id) {
      return
    }
    void refetchSharedVaults()
  }, [queryEnabled, id, refetchSharedVaults])
  const { data: memberships = [] } = useMemberships({ enabled: queryEnabled && !!id })
  const selectedSharedVault = (id ? sharedVaults.find((vault) => vault.id === id) : null) ?? null
  const decryptFlowEnabled = sharedVaultDecryptFlowEnabledWithMembership(selectedSharedVault, memberships)

  const sharedAccessFingerprint = selectedSharedVault
    ? `${selectedSharedVault.accessGrantStatus ?? 'na'}_${selectedSharedVault.wrappedDek?.trim() ? '1' : '0'}`
    : 'none'

  const {
    data: vaultFromQuery,
    isLoading: isLoadingVaultQuery,
    error: vaultQueryError,
  } = useQuery({
    queryKey: [...vaultKeys.byId(selectedSharedVault?.id ?? ''), 'shared-access', sharedAccessFingerprint],
    queryFn: () => vaultApi.getById(selectedSharedVault!.id),
    enabled: queryEnabled && !!selectedSharedVault?.id && decryptFlowEnabled,
  })

  const {
    sharedVaultData,
    sharedVaultOwnerId,
    isLoading: isLoadingSharedVaultView,
    error: decryptError,
  } = useSharedVaultView({
    sharedVault: selectedSharedVault,
    vault: vaultFromQuery,
    publicKeyB64,
    privateKeyB64,
    pqPrivateKeyB64,
  })

  const isLoading =
    isLoadingSharedVaultView ||
    isLoadingSharedList ||
    (!!selectedSharedVault && decryptFlowEnabled && isLoadingVaultQuery)

  const error =
    (decryptFlowEnabled ? decryptError : null) ||
    (vaultQueryError instanceof Error ? vaultQueryError.message : null)

  const { data: sections = [], isLoading: sectionsLoading, error: sectionsQueryError } = useVaultSections(
    id && selectedSharedVault?.id === id ? id : undefined,
    {
      enabled:
        queryEnabled &&
        !!id &&
        !!selectedSharedVault &&
        selectedSharedVault.id === id &&
        decryptFlowEnabled,
    },
  )

  const {
    sections: sharedSections,
    isLoading: isDecryptingSections,
    error: decryptedSectionsError,
  } = useDecryptedSharedSections({
    vaultId: id ?? null,
    ownerId: sharedVaultOwnerId,
    sections: sections.filter((section) => isVisibleVaultSectionType(section.sectionType)),
    publicKeyB64,
    privateKeyB64,
    pqPrivateKeyB64,
    enabled:
      queryEnabled &&
      !!id &&
      !!selectedSharedVault &&
      selectedSharedVault.id === id &&
      decryptFlowEnabled,
  })

  const sectionsError =
    (decryptFlowEnabled ? decryptedSectionsError : null) ||
    (sectionsQueryError
      ? (sectionsQueryError instanceof Error ? sectionsQueryError.message : 'Failed to load sections')
      : null)

  const sectionsLoadingOrDecrypting = decryptFlowEnabled && (sectionsLoading || isDecryptingSections)
  const showOwnerInactiveBanner =
    decryptFlowEnabled &&
    selectedSharedVault?.role === 'key_person' &&
    selectedSharedVault.accessGrantStatus === 'available' &&
    hasInEndAccessReleased(memberships, selectedSharedVault.ownerEmail)

  return {
    selectedSharedVault,
    decryptFlowEnabled,
    sharedVaultData,
    isLoading,
    error,
    showOwnerInactiveBanner,
    sharedSections,
    sectionsLoadingOrDecrypting,
    sectionsError,
  }
}
