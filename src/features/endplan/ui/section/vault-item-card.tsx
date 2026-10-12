import { Card, Button } from '@/shared/ui'
import { Pencil } from 'lucide-react'
import type { SectionItem, AssetItem, DocumentItem } from '../../model/vault-section-types'
import { SECTION_ID, ASSET_TYPES, DOCUMENT_TYPES } from '../../model/vault-section-types'

function formatLabel(raw: string): string {
  return raw
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function toDisplayValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map((entry) => toDisplayValue(entry)).join(', ')
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return ''
    }
  }
  return String(value)
}

type VaultItemCardProps = {
  item: SectionItem
  /** Supports legacy section type strings from older vaults */
  sectionType: string
  onEdit?: (item: SectionItem) => void
}

export function VaultItemCard({ item, sectionType, onEdit }: VaultItemCardProps) {
  const record = item as Record<string, unknown>

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {sectionType === SECTION_ID.ASSETS && (
            <div>
              <p className="typo-emphasis text-slate-900 dark:text-slate-100">{(item as AssetItem).assetName}</p>
              <p className="typo-body-sm text-slate-500 dark:text-slate-400">
                {ASSET_TYPES.find((o) => o.value === (item as AssetItem).assetType)?.label ?? (item as AssetItem).assetType}
                {(item as AssetItem).institution ? ` · ${(item as AssetItem).institution}` : ''}
              </p>
              {(item as AssetItem).accountOrPolicyNumber && (
                <p className="typo-caption text-slate-400 dark:text-slate-500 mt-1">{(item as AssetItem).accountOrPolicyNumber}</p>
              )}
              {(item as AssetItem).notes && (
                <p className="typo-body-sm text-slate-600 dark:text-slate-300 mt-2">{(item as AssetItem).notes}</p>
              )}
            </div>
          )}
          {sectionType === SECTION_ID.DOCUMENTS && (
            <div>
              <p className="typo-emphasis text-slate-900 dark:text-slate-100">{(item as DocumentItem).documentName}</p>
              <p className="typo-body-sm text-slate-500 dark:text-slate-400">
                {DOCUMENT_TYPES.find((o) => o.value === (item as DocumentItem).documentType)?.label ??
                  (item as DocumentItem).documentType}
                {(item as DocumentItem).location ? ` · ${(item as DocumentItem).location}` : ''}
              </p>
              {(item as DocumentItem).referenceNumber && (
                <p className="typo-caption text-slate-400 dark:text-slate-500 mt-1">{(item as DocumentItem).referenceNumber}</p>
              )}
              {(item as DocumentItem).notes && (
                <p className="typo-body-sm text-slate-600 dark:text-slate-300 mt-2">{(item as DocumentItem).notes}</p>
              )}
            </div>
          )}
          {sectionType !== SECTION_ID.ASSETS && sectionType !== SECTION_ID.DOCUMENTS && (
            <div className="space-y-1.5">
              {Object.entries(record).map(([key, value]) => (
                <p key={key} className="typo-body-sm text-slate-700 dark:text-slate-200">
                  <span className="typo-caption-strong mr-2 text-slate-500 dark:text-slate-400">{formatLabel(key)}:</span>
                  {toDisplayValue(value) || '—'}
                </p>
              ))}
            </div>
          )}
        </div>
        {onEdit ? (
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            onClick={() => onEdit(item)}
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
