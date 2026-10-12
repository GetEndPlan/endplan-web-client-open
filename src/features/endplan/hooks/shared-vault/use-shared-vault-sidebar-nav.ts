import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useMemberships } from '@/features/trusted-circle'
import { useVaultsShared } from '../../api/hooks/queries/use-vault-queries'
import {
  sharedVaultDecryptFlowEnabledWithMembership,
  vaultSectionApi,
  type SharedVault,
  type VaultSectionListResponse,
  type VaultSectionResponse,
} from '../../api/clients/vault-api'
import { vaultKeys } from '../../api/keys/vault-query-keys'
import { getSharedVaultSidebarBlockedKind, type SharedVaultSidebarBlockedKind } from '../../model/shared-vault-sidebar-blocked'
import { isVisibleVaultSectionType } from '../../model/vault-section-types'

export type SharedVaultSidebarNavEntry = {
  vault: SharedVault
  /** Section types from GET sections (same source as shared vault page), displayOrder-sorted. */
  sectionTypes: string[]
  /** When true, show expandable subsection links. */
  showSubMenu: boolean
  /**
   * Short status when decrypt flow is off (aligned with shared vault overview messaging).
   */
  navHint: string | null
}

function navHintForBlockedKind(
  kind: SharedVaultSidebarBlockedKind,
  t: (key: string, options?: { defaultValue: string }) => string,
): string | null {
  switch (kind) {
    case 'none':
      return null
    case 'pending_transfer':
      return t('nav.sharedVaultNav.pendingTransfer', { defaultValue: 'Pending transfer' })
    case 'deferred_grant':
      return t('nav.sharedVaultNav.sealedReady', { defaultValue: 'Sealed · ready' })
    case 'awaiting_key_share':
      return t('nav.sharedVaultNav.awaitingKeyShare', { defaultValue: 'Awaiting key share' })
    case 'post_release_recovery':
      return t('nav.sharedVaultNav.postReleaseRecovery', { defaultValue: 'Temporarily unavailable' })
    default:
      return null
  }
}

function sectionTypesInDisplayOrder(sections: VaultSectionResponse[]): string[] {
  return [...sections]
    .filter((section) => isVisibleVaultSectionType(section.sectionType))
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((s) => s.sectionType)
}

export function useSharedVaultSidebarNav(options: { enabled: boolean }): SharedVaultSidebarNavEntry[] {
  const { enabled } = options
  const { t } = useTranslation()
  const { data: sharedVaults = [] } = useVaultsShared({ enabled })
  const { data: memberships = [] } = useMemberships({ enabled })

  const sectionQueries = useQueries({
    queries: sharedVaults.map((vault) => {
      const decryptFlow = sharedVaultDecryptFlowEnabledWithMembership(vault, memberships)
      return {
        queryKey: vaultKeys.sections(vault.id),
        queryFn: () => vaultSectionApi.list(vault.id),
        select: (data: VaultSectionListResponse) => data.sections,
        enabled: enabled && decryptFlow,
      }
    }),
  })

  return useMemo(() => {
    return sharedVaults.map((vault, index) => {
      const decryptFlow = sharedVaultDecryptFlowEnabledWithMembership(vault, memberships)
      const blockedKind = getSharedVaultSidebarBlockedKind(vault, memberships)
      const sections = decryptFlow ? (sectionQueries[index]?.data ?? []) : []
      const sectionTypes = sectionTypesInDisplayOrder(sections)
      return {
        vault,
        sectionTypes,
        showSubMenu: decryptFlow && sectionTypes.length > 0,
        navHint: navHintForBlockedKind(blockedKind, t),
      }
    })
  }, [memberships, sectionQueries, sharedVaults, t])
}
