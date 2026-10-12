/**
 * Client-side checks for vault document plan limits (folders, file count, per-file size, total storage).
 * Call before create-folder / init-upload so users are not charged work then rejected by the API.
 */

import type { BillingTier, UserFeatures } from '@/features/billing/api/billing-api'

export type DocumentsPlanLimitsSnapshot = {
  foldersMax: number
  filesMax: number
  fileSizeMaxBytes: number
  totalSizeMaxBytes: number
}

export const BASIC_TIER_DOCUMENTS_FOLDERS_MAX = 10
export const BASIC_TIER_DOCUMENTS_FILES_MAX = 10
export const BASIC_TIER_DOCUMENTS_FILE_SIZE_MAX_BYTES = 104857600
export const BASIC_TIER_DOCUMENTS_TOTAL_SIZE_MAX_BYTES = 1073741824

type DocumentQuotaFeatures = Pick<
  UserFeatures,
  | 'documents_folders_max'
  | 'documents_files_max'
  | 'documents_file_size_max_bytes'
  | 'documents_total_size_max_bytes'
>

export function resolveDocumentsPlanLimits(args: {
  features?: DocumentQuotaFeatures | null
  tier?: BillingTier
  inTrial?: boolean
  hasActiveSubscription?: boolean
  canAccess?: boolean
}): DocumentsPlanLimitsSnapshot {
  const fromFeatures = args.features
  if (args.canAccess !== false && fromFeatures) {
    return {
      foldersMax:
        fromFeatures.documents_folders_max > 0
          ? fromFeatures.documents_folders_max
          : BASIC_TIER_DOCUMENTS_FOLDERS_MAX,
      filesMax:
        fromFeatures.documents_files_max > 0
          ? fromFeatures.documents_files_max
          : BASIC_TIER_DOCUMENTS_FILES_MAX,
      fileSizeMaxBytes:
        fromFeatures.documents_file_size_max_bytes > 0
          ? fromFeatures.documents_file_size_max_bytes
          : BASIC_TIER_DOCUMENTS_FILE_SIZE_MAX_BYTES,
      totalSizeMaxBytes:
        fromFeatures.documents_total_size_max_bytes > 0
          ? fromFeatures.documents_total_size_max_bytes
          : BASIC_TIER_DOCUMENTS_TOTAL_SIZE_MAX_BYTES,
    }
  }
  return {
    foldersMax: BASIC_TIER_DOCUMENTS_FOLDERS_MAX,
    filesMax: BASIC_TIER_DOCUMENTS_FILES_MAX,
    fileSizeMaxBytes: BASIC_TIER_DOCUMENTS_FILE_SIZE_MAX_BYTES,
    totalSizeMaxBytes: BASIC_TIER_DOCUMENTS_TOTAL_SIZE_MAX_BYTES,
  }
}

export function documentsPlanLimitsFromFeatures(
  features: DocumentQuotaFeatures | undefined | null,
): DocumentsPlanLimitsSnapshot | null {
  if (!features) return null
  return resolveDocumentsPlanLimits({ features, canAccess: true })
}

export type FolderCreatePlanBlock = 'subscription_loading' | 'folder_limit'

export function canCreateDocumentFolder(args: {
  limits: DocumentsPlanLimitsSnapshot
  currentFolderCount: number
}): boolean {
  if (args.limits.foldersMax <= 0) return true
  return args.currentFolderCount < args.limits.foldersMax
}

export function canUploadAtLeastOneDocumentFile(args: {
  limits: DocumentsPlanLimitsSnapshot
  currentFileCount: number
  currentTotalSizeBytes: number
}): boolean {
  if (args.limits.filesMax > 0 && args.currentFileCount >= args.limits.filesMax) {
    return false
  }
  if (
    args.limits.totalSizeMaxBytes > 0 &&
    args.currentTotalSizeBytes >= args.limits.totalSizeMaxBytes
  ) {
    return false
  }
  return true
}

export function checkFolderCreateAgainstPlan(args: {
  isSubscriptionLoading: boolean
  limits: DocumentsPlanLimitsSnapshot
  currentFolderCount: number
}): FolderCreatePlanBlock | null {
  if (args.isSubscriptionLoading) return 'subscription_loading'
  if (
    !canCreateDocumentFolder({
      limits: args.limits,
      currentFolderCount: args.currentFolderCount,
    })
  ) {
    return 'folder_limit'
  }
  return null
}

export function sumUploadedOriginalBytes(
  files: { originalSizeBytes?: number; sizeBytes?: number }[],
): number {
  return files.reduce((sum, file) => sum + (file.originalSizeBytes ?? file.sizeBytes ?? 0), 0)
}

export type FileUploadPlanBlock =
  | { kind: 'subscription_loading' }
  | { kind: 'file_limit'; max: number; current: number; adding: number }
  | { kind: 'file_size'; fileName: string; maxBytes: number }
  | { kind: 'total_storage'; maxBytes: number; usedBytes: number; addingBytes: number }

export function checkFileUploadsAgainstPlan(args: {
  isSubscriptionLoading: boolean
  limits: DocumentsPlanLimitsSnapshot
  currentFileCount: number
  currentTotalSizeBytes: number
  files: { name: string; size: number }[]
}): FileUploadPlanBlock | null {
  if (args.isSubscriptionLoading) return { kind: 'subscription_loading' }
  if (args.files.length === 0) return null
  if (
    !canUploadAtLeastOneDocumentFile({
      limits: args.limits,
      currentFileCount: args.currentFileCount,
      currentTotalSizeBytes: args.currentTotalSizeBytes,
    })
  ) {
    if (args.limits.filesMax > 0 && args.currentFileCount >= args.limits.filesMax) {
      return {
        kind: 'file_limit',
        max: args.limits.filesMax,
        current: args.currentFileCount,
        adding: args.files.length,
      }
    }
    return {
      kind: 'total_storage',
      maxBytes: args.limits.totalSizeMaxBytes,
      usedBytes: args.currentTotalSizeBytes,
      addingBytes: 0,
    }
  }
  let addingBytes = 0
  for (const file of args.files) {
    if (file.size > args.limits.fileSizeMaxBytes) {
      return { kind: 'file_size', fileName: file.name, maxBytes: args.limits.fileSizeMaxBytes }
    }
    addingBytes += file.size
  }
  const nextCount = args.currentFileCount + args.files.length
  if (nextCount > args.limits.filesMax) {
    return {
      kind: 'file_limit',
      max: args.limits.filesMax,
      current: args.currentFileCount,
      adding: args.files.length,
    }
  }
  if (
    args.limits.totalSizeMaxBytes > 0 &&
    args.currentTotalSizeBytes + addingBytes > args.limits.totalSizeMaxBytes
  ) {
    return {
      kind: 'total_storage',
      maxBytes: args.limits.totalSizeMaxBytes,
      usedBytes: args.currentTotalSizeBytes,
      addingBytes,
    }
  }
  return null
}
