import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EndPlanIcon, type EndPlanIconName } from '@/shared/ui'
import type { AssetSchemaCategory } from '../../api/clients/vault-api'
import { selectSuggestedPolicyCategories } from '../../model/policy-category-suggestions'
import { VaultSuggestionTile, VaultSuggestionsPanel } from '../suggestions'

function suggestedCategoryIconName(key: string): EndPlanIconName {
  switch (key) {
    case 'life':
      return 'funeral-wishes'
    case 'health':
      return 'doctor'
    case 'income':
      return 'pay-and-cancel'
    case 'home_and_belongings':
      return 'property'
    case 'vehicles':
      return 'assets'
    case 'liability':
      return 'lawyer'
    case 'lifestyle_and_miscellaneous':
      return 'documents'
    default:
      return 'security'
  }
}

type VaultPoliciesSuggestionsPanelProps = {
  categories: AssetSchemaCategory[]
  selectedCategoryIds: string[]
  /** When false, tiles are display-only (ended subscription / no write access). */
  interactive?: boolean
  /** When true, tiles stay clickable but look muted and call onQuotaExhausted. */
  quotaExhausted?: boolean
  onAddCategory?: (categoryId: string) => void
  onQuotaExhausted?: () => void
}

export function VaultPoliciesSuggestionsPanel({
  categories,
  selectedCategoryIds,
  interactive = true,
  quotaExhausted = false,
  onAddCategory,
  onQuotaExhausted,
}: VaultPoliciesSuggestionsPanelProps) {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(false)

  const suggestedCategories = useMemo(
    () => selectSuggestedPolicyCategories(categories, selectedCategoryIds),
    [categories, selectedCategoryIds],
  )

  if (dismissed || suggestedCategories.length === 0) return null

  return (
    <VaultSuggestionsPanel
      title={t('vault.policies.suggestions.title')}
      subtitle={t('vault.policies.suggestions.subtitle')}
      dismissLabel={t('vault.policies.suggestions.dismiss')}
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
            ariaLabel={t('vault.policies.suggestions.addCategory', { name: category.name })}
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
