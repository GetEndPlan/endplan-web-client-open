import type { AssetSchemaCategory } from '../../api/clients/vault-api'
import type {
  DecryptedVaultAssetAttachment,
  DecryptedVaultDocumentFileForAssets,
} from '../../hooks/assets/use-vault-assets-page'
import { parseAssetAttachmentCellValue } from '../../model/asset-attachment-ref'
import { cn } from '@/shared/lib/cn'

export function normalizeVaultAssetFieldKey(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
  return normalized
}

/**
 * Restrict raw input to a money-style decimal: digits with at most one decimal
 * point and up to two fractional digits. Allows partial input (e.g. "12.") while typing.
 */
export function sanitizeMoneyInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  if (!cleaned) return ''

  const firstDot = cleaned.indexOf('.')
  if (firstDot === -1) {
    return cleaned
  }

  let intPart = cleaned.slice(0, firstDot)
  const decPart = cleaned.slice(firstDot + 1).replace(/\./g, '').slice(0, 2)

  if (intPart === '') {
    intPart = '0'
  }

  if (decPart.length === 0 && cleaned.endsWith('.')) {
    return `${intPart}.`
  }

  return decPart.length > 0 ? `${intPart}.${decPart}` : intPart
}

/** Normalize a money cell value when editing completes (blur / focus sync). */
export function finalizeMoneyValue(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  const sanitized = sanitizeMoneyInput(trimmed)
  if (!sanitized || sanitized === '.') return ''

  return sanitized.endsWith('.') ? sanitized.slice(0, -1) : sanitized
}

/** Current column heading for placeholders: live draft while renaming, otherwise the saved label. */
export function resolveAssetFieldHeadingLabel(
  fieldId: string,
  fieldLabel: string,
  editingFieldId: string | null,
  editingFieldLabel: string,
): string {
  if (editingFieldId === fieldId) {
    const draft = editingFieldLabel.trim()
    if (draft) return draft
  }
  return fieldLabel.trim()
}

export function makeUniqueVaultAssetFieldKey(base: string, existingKeys: Set<string>): string {
  if (!existingKeys.has(base)) {
    return base
  }
  for (let i = 2; ; i += 1) {
    const candidate = `${base}_${i}`
    if (!existingKeys.has(candidate)) {
      return candidate
    }
  }
}

/** Narrow actions column: no cell borders so it reads as floating beside the grid */
export const ASSETS_FLOAT_ACTIONS_TH =
  'w-11 min-w-[2.75rem] border-0 bg-transparent p-1 align-middle text-center shadow-none dark:bg-transparent'
export const ASSETS_FLOAT_ACTIONS_TD =
  'w-11 min-w-[2.75rem] border-0 bg-transparent p-1 align-middle text-center shadow-none dark:bg-transparent'

/** Row/column delete controls: always visible on touch; hidden on desktop until row/header hover or focus. */
export const assetsTableDeleteActionClassName =
  'opacity-100 pointer-events-auto max-lg:opacity-100 max-lg:pointer-events-auto lg:opacity-0 lg:pointer-events-none lg:transition-opacity lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto'

export function assetsTableHeaderCellClass(fieldIndex: number, fieldCount: number) {
  return cn(
    'border-b border-slate-200 px-3 py-2 text-left first:border-l dark:border-ep-border-card typo-caption-strong text-slate-600 dark:text-slate-300',
    fieldIndex < fieldCount - 1 && 'border-r border-slate-200 dark:border-ep-border-card',
  )
}

export function assetsTableBodyDataCellClass(fieldIndex: number, fieldCount: number) {
  return cn(
    'border-b border-slate-200 p-2 first:border-l dark:border-ep-border-card',
    fieldIndex < fieldCount - 1 && 'border-r border-slate-200 dark:border-ep-border-card',
  )
}

export function sortVaultCategoryFields(category: AssetSchemaCategory) {
  return [...(category.fields ?? [])].sort((a, b) => {
    if (a.displayOrder === b.displayOrder) return a.label.localeCompare(b.label)
    return a.displayOrder - b.displayOrder
  })
}

export function mapAttachmentOrLinkedDocToDrawerModel(
  attachment: DecryptedVaultAssetAttachment | null,
  linkedDocument: DecryptedVaultDocumentFileForAssets | null,
): {
  id: string
  name: string
  mimeType?: string | null
  originalSizeBytes: number
  uploadedAt?: string | null
} | null {
  if (attachment) {
    return {
      id: attachment.id,
      name: attachment.name,
      mimeType: attachment.mimeType,
      originalSizeBytes: attachment.originalSizeBytes,
      uploadedAt: attachment.uploadedAt,
    }
  }
  if (linkedDocument) {
    return {
      id: linkedDocument.id,
      name: linkedDocument.name,
      mimeType: linkedDocument.mimeType,
      originalSizeBytes: linkedDocument.originalSizeBytes,
      uploadedAt: linkedDocument.uploadedAt,
    }
  }
  return null
}

export function openVaultAssetAttachmentView(args: {
  value: string
  attachmentsById: Record<string, DecryptedVaultAssetAttachment>
  documentsFilesById: Record<string, DecryptedVaultDocumentFileForAssets>
  onViewLinkedDocument: (file: DecryptedVaultDocumentFileForAssets) => void | Promise<boolean>
  onViewAttachment: (attachment: DecryptedVaultAssetAttachment) => void | Promise<boolean>
}) {
  const parsed = parseAssetAttachmentCellValue(args.value)
  if (parsed.kind === 'document_link') {
    const linkedDocument = args.documentsFilesById[parsed.reference.fileId]
    if (linkedDocument) {
      void args.onViewLinkedDocument(linkedDocument)
    }
    return
  }
  if (parsed.kind === 'asset_attachment') {
    const attachment = args.attachmentsById[parsed.attachmentId]
    if (attachment) {
      void args.onViewAttachment(attachment)
    }
  }
}
