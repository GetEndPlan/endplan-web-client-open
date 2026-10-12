import { countFilledAssetRowsInCategories } from './asset-table-model'
import { SECTION_ID } from './vault-section-types'

export type SectionContentPayload = {
  items?: unknown[]
  categories?: Array<{ rows?: unknown[] }>
}

/**
 * Counts meaningful section items for setup progress and dashboard totals.
 * Asset categories and empty placeholder rows do not count; a row counts only
 * after the user has entered at least one field value.
 */
export function countSectionContentItems(
  sectionType: string,
  content: SectionContentPayload | null | undefined,
): number {
  if (content == null) return 0
  if (sectionType === SECTION_ID.ASSETS || sectionType === SECTION_ID.POLICIES) {
    return countFilledAssetRowsInCategories(content.categories)
  }
  return Array.isArray(content.items) ? content.items.length : 0
}
