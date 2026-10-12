import type { AssetSectionPayloadV2 } from './asset-table-model'

export function assetCategoryRowCountsFromPayload(
  payload: AssetSectionPayloadV2,
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const category of payload.categories) {
    counts[category.categoryTemplateId] = category.rows.length
  }
  return counts
}

export const policyCategoryRowCountsFromPayload = assetCategoryRowCountsFromPayload

export type AssetCategoriesPlanBlock = {
  kind: 'asset_categories_limit'
  max: number
  current: number
}

export function checkAssetCategoriesAgainstPlan(args: {
  limits: { assetCategoriesMax: number } | null
  selectedCategoryCount: number
}): AssetCategoriesPlanBlock | null {
  if (!args.limits || args.limits.assetCategoriesMax <= 0) return null
  if (args.selectedCategoryCount > args.limits.assetCategoriesMax) {
    return {
      kind: 'asset_categories_limit',
      max: args.limits.assetCategoriesMax,
      current: args.selectedCategoryCount,
    }
  }
  return null
}

export type AssetRowsPlanBlock = {
  kind: 'asset_rows_per_category'
  categoryId: string
  max: number
  current: number
}

export function checkAssetRowsAgainstPlan(args: {
  limits: { assetRowsPerCategoryMax: number } | null
  payload: AssetSectionPayloadV2
}): AssetRowsPlanBlock | null {
  if (!args.limits || args.limits.assetRowsPerCategoryMax <= 0) return null
  for (const category of args.payload.categories) {
    const count = category.rows.length
    if (count > args.limits.assetRowsPerCategoryMax) {
      return {
        kind: 'asset_rows_per_category',
        categoryId: category.categoryTemplateId,
        max: args.limits.assetRowsPerCategoryMax,
        current: count,
      }
    }
  }
  return null
}

export const checkPolicyRowsAgainstPlan = checkAssetRowsAgainstPlan

export function canAddAssetRowToCategory(args: {
  assetRowsPerCategoryMax: number
  currentRowCount: number
}): boolean {
  if (args.assetRowsPerCategoryMax <= 0) return true
  return args.currentRowCount < args.assetRowsPerCategoryMax
}

export type InstructionsPlanBlock = {
  kind: 'instructions_limit'
  max: number
  current: number
}

export function checkInstructionsAgainstPlan(args: {
  limits: { instructionsMax: number } | null
  itemCount: number
}): InstructionsPlanBlock | null {
  if (!args.limits || args.limits.instructionsMax <= 0) return null
  if (args.itemCount > args.limits.instructionsMax) {
    return {
      kind: 'instructions_limit',
      max: args.limits.instructionsMax,
      current: args.itemCount,
    }
  }
  return null
}

export function canAddInstruction(args: {
  instructionsMax: number
  currentCount: number
}): boolean {
  if (args.instructionsMax <= 0) return true
  return args.currentCount < args.instructionsMax
}

export type ContactsPlanBlock = {
  kind: 'contacts_limit'
  max: number
  current: number
}

export function checkContactsAgainstPlan(args: {
  limits: { contactsMax: number } | null
  itemCount: number
}): ContactsPlanBlock | null {
  if (!args.limits || args.limits.contactsMax <= 0) return null
  if (args.itemCount > args.limits.contactsMax) {
    return {
      kind: 'contacts_limit',
      max: args.limits.contactsMax,
      current: args.itemCount,
    }
  }
  return null
}

export function canAddContact(args: {
  contactsMax: number
  currentCount: number
}): boolean {
  if (args.contactsMax <= 0) return true
  return args.currentCount < args.contactsMax
}

/** Membership rows and open invites that consume a trusted-circle seat for a role. */
export function countOccupiedRoleSeats(args: {
  role: string
  members: { role: string; status: string }[]
  sentInvitations: { role: string; status: string }[]
}): number {
  const memberCount = args.members.filter(
    (member) => member.role === args.role && member.status !== 'revoked',
  ).length
  const pendingInvites = args.sentInvitations.filter(
    (invitation) =>
      invitation.role === args.role &&
      (invitation.status === 'pending' || invitation.status === 'pending_release'),
  ).length
  return memberCount + pendingInvites
}

export function countActiveKeyPersons(args: {
  members: { role: string; status: string }[]
  sentInvitations: { role: string; status: string }[]
}): number {
  return countOccupiedRoleSeats({ role: 'key_person', ...args })
}
