import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  decryptSectionContent,
  fetchBlobAsBase64,
  unwrapDekWithKeyPair,
} from '@/shared/lib'
import { useKeyMaterial } from '@/features/keys'
import type { VaultResponse } from '../../api/clients/vault-api'
import { vaultKeys } from '../../api/keys/vault-query-keys'
import {
  useVaultAssetsSchema,
  useVaultSections,
} from '../../api/hooks/queries/use-vault-queries'
import { normalizeAssetPayload } from '../../model/asset-table-model'
import { buildNetWorthSummary, groupNetWorthSlicesForDisplay, type NetWorthSummary } from '../../model/net-worth'
import { SECTION_ID } from '../../model/vault-section-types'

const NET_WORTH_QUERY_GC_MS = 60_000

export type DashboardNetWorthStatus = 'idle' | 'loading' | 'ready' | 'error' | 'locked'

type UseDashboardNetWorthInput = {
  vault: VaultResponse | null
  enabled?: boolean
  otherAssetsLabel: string
}

type UseDashboardNetWorthOutput = {
  status: DashboardNetWorthStatus
  summary: NetWorthSummary | null
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<unknown>
}

export function useDashboardNetWorth({
  vault,
  enabled = true,
  otherAssetsLabel,
}: UseDashboardNetWorthInput): UseDashboardNetWorthOutput {
  const vaultId = vault?.id
  const queryEnabled = enabled && !!vaultId

  const { data: sections = [], isLoading: isSectionsLoading } = useVaultSections(vaultId, {
    enabled: queryEnabled,
  })
  const { data: schema, isLoading: isSchemaLoading } = useVaultAssetsSchema(vaultId, {
    enabled: queryEnabled,
  })
  const { publicKeyB64, privateKeyB64, pqPrivateKeyB64 } = useKeyMaterial({
    enabled: queryEnabled,
  })

  const assetsSection =
    sections.find((section) => section.sectionType === SECTION_ID.ASSETS) ?? null
  const schemaCategories = useMemo(() => schema?.categories ?? [], [schema?.categories])
  const assetsSectionVersion = assetsSection?.version != null ? String(assetsSection.version) : 'none'
  const schemaFingerprint = useMemo(
    () =>
      schemaCategories
        .flatMap((category) =>
          (category.fields ?? [])
            .filter((field) => field.fieldType === 'value')
            .map((field) => `${category.id}:${field.key}`),
        )
        .join('|'),
    [schemaCategories],
  )
  const keysReady = !!publicKeyB64 && !!privateKeyB64

  const getDek = useCallback(async () => {
    if (!vault || !publicKeyB64 || !privateKeyB64) return null
    return unwrapDekWithKeyPair(vault.wrappedDek, publicKeyB64, privateKeyB64, pqPrivateKeyB64, {
      vaultId: vault.id,
    })
  }, [privateKeyB64, pqPrivateKeyB64, publicKeyB64, vault])

  const netWorthQuery = useQuery({
    queryKey: vaultKeys.netWorth(vaultId ?? '', `${assetsSectionVersion}:${schemaFingerprint}`),
    queryFn: async (): Promise<NetWorthSummary> => {
      if (!vault) {
        return { slices: [], total: 0, hasValueColumns: false }
      }

      const emptySummary = buildNetWorthSummary(
        { schemaVersion: 2, categories: [] },
        schemaCategories,
      )

      if (!assetsSection) {
        return emptySummary
      }

      const dek = await getDek()
      if (!dek) {
        throw new Error('encryption keys unavailable')
      }

      const encryptedData = assetsSection.blobUrl
        ? await fetchBlobAsBase64(assetsSection.blobUrl)
        : (assetsSection.encryptedData ?? '')

      if (!encryptedData) {
        return emptySummary
      }

      const decoded = await decryptSectionContent<unknown>(
        encryptedData,
        assetsSection.encryptionIv,
        dek,
        vault.id,
        vault.ownerId,
        SECTION_ID.ASSETS,
      )

      const payload = normalizeAssetPayload(decoded, schemaCategories)
      return buildNetWorthSummary(payload, schemaCategories)
    },
    enabled:
      queryEnabled &&
      keysReady &&
      !isSectionsLoading &&
      !isSchemaLoading &&
      schemaCategories.length >= 0,
    staleTime: NET_WORTH_QUERY_GC_MS,
    gcTime: NET_WORTH_QUERY_GC_MS,
    retry: false,
  })

  const summary = useMemo((): NetWorthSummary | null => {
    if (!netWorthQuery.data) {
      return null
    }

    return {
      ...netWorthQuery.data,
      slices: groupNetWorthSlicesForDisplay(netWorthQuery.data.slices, otherAssetsLabel),
    }
  }, [netWorthQuery.data, otherAssetsLabel])

  if (!queryEnabled) {
    return {
      status: 'idle',
      summary: null,
      isLoading: false,
      isError: false,
      refetch: async () => undefined,
    }
  }

  if (!keysReady && !isSectionsLoading && !isSchemaLoading) {
    return {
      status: 'locked',
      summary: null,
      isLoading: false,
      isError: false,
      refetch: netWorthQuery.refetch,
    }
  }

  const isLoading =
    isSectionsLoading ||
    isSchemaLoading ||
    (keysReady && (netWorthQuery.isPending || (netWorthQuery.isFetching && !netWorthQuery.data)))

  if (netWorthQuery.isError) {
    return {
      status: 'error',
      summary: null,
      isLoading: false,
      isError: true,
      refetch: netWorthQuery.refetch,
    }
  }

  if (isLoading) {
    return {
      status: 'loading',
      summary: null,
      isLoading: true,
      isError: false,
      refetch: netWorthQuery.refetch,
    }
  }

  return {
    status: 'ready',
    summary,
    isLoading: false,
    isError: false,
    refetch: netWorthQuery.refetch,
  }
}
