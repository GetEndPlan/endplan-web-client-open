import type { AssetSchemaCategory } from '../api/clients/vault-api'
import type { AssetSectionPayloadV2 } from './asset-table-model'

export const ASSET_NAME_FIELD_KEY = 'asset_name'

export type NetWorthSlice = {
  id: string
  label: string
  value: number
}

export type NetWorthSummary = {
  slices: NetWorthSlice[]
  total: number
  hasValueColumns: boolean
}

export const NET_WORTH_MAX_VISIBLE_SLICES = 4
export const NET_WORTH_OTHER_SLICE_ID = 'other-assets'

/**
 * Limits chart/legend slices to the top N assets by value and rolls the remainder into one bucket.
 * Input slices must already be sorted by value descending.
 * Output is re-sorted so the "Other" bucket sits by amount (highest → lowest) for color assignment.
 */
export function groupNetWorthSlicesForDisplay(
  slices: NetWorthSlice[],
  otherLabel: string,
  maxVisible: number = NET_WORTH_MAX_VISIBLE_SLICES,
): NetWorthSlice[] {
  if (slices.length <= maxVisible) {
    return slices
  }

  const visible = slices.slice(0, maxVisible)
  const otherValue = slices.slice(maxVisible).reduce((sum, slice) => sum + slice.value, 0)

  if (otherValue <= 0) {
    return visible
  }

  return sortNetWorthSlicesByValueDesc([
    ...visible,
    {
      id: NET_WORTH_OTHER_SLICE_ID,
      label: otherLabel,
      value: otherValue,
    },
  ])
}

export function sortNetWorthSlicesByValueDesc(slices: NetWorthSlice[]): NetWorthSlice[] {
  return [...slices].sort((left, right) => {
    if (right.value !== left.value) {
      return right.value - left.value
    }
    return left.label.localeCompare(right.label)
  })
}

/** Parse a stored money cell into a positive finite number, or null if invalid. */
export function parsePositiveMoneyAmount(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.includes('-')) return null

  const cleaned = trimmed.replace(/[^0-9.]/g, '')
  if (!cleaned || cleaned === '.') return null

  const normalized = cleaned.endsWith('.') ? cleaned.slice(0, -1) : cleaned
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

export function resolveAssetRowLabel(
  values: Record<string, string>,
  nameFieldKey?: string,
): string {
  const keysToTry = [nameFieldKey, ASSET_NAME_FIELD_KEY].filter(
    (key, index, list): key is string => !!key && list.indexOf(key) === index,
  )

  for (const key of keysToTry) {
    const label = values[key]?.trim()
    if (label) return label
  }

  // Legacy payloads may still use camelCase before v2 normalization.
  const legacyLabel = values.assetName?.trim()
  if (legacyLabel) return legacyLabel

  return ''
}

export function getAssetNameFieldKeyByCategory(
  categories: AssetSchemaCategory[],
): Map<string, string> {
  const byCategory = new Map<string, string>()

  for (const category of categories) {
    const fields = category.fields ?? []
    const assetNameField = fields.find((field) => field.key === ASSET_NAME_FIELD_KEY)
    if (assetNameField) {
      byCategory.set(category.id, assetNameField.key)
      continue
    }

    const primaryTextField = [...fields]
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .find((field) => field.fieldType === 'text' || field.fieldType === 'textarea')

    if (primaryTextField) {
      byCategory.set(category.id, primaryTextField.key)
    }
  }

  return byCategory
}

export function getValueFieldKeysByCategory(
  categories: AssetSchemaCategory[],
): Map<string, string[]> {
  const byCategory = new Map<string, string[]>()
  for (const category of categories) {
    const keys = (category.fields ?? [])
      .filter((field) => field.fieldType === 'value')
      .map((field) => field.key)
    if (keys.length > 0) {
      byCategory.set(category.id, keys)
    }
  }
  return byCategory
}

export function buildNetWorthSummary(
  payload: AssetSectionPayloadV2,
  schemaCategories: AssetSchemaCategory[],
): NetWorthSummary {
  const valueFieldKeysByCategory = getValueFieldKeysByCategory(schemaCategories)
  const nameFieldKeyByCategory = getAssetNameFieldKeyByCategory(schemaCategories)
  const hasValueColumns = valueFieldKeysByCategory.size > 0
  const slices: NetWorthSlice[] = []

  for (const category of payload.categories) {
    const valueFieldKeys = valueFieldKeysByCategory.get(category.categoryTemplateId) ?? []
    if (valueFieldKeys.length === 0) continue

    const nameFieldKey = nameFieldKeyByCategory.get(category.categoryTemplateId)
    const schemaCategoryName =
      schemaCategories.find((entry) => entry.id === category.categoryTemplateId)?.name ?? ''

    for (const row of category.rows) {
      let rowTotal = 0
      let hasValue = false

      for (const fieldKey of valueFieldKeys) {
        const amount = parsePositiveMoneyAmount(row.values[fieldKey] ?? '')
        if (amount == null) continue
        rowTotal += amount
        hasValue = true
      }

      if (!hasValue || rowTotal <= 0) continue

      slices.push({
        id: row.id,
        label:
          resolveAssetRowLabel(row.values, nameFieldKey) ||
          category.categoryName?.trim() ||
          schemaCategoryName,
        value: rowTotal,
      })
    }
  }

  const sortedSlices = sortNetWorthSlicesByValueDesc(slices)
  const total = sortedSlices.reduce((sum, slice) => sum + slice.value, 0)

  return {
    slices: sortedSlices,
    total,
    hasValueColumns,
  }
}
