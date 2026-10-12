import { ApiError } from '@/shared/api/client'
import type { AssetSchemaCategory } from '../../api/clients/vault-api'
import { hashAssetPayload } from '../../model/asset-payload-hash'
import type { PendingAssetsAutosaveSnapshot } from '../../model/assets-autosave-queue'
import {
  normalizeAssetPayload,
  type AssetSectionPayloadV2,
  type AssetTableRow,
} from '../../model/asset-table-model'

export type AddCustomFieldInput = {
  categoryTemplateId: string
  key?: string
  label: string
  fieldType?:
    | 'text'
    | 'textarea'
    | 'number'
    | 'value'
    | 'date'
    | 'select'
    | 'attachment'
    | 'password'
    | 'contact'
}

export function isLikelyOfflineError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true
  }
  if (error instanceof ApiError) {
    return false
  }
  if (error instanceof TypeError) {
    return true
  }
  if (error instanceof DOMException && error.name === 'NetworkError') {
    return true
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      message.includes('network request failed') ||
      message.includes('load failed')
    )
  }
  return false
}

export function emptyAssetsPayload(): AssetSectionPayloadV2 {
  return {
    schemaVersion: 2,
    categories: [],
  }
}

export function buildPayloadWithInitialRowsForAddedCategories(args: {
  payload: AssetSectionPayloadV2
  selectedCategoryIds: string[]
  schemaCategories: AssetSchemaCategory[]
  addedCategoryTemplateIds: string[]
}): AssetSectionPayloadV2 {
  const next = withSelectedCategories(
    args.payload,
    args.selectedCategoryIds,
    args.schemaCategories,
  )
  if (args.addedCategoryTemplateIds.length === 0) {
    return next
  }

  return {
    ...next,
    categories: next.categories.map((category) => {
      if (!args.addedCategoryTemplateIds.includes(category.categoryTemplateId)) {
        return category
      }
      if (category.rows.length > 0) {
        return category
      }

      const schemaCategory = args.schemaCategories.find(
        (entry) => entry.id === category.categoryTemplateId,
      )
      const fieldKeys = (schemaCategory?.fields ?? []).map((field) => field.key)
      const baseValues = Object.fromEntries(fieldKeys.map((key) => [key, '']))
      const initialRow: AssetTableRow = {
        id: crypto.randomUUID(),
        values: baseValues,
      }

      return {
        ...category,
        rows: [initialRow],
      }
    }),
  }
}

export function withSelectedCategories(
  payload: AssetSectionPayloadV2,
  selectedCategoryIds: string[],
  schemaCategories: AssetSchemaCategory[] = [],
): AssetSectionPayloadV2 {
  const schemaCategoryNameByID = new Map(
    schemaCategories.map((category) => [category.id, category.name]),
  )
  const byCategory = new Map(
    payload.categories.map((category) => [
      category.categoryTemplateId,
      {
        rows: category.rows,
        categoryName: category.categoryName,
      },
    ]),
  )
  return {
    schemaVersion: 2,
    categories: selectedCategoryIds.map((categoryTemplateId) => ({
      categoryTemplateId,
      categoryName:
        byCategory.get(categoryTemplateId)?.categoryName ||
        schemaCategoryNameByID.get(categoryTemplateId),
      rows: byCategory.get(categoryTemplateId)?.rows ?? [],
    })),
  }
}

export function buildAssetsHydrationKey(
  vaultId: string,
  section: { id: string; updatedAt: string } | null,
): string {
  if (!section) {
    return `vault:${vaultId}:assets:none`
  }

  return `vault:${vaultId}:assets:${section.id}:${section.updatedAt}`
}

export function countAssetRowsInPayload(payload: AssetSectionPayloadV2): number {
  return payload.categories.reduce((total, category) => total + category.rows.length, 0)
}

/** Prefer Postgres-backed schema selection once loaded; otherwise infer from decrypted payload. */
export function resolveAssetsHydrationSelectedCategoryIds(args: {
  schemaSelectedCategoryIds: string[]
  payloadCategoryIds: string[]
  isSchemaLoaded: boolean
}): string[] {
  if (args.isSchemaLoaded) {
    return args.schemaSelectedCategoryIds
  }
  return args.payloadCategoryIds
}

/** True when a local autosave snapshot should override a successfully loaded server payload. */
export function shouldApplyPendingAssetsSnapshot(args: {
  pending: PendingAssetsAutosaveSnapshot
  serverPayload: AssetSectionPayloadV2
  serverPayloadHash: string
  schemaCategories: AssetSchemaCategory[]
}): boolean {
  const { pending, serverPayload, serverPayloadHash, schemaCategories } = args
  const pendingPayload = withSelectedCategories(
    normalizeAssetPayload(pending.payload, schemaCategories),
    pending.selectedCategoryIds,
    schemaCategories,
  )
  const pendingHash = hashAssetPayload(pendingPayload)
  if (pendingHash === serverPayloadHash) {
    return false
  }

  const serverRowCount = countAssetRowsInPayload(serverPayload)
  const pendingRowCount = countAssetRowsInPayload(pendingPayload)

  // Never clobber server rows with an empty local draft (common after failed decrypt/load).
  if (serverRowCount > 0 && pendingRowCount === 0) {
    return false
  }

  if (
    pending.lastPersistedPayloadHash !== null &&
    pending.lastPersistedPayloadHash !== serverPayloadHash
  ) {
    return true
  }

  return pendingRowCount > 0
}

/** True when a decrypted server payload should replace the in-memory editor state. */
export function shouldApplyServerHydratedAssetsPayload(args: {
  serverPayload: AssetSectionPayloadV2
  serverPayloadHash: string
  lastPersistedPayload: AssetSectionPayloadV2 | null
  lastPersistedPayloadHash: string | null
}): boolean {
  const { serverPayload, serverPayloadHash, lastPersistedPayload, lastPersistedPayloadHash } = args
  if (lastPersistedPayloadHash === serverPayloadHash) {
    return true
  }
  if (!lastPersistedPayload || lastPersistedPayloadHash === null) {
    return true
  }

  const serverRowCount = countAssetRowsInPayload(serverPayload)
  const lastPersistedRowCount = countAssetRowsInPayload(lastPersistedPayload)

  // Avoid clobbering newer local saves with a stale section fetch/blob (common after create + refetch).
  if (lastPersistedRowCount > 0 && serverRowCount < lastPersistedRowCount) {
    return false
  }

  return true
}

type AssetCategoryWithTemplateId = {
  categoryTemplateId?: string | null
}

/** Shared read paths use schema selection as source of truth over the encrypted section blob. */
export function filterAssetCategoriesBySelection<T extends AssetCategoryWithTemplateId>(
  categories: T[],
  selectedCategoryIds: string[],
  isSchemaLoaded: boolean,
): T[] {
  if (!isSchemaLoaded) {
    return []
  }
  const selected = new Set(selectedCategoryIds)
  return categories.filter(
    (category) =>
      typeof category.categoryTemplateId === 'string' &&
      selected.has(category.categoryTemplateId),
  )
}
