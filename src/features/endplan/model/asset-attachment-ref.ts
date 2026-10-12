import type { AssetSchemaCategory } from '../api/clients/vault-api'
import type { AssetSectionPayloadV2 } from './asset-table-model'

export const ASSET_ATTACHMENT_FIELD_TYPE = 'attachment' as const
export const ASSET_PASSWORD_FIELD_TYPE = 'password' as const
export const ASSET_DOCUMENT_LINK_KIND = 'vault_document_link' as const
const ASSET_DOCUMENT_LINK_VERSION = 1 as const

export type AssetDocumentLinkRef = {
  kind: typeof ASSET_DOCUMENT_LINK_KIND
  v: typeof ASSET_DOCUMENT_LINK_VERSION
  fileId: string
  fileName?: string | null
  folderId?: string | null
}

export type ParsedAssetAttachmentCellValue =
  | { kind: 'empty' }
  | { kind: 'asset_attachment'; attachmentId: string }
  | { kind: 'document_link'; reference: AssetDocumentLinkRef }

export function getAttachmentFieldKeysByCategory(
  categories: AssetSchemaCategory[],
): Record<string, Set<string>> {
  return Object.fromEntries(
    categories.map((category) => [
      category.id,
      new Set(
        (category.fields ?? [])
          .filter((field) => field.fieldType === ASSET_ATTACHMENT_FIELD_TYPE)
          .map((field) => field.key),
      ),
    ]),
  )
}

export function getPasswordFieldKeysByCategory(
  categories: AssetSchemaCategory[],
): Record<string, Set<string>> {
  return Object.fromEntries(
    categories.map((category) => [
      category.id,
      new Set(
        (category.fields ?? [])
          .filter((field) => field.fieldType === ASSET_PASSWORD_FIELD_TYPE)
          .map((field) => field.key),
      ),
    ]),
  )
}

function parseDocumentLinkRef(rawValue: string): AssetDocumentLinkRef | null {
  const trimmed = rawValue.trim()
  if (!trimmed.startsWith('{')) return null

  try {
    const parsed = JSON.parse(trimmed) as Partial<AssetDocumentLinkRef>
    if (parsed.kind !== ASSET_DOCUMENT_LINK_KIND) return null
    if (parsed.v !== ASSET_DOCUMENT_LINK_VERSION) return null
    if (typeof parsed.fileId !== 'string' || parsed.fileId.trim() === '') return null
    if (parsed.fileName != null && typeof parsed.fileName !== 'string') return null
    if (parsed.folderId != null && typeof parsed.folderId !== 'string') return null
    return {
      kind: ASSET_DOCUMENT_LINK_KIND,
      v: ASSET_DOCUMENT_LINK_VERSION,
      fileId: parsed.fileId,
      fileName: parsed.fileName ?? null,
      folderId: parsed.folderId ?? null,
    }
  } catch {
    return null
  }
}

export function parseAssetAttachmentCellValue(rawValue: string): ParsedAssetAttachmentCellValue {
  const trimmed = rawValue.trim()
  if (!trimmed) {
    return { kind: 'empty' }
  }

  const documentLink = parseDocumentLinkRef(trimmed)
  if (documentLink) {
    return { kind: 'document_link', reference: documentLink }
  }

  return {
    kind: 'asset_attachment',
    attachmentId: trimmed,
  }
}

export function serializeDocumentLinkRef(input: {
  fileId: string
  fileName?: string | null
  folderId?: string | null
}): string {
  return JSON.stringify({
    kind: ASSET_DOCUMENT_LINK_KIND,
    v: ASSET_DOCUMENT_LINK_VERSION,
    fileId: input.fileId,
    fileName: input.fileName ?? null,
    folderId: input.folderId ?? null,
  } satisfies AssetDocumentLinkRef)
}

export function collectAttachmentIdsFromPayload(
  payload: AssetSectionPayloadV2,
  attachmentFieldKeysByCategory: Record<string, Set<string>>,
): Set<string> {
  const ids = new Set<string>()
  for (const category of payload.categories) {
    const fieldKeys = attachmentFieldKeysByCategory[category.categoryTemplateId]
    if (!fieldKeys || fieldKeys.size === 0) continue
    for (const row of category.rows) {
      for (const [fieldKey, value] of Object.entries(row.values)) {
        if (!fieldKeys.has(fieldKey)) continue
        const parsed = parseAssetAttachmentCellValue(value)
        if (parsed.kind === 'asset_attachment') {
          ids.add(parsed.attachmentId)
        }
      }
    }
  }
  return ids
}

export function collectKnownAttachmentIdsFromPayload(
  payload: AssetSectionPayloadV2,
  knownAttachmentIds: Set<string>,
): Set<string> {
  const ids = new Set<string>()
  for (const category of payload.categories) {
    for (const row of category.rows) {
      for (const value of Object.values(row.values)) {
        const parsed = parseAssetAttachmentCellValue(value)
        if (parsed.kind === 'asset_attachment' && knownAttachmentIds.has(parsed.attachmentId)) {
          ids.add(parsed.attachmentId)
        }
      }
    }
  }
  return ids
}
