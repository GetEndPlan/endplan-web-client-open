import type { AssetSchemaCategory } from '../api/clients/vault-api'

export type AssetTableRow = {
  id: string
  values: Record<string, string>
}

export type AssetPayloadCategory = {
  categoryTemplateId: string
  categoryName?: string
  rows: AssetTableRow[]
}

export type AssetSectionPayloadV2 = {
  schemaVersion: number
  categories: AssetPayloadCategory[]
}

type LegacyAssetItem = {
  id?: string
  assetType?: string
  assetName?: string
  institution?: string
  accountOrPolicyNumber?: string
  notes?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function normalizeString(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
}

export function isAssetSectionPayloadV2(value: unknown): value is AssetSectionPayloadV2 {
  if (!isRecord(value)) return false
  if (!Array.isArray(value.categories)) return false
  return value.categories.every((item) => {
    if (!isRecord(item)) return false
    if (typeof item.categoryTemplateId !== 'string') return false
    if (item.categoryName != null && typeof item.categoryName !== 'string') return false
    if (!Array.isArray(item.rows)) return false
    return item.rows.every((row) => isRecord(row) && typeof row.id === 'string' && isRecord(row.values))
  })
}

function legacyItemToRow(item: LegacyAssetItem): AssetTableRow {
  const id = normalizeString(item.id) || crypto.randomUUID()
  return {
    id,
    values: {
      asset_name: normalizeString(item.assetName),
      institution: normalizeString(item.institution),
      account_number: normalizeString(item.accountOrPolicyNumber),
      notes: normalizeString(item.notes),
    },
  }
}

function categoryIdForLegacyItem(item: LegacyAssetItem, categories: AssetSchemaCategory[]): string | null {
  if (categories.length === 0) return null
  const byType = categories.find((c) => c.key === item.assetType)
  if (byType) return byType.id
  const fallback = categories.find((c) => c.key === 'other') ?? categories[0]
  return fallback?.id ?? null
}

function fromLegacyPayload(value: unknown, categories: AssetSchemaCategory[]): AssetSectionPayloadV2 {
  const categoryNameByID = new Map(categories.map((category) => [category.id, category.name]))
  const byCategory = new Map<string, AssetTableRow[]>()
  const items = isRecord(value) && Array.isArray(value.items) ? (value.items as LegacyAssetItem[]) : []

  for (const item of items) {
    const categoryID = categoryIdForLegacyItem(item, categories)
    if (!categoryID) continue
    const rows = byCategory.get(categoryID) ?? []
    rows.push(legacyItemToRow(item))
    byCategory.set(categoryID, rows)
  }

  return {
    schemaVersion: 2,
    categories: Array.from(byCategory.entries()).map(([categoryTemplateId, rows]) => ({
      categoryTemplateId,
      categoryName: categoryNameByID.get(categoryTemplateId),
      rows,
    })),
  }
}

export function normalizeAssetPayload(
  value: unknown,
  categories: AssetSchemaCategory[],
): AssetSectionPayloadV2 {
  const categoryNameByID = new Map(categories.map((category) => [category.id, category.name]))
  if (isAssetSectionPayloadV2(value)) {
    return {
      schemaVersion: 2,
      categories: value.categories.map((category) => ({
        categoryTemplateId: category.categoryTemplateId,
        categoryName:
          normalizeString(category.categoryName) ||
          categoryNameByID.get(category.categoryTemplateId) ||
          undefined,
        rows: category.rows.map((row) => ({
          id: row.id || crypto.randomUUID(),
          values: Object.fromEntries(
            Object.entries(row.values ?? {}).map(([key, v]) => [key, normalizeString(v)]),
          ),
        })),
      })),
    }
  }
  return fromLegacyPayload(value, categories)
}

export function getCategoryRows(
  payload: AssetSectionPayloadV2,
  categoryTemplateId: string,
): AssetTableRow[] {
  return payload.categories.find((c) => c.categoryTemplateId === categoryTemplateId)?.rows ?? []
}

export function setAssetCellValue(
  payload: AssetSectionPayloadV2,
  categoryTemplateId: string,
  rowId: string,
  fieldKey: string,
  value: string,
): AssetSectionPayloadV2 {
  return {
    ...payload,
    categories: payload.categories.map((category) => {
      if (category.categoryTemplateId !== categoryTemplateId) {
        return category
      }
      return {
        ...category,
        rows: category.rows.map((row) => {
          if (row.id !== rowId) {
            return row
          }
          return {
            ...row,
            values: {
              ...row.values,
              [fieldKey]: value,
            },
          }
        }),
      }
    }),
  }
}

/**
 * An asset is considered added when at least one field has a non-empty value.
 * Empty placeholder rows seeded by adding a category do not count.
 */
export function assetRowHasUserInput(row: unknown): boolean {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return false
  const values = 'values' in row ? row.values : undefined
  if (!values || typeof values !== 'object' || Array.isArray(values)) return false
  return Object.values(values).some((value) => typeof value === 'string' && value.trim() !== '')
}

export function countFilledAssetRowsInCategories(
  categories: Array<{ rows?: unknown[] }> | null | undefined,
): number {
  if (!Array.isArray(categories)) return 0
  return categories.reduce(
    (sum, category) => sum + (category.rows ?? []).filter(assetRowHasUserInput).length,
    0,
  )
}
