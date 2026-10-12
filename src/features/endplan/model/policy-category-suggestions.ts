import type { AssetSchemaCategory } from '../api/clients/vault-api'

export function filterKnownPolicyCategoryIds(
  categoryIds: string[],
  schemaCategories: AssetSchemaCategory[],
): string[] {
  const allowed = new Set(
    schemaCategories.map((category) => category.id).filter((id) => id.length > 0),
  )
  if (allowed.size === 0) return categoryIds
  return categoryIds.filter((id) => allowed.has(id))
}

export function selectSuggestedPolicyCategories(
  categories: AssetSchemaCategory[],
  selectedCategoryIds: ReadonlySet<string> | readonly string[],
): AssetSchemaCategory[] {
  const selected =
    selectedCategoryIds instanceof Set ? selectedCategoryIds : new Set(selectedCategoryIds)

  return [...categories]
    .filter(
      (category) =>
        (category.isActive ?? true) &&
        category.source !== 'custom' &&
        !selected.has(category.id) &&
        (category.suggestionOrder ?? 0) > 0,
    )
    .sort((left, right) => {
      const leftOrder = left.suggestionOrder ?? 0
      const rightOrder = right.suggestionOrder ?? 0
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
      if (left.displayOrder !== right.displayOrder) {
        return left.displayOrder - right.displayOrder
      }
      return left.name.localeCompare(right.name)
    })
    .slice(0, 3)
}
