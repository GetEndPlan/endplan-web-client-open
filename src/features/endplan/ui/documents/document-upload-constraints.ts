import { formatPlanStorageBytes } from '@/features/billing'
import { formatAllowedDocumentTypeLabels } from '../../model/document-upload-policy'

export function documentUploadConstraintParams(maxFileSizeBytes: number): {
  types: string
  size: string
} {
  return {
    types: formatAllowedDocumentTypeLabels(),
    size: formatPlanStorageBytes(maxFileSizeBytes),
  }
}
