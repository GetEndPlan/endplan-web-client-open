import type { EndPlanIconName } from '@/shared/ui'

/**
 * Static document suggestion cards shown above the documents workspace.
 * Clicking a card marks it done locally (checklist UX).
 */
export type DocumentSuggestionId =
  | 'will_or_trust'
  | 'power_of_attorney'
  | 'insurance_policy'
  | 'property_deed'
  | 'account_statement'
  | 'tax_return'

export type DocumentSuggestion = {
  id: DocumentSuggestionId
  icon: EndPlanIconName
}

export const DOCUMENT_SUGGESTIONS: readonly DocumentSuggestion[] = [
  { id: 'will_or_trust', icon: 'lawyer' },
  { id: 'power_of_attorney', icon: 'power-of-attorney' },
  { id: 'insurance_policy', icon: 'security' },
  { id: 'property_deed', icon: 'property' },
  { id: 'account_statement', icon: 'bank' },
  { id: 'tax_return', icon: 'file' },
] as const
