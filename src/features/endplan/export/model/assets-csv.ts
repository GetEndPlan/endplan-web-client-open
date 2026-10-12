import type { AssetSchemaCategory } from '../../api/clients/vault-api'
import { parseAssetAttachmentCellValue } from '../../model/asset-attachment-ref'
import {
  resolveAssetContactCellLabel,
  type AssetContactOption,
} from '../../model/asset-contact-ref'
import { assetRowHasUserInput, type AssetSectionPayloadV2 } from '../../model/asset-table-model'
import { toCsvDocument } from './csv'
import { joinZipPath, sanitizeZipSegment, uniqueZipPath } from './zip-path'

export type AssetCsvFile = {
  relativePath: string
  csv: string
}

function formatAssetCellValue(args: {
  fieldType: string
  rawValue: string
  contactsById: Record<string, AssetContactOption>
  attachmentNamesById: Record<string, string>
  documentNamesById: Record<string, string>
}): string {
  const trimmed = args.rawValue.trim()
  if (!trimmed) return ''

  if (args.fieldType === 'contact') {
    return resolveAssetContactCellLabel(trimmed, args.contactsById) ?? ''
  }

  if (args.fieldType === 'attachment') {
    const parsed = parseAssetAttachmentCellValue(trimmed)
    if (parsed.kind === 'empty') return ''
    if (parsed.kind === 'document_link') {
      return (
        parsed.reference.fileName?.trim() ||
        args.documentNamesById[parsed.reference.fileId] ||
        ''
      )
    }
    return args.attachmentNamesById[parsed.attachmentId] ?? ''
  }

  return args.rawValue
}

export function buildAssetCsvFiles(args: {
  payload: AssetSectionPayloadV2
  categories: AssetSchemaCategory[]
  assetsFolderName: string
  untitledCategoryName: string
  contactsById: Record<string, AssetContactOption>
  attachmentNamesById: Record<string, string>
  documentNamesById: Record<string, string>
}): AssetCsvFile[] {
  const usedPaths = new Set<string>()
  const files: AssetCsvFile[] = []
  const categoriesById = new Map(args.categories.map((category) => [category.id, category]))

  for (const payloadCategory of args.payload.categories) {
    const schemaCategory = categoriesById.get(payloadCategory.categoryTemplateId)
    const rows = payloadCategory.rows.filter((row) => assetRowHasUserInput(row))
    if (rows.length === 0) continue

    const schemaFields = [...(schemaCategory?.fields ?? [])].sort(
      (left, right) => left.displayOrder - right.displayOrder,
    )
    const fields =
      schemaFields.length > 0
        ? schemaFields.map((field) => ({ key: field.key, label: field.label, fieldType: field.fieldType }))
        : [...new Set(rows.flatMap((row) => Object.keys(row.values)))].map((key) => ({
            key,
            label: key,
            fieldType: 'text',
          }))
    if (fields.length === 0) continue

    const headers = fields.map((field) => field.label)
    const csvRows = rows.map((row) =>
      fields.map((field) =>
        formatAssetCellValue({
          fieldType: field.fieldType,
          rawValue: row.values[field.key] ?? '',
          contactsById: args.contactsById,
          attachmentNamesById: args.attachmentNamesById,
          documentNamesById: args.documentNamesById,
        }),
      ),
    )

    const categoryName = sanitizeZipSegment(
      payloadCategory.categoryName?.trim() || schemaCategory?.name || '',
      args.untitledCategoryName,
    )
    const relativePath = uniqueZipPath(
      joinZipPath([args.assetsFolderName, `${categoryName}.csv`]),
      usedPaths,
    )

    files.push({
      relativePath,
      csv: toCsvDocument(headers, csvRows),
    })
  }

  return files
}
