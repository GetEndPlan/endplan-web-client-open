import type { BillingTier, UserFeatures } from '../api/billing-api'

/** Pro plan shows "Unlimited" for quotas at or above this enforced cap. */
export const PRO_DISPLAY_UNLIMITED_THRESHOLD = 100

export function formatPlanCountLimit(
  value: number,
  tier: BillingTier | undefined,
  options?: { unlimitedThreshold?: number },
): string {
  const threshold = options?.unlimitedThreshold ?? PRO_DISPLAY_UNLIMITED_THRESHOLD
  if (tier === 'pro' && value >= threshold) {
    return 'Unlimited'
  }
  return String(value)
}

export function formatPlanStorageBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  const formatted = `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
  return formatted
}

export function pricingFeatureLinesForTier(tier: BillingTier): string[] {
  if (tier === 'pro') {
    return [
      '3 key persons',
      'Documents: Unlimited files, 100 folders, 100 MB per file',
      '5 GB total document storage',
      'Assets: Unlimited categories, 20 rows per category',
      '20 instruction entries',
      'End-to-end encryption',
    ]
  }
  return [
    '1 key person',
    'Documents: 10 files, 10 folders, 100 MB per file',
    '1 GB total document storage',
    'Assets: 10 categories, 5 rows per category',
    '5 instruction entries',
    'End-to-end encryption',
    'Cancel anytime',
  ]
}

/** Pre-matrix Basic tier stored this cap in some databases. */
export const LEGACY_BASIC_ASSET_CATEGORIES_MAX = 3

export const BASIC_TIER_ASSET_CATEGORIES_MAX = 10

export const BASIC_TIER_ASSET_ROWS_PER_CATEGORY_MAX = 5

export const BASIC_TIER_INSTRUCTIONS_MAX = 5

export const BASIC_TIER_CONTACTS_MAX = 10

export function resolveInstructionsMax(args: {
  features?: UserFeatures | null
  tier?: BillingTier
  inTrial?: boolean
  hasActiveSubscription?: boolean
  canAccess?: boolean
}): number {
  const fromFeatures = args.features?.instructions_max
  if (args.canAccess !== false && fromFeatures != null && fromFeatures > 0) {
    return fromFeatures
  }
  return BASIC_TIER_INSTRUCTIONS_MAX
}

export function resolveContactsMax(args: {
  features?: UserFeatures | null
  tier?: BillingTier
  inTrial?: boolean
  hasActiveSubscription?: boolean
  canAccess?: boolean
}): number {
  const fromFeatures = args.features?.contacts_max
  if (args.canAccess !== false && fromFeatures != null && fromFeatures > 0) {
    return fromFeatures
  }
  return BASIC_TIER_CONTACTS_MAX
}

export function resolveAssetRowsPerCategoryMax(args: {
  features?: UserFeatures | null
  tier?: BillingTier
  inTrial?: boolean
  hasActiveSubscription?: boolean
  canAccess?: boolean
}): number {
  const fromFeatures = args.features?.asset_rows_per_category_max
  if (args.canAccess !== false && fromFeatures != null && fromFeatures > 0) {
    return fromFeatures
  }
  return BASIC_TIER_ASSET_ROWS_PER_CATEGORY_MAX
}

export function resolvePolicyRowsPerCategoryMax(args: {
  features?: UserFeatures | null
  tier?: BillingTier
  inTrial?: boolean
  hasActiveSubscription?: boolean
  canAccess?: boolean
}): number {
  const fromFeatures = args.features?.policy_rows_per_category_max
  if (args.canAccess !== false && fromFeatures != null && fromFeatures > 0) {
    return fromFeatures
  }
  return resolveAssetRowsPerCategoryMax(args)
}

export function resolvePolicyCategoriesMax(args: {
  features?: UserFeatures | null
  schemaMax?: number
  tier?: BillingTier
  inTrial?: boolean
  hasActiveSubscription?: boolean
  canAccess?: boolean
}): number {
  const fromFeatures = args.features?.policy_categories_max
  if (args.canAccess !== false && fromFeatures != null && fromFeatures > 0) {
    return fromFeatures
  }
  const schemaMax = args.schemaMax ?? 0
  if (schemaMax > 0) {
    return schemaMax
  }
  return resolveAssetCategoriesMax(args)
}

export function isBasicOrTrialPlan(args: {
  tier?: BillingTier
  inTrial?: boolean
  hasActiveSubscription?: boolean
}): boolean {
  if (args.inTrial) return true
  if (args.tier === 'basic') return true
  if (args.tier === 'pro') return false
  return !args.hasActiveSubscription
}

export function resolveAssetCategoriesMax(args: {
  features?: UserFeatures | null
  schemaMax?: number
  tier?: BillingTier
  inTrial?: boolean
  hasActiveSubscription?: boolean
  canAccess?: boolean
}): number {
  const basicOrTrial = isBasicOrTrialPlan(args)

  const normalizeLegacy = (value: number): number => {
    if (basicOrTrial && value === LEGACY_BASIC_ASSET_CATEGORIES_MAX) {
      return BASIC_TIER_ASSET_CATEGORIES_MAX
    }
    return value
  }

  const fromFeatures = args.features?.asset_categories_max
  if (args.canAccess !== false && fromFeatures != null && fromFeatures > 0) {
    return normalizeLegacy(fromFeatures)
  }

  const schemaMax = args.schemaMax ?? 0
  if (schemaMax > 0) {
    return normalizeLegacy(schemaMax)
  }

  return BASIC_TIER_ASSET_CATEGORIES_MAX
}

export type PlanQuotaSnapshot = {
  maxKeyPersons: number
  documentsFilesMax: number
  documentsFoldersMax: number
  documentsFileSizeMaxBytes: number
  documentsTotalSizeMaxBytes: number
  assetCategoriesMax: number
  assetRowsPerCategoryMax: number
  instructionsMax: number
}

export function planQuotaFromFeatures(
  features: UserFeatures | undefined | null,
): PlanQuotaSnapshot | null {
  if (!features) return null
  return {
    maxKeyPersons: features.max_key_persons,
    documentsFilesMax: features.documents_files_max,
    documentsFoldersMax: features.documents_folders_max,
    documentsFileSizeMaxBytes: features.documents_file_size_max_bytes,
    documentsTotalSizeMaxBytes: features.documents_total_size_max_bytes,
    assetCategoriesMax: features.asset_categories_max,
    assetRowsPerCategoryMax: features.asset_rows_per_category_max,
    instructionsMax: features.instructions_max,
  }
}
