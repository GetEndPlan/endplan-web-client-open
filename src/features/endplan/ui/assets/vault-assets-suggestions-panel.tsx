import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EndPlanIcon, type EndPlanIconName } from '@/shared/ui'
import type { AssetSchemaCategory } from '../../api/clients/vault-api'
import { VaultSuggestionTile, VaultSuggestionsPanel } from '../suggestions'

function suggestedCategoryIconName(key: string): EndPlanIconName {
  switch (key) {
    case 'bank_account':
      return 'bank'
    case 'investment_portfolio':
      return 'assets'
    case 'insurance_policy':
      return 'security'
    case 'property_deed':
      return 'property'
    default:
      return 'assets'
  }
}

function selectSuggestedAssetCategories(
  categories: AssetSchemaCategory[],
  selectedCategoryIds: ReadonlySet<string> | readonly string[],
): AssetSchemaCategory[] {
  const selected =
    selectedCategoryIds instanceof Set
      ? selectedCategoryIds
      : new Set(selectedCategoryIds)

  return [...categories]
    .filter(
      (category) =>
        (category.isActive ?? true) &&
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

type VaultAssetsSuggestionsPanelProps = {
  categories: AssetSchemaCategory[]
  selectedCategoryIds: string[]
  /** When false, tiles are display-only (ended subscription / no write access). */
  interactive?: boolean
  /** When true, tiles stay clickable but look muted and call onQuotaExhausted. */
  quotaExhausted?: boolean
  onAddCategory?: (categoryId: string) => void
  onQuotaExhausted?: () => void
}

export function VaultAssetsSuggestionsPanel({
  categories,
  selectedCategoryIds,
  interactive = true,
  quotaExhausted = false,
  onAddCategory,
  onQuotaExhausted,
}: VaultAssetsSuggestionsPanelProps) {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(false)

  const suggestedCategories = useMemo(
    () => selectSuggestedAssetCategories(categories, selectedCategoryIds),
    [categories, selectedCategoryIds],
  )

  if (dismissed || suggestedCategories.length === 0) return null

  return (
    <VaultSuggestionsPanel
      title={t('vault.assets.suggestions.title')}
      subtitle={t('vault.assets.suggestions.subtitle')}
      dismissLabel={t('vault.assets.suggestions.dismiss')}
      onDismiss={() => setDismissed(true)}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {suggestedCategories.map((category) => (
          <VaultSuggestionTile
            key={category.id}
            title={category.name}
            description={category.description ?? undefined}
            icon={
              <EndPlanIcon
                name={suggestedCategoryIconName(category.key)}
                size={24}
                className="size-5"
              />
            }
            interactive={interactive}
            className={quotaExhausted ? 'opacity-60' : undefined}
            ariaLabel={t('vault.assets.suggestions.addCategory', { name: category.name })}
            onSelect={
              interactive
                ? () => {
                    if (quotaExhausted) {
                      onQuotaExhausted?.()
                      return
                    }
                    onAddCategory?.(category.id)
                  }
                : undefined
            }
          />
        ))}
      </div>
    </VaultSuggestionsPanel>
  )
}
