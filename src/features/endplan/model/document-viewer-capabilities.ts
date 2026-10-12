import { resolveAllowedDocumentMimeType } from './document-upload-policy'

export type DocumentViewerCapability = 'inline' | 'download-only'

const OMNI_INLINE_MIME_TYPES = new Set<string>([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
  'application/csv',
  'text/plain',
])

function normalizeMimeType(mimeType: string): string {
  return mimeType.toLowerCase().split(';')[0].trim()
}

export function getDocumentViewerCapability(
  mimeType: string | null | undefined,
  fileName: string,
): DocumentViewerCapability {
  const resolvedMime =
    mimeType && mimeType.trim()
      ? normalizeMimeType(mimeType)
      : resolveAllowedDocumentMimeType({ name: fileName, type: '' })

  if (!resolvedMime || !OMNI_INLINE_MIME_TYPES.has(resolvedMime)) {
    return 'download-only'
  }

  return 'inline'
}

export function toViewerFile(blob: Blob, fileName: string, mimeType: string | null | undefined): File {
  const resolvedMime =
    mimeType && mimeType.trim()
      ? normalizeMimeType(mimeType)
      : resolveAllowedDocumentMimeType({ name: fileName, type: blob.type }) ?? blob.type

  return new File([blob], fileName, {
    type: resolvedMime || 'application/octet-stream',
  })
}
