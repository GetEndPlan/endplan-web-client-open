import { X } from 'lucide-react'
import { Card, ModalOverlay } from '@/shared/ui'
import type { TFunction } from 'i18next'
import type { VaultSectionResponse } from '@/features/endplan/api/clients/vault-api'
import { SECTION_ID } from '../../model/vault-section-types'

type SectionContent = {
    items?: Record<string, unknown>[]
    categories?: Array<{
        categoryTemplateId?: string
        rows?: Array<{ id?: string; values?: Record<string, unknown> }>
    }>
}
type DecryptedSection = { section: VaultSectionResponse; content: SectionContent | null }

// Label lookups (replicated from shared-vault page for now)
const ASSET_TYPES = [
    { value: 'bank_account', label: 'Bank account' },
    { value: 'investment_portfolio', label: 'Investment portfolio' },
    { value: 'insurance_policy', label: 'Insurance policy' },
    { value: 'property_deed', label: 'Property deed' },
    { value: 'other', label: 'Other' },
] as const
const DOCUMENT_TYPES = [
    { value: 'id_passport', label: 'ID / passport' },
    { value: 'birth_certificate', label: 'Birth certificate' },
    { value: 'marriage_certificate', label: 'Marriage certificate' },
    { value: 'other', label: 'Other' },
] as const

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

type SharedSectionDetailModalProps = {
    section: DecryptedSection
    onClose: () => void
    t: TFunction
}

function getAssetRows(content: SectionContent): Array<{ id: string; values: Record<string, unknown> }> {
    const rows: Array<{ id: string; values: Record<string, unknown> }> = []
    const categories = Array.isArray(content.categories) ? content.categories : []
    for (const category of categories) {
        const categoryRows = Array.isArray(category.rows) ? category.rows : []
        for (const row of categoryRows) {
            rows.push({
                id: String(row.id ?? crypto.randomUUID()),
                values: row.values ?? {},
            })
        }
    }
    return rows
}

export function SharedSectionDetailModal({ section, onClose, t }: SharedSectionDetailModalProps) {
    const assetRows = section.content ? getAssetRows(section.content) : []
    const hasLegacyItems = !!section.content && Array.isArray(section.content.items) && section.content.items.length > 0
    const hasAssetRows = assetRows.length > 0
    const isEmptyContent =
        !section.content ||
        (section.section.sectionType === SECTION_ID.ASSETS || section.section.sectionType === SECTION_ID.POLICIES
          ? (!hasAssetRows && !hasLegacyItems)
          : !hasLegacyItems)

    return (
        <ModalOverlay>
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                    <h2 className="typo-heading-card text-gray-900 dark:text-gray-100">
                        {t(`nav.${section.section.sectionType}`) || section.section.sectionName}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                    {!section.content ? (
                        <p className="text-amber-600 dark:text-amber-400">
                            {t('sharedVault.decryptFailed', 'Could not decrypt this section.')}
                        </p>
                    ) : isEmptyContent ? (
                        <p className="text-gray-500 italic">{t('sharedVault.emptySection', 'No items in this section.')}</p>
                    ) : (
                        <div className="space-y-3">
                            {(section.section.sectionType === SECTION_ID.ASSETS ||
                                section.section.sectionType === SECTION_ID.POLICIES) && hasAssetRows && (
                                <>
                                    {assetRows.map((row) => {
                                        const entries = Object.entries(row.values).filter(([, value]) => String(value ?? '').trim() !== '')
                                        const title =
                                            String(row.values.asset_name ?? '').trim() ||
                                            String(row.values.assetName ?? '').trim() ||
                                            'Asset'
                                        return (
                                            <Card key={row.id} className="p-4">
                                                <p className="typo-emphasis text-gray-900 dark:text-gray-100">{title}</p>
                                                {entries.length === 0 ? (
                                                    <p className="typo-body-sm text-gray-500 dark:text-gray-400 mt-1">No details</p>
                                                ) : (
                                                    <div className="mt-2 space-y-1">
                                                        {entries.map(([key, value]) => (
                                                            <p key={`${row.id}-${key}`} className="typo-body-sm text-gray-600 dark:text-gray-300">
                                                                <span className="typo-caption-strong text-gray-500 dark:text-gray-400 mr-2">
                                                                    {key.replaceAll('_', ' ')}:
                                                                </span>
                                                                {String(value)}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </Card>
                                        )
                                    })}
                                </>
                            )}

                            {(section.content.items ?? []).map((item: Record<string, unknown>, index: number) => (
                                <Card key={(item.id as string) || index} className="p-4">
                                    {section.section.sectionType === SECTION_ID.ASSETS && (
                                        <div>
                                            <p className="typo-emphasis text-gray-900 dark:text-gray-100">{String(item.assetName ?? '')}</p>
                                            <p className="typo-body-sm text-gray-500 dark:text-gray-400">
                                                {ASSET_TYPES.find((o) => o.value === item.assetType)?.label ?? String(item.assetType ?? '')}
                                                {item.institution ? ` · ${item.institution}` : ''}
                                            </p>
                                            {!!item.accountOrPolicyNumber && <p className="typo-caption text-gray-400 dark:text-gray-500 mt-1">{String(item.accountOrPolicyNumber)}</p>}
                                            {!!item.notes && <p className="typo-body-sm text-gray-600 dark:text-gray-300 mt-2">{String(item.notes)}</p>}
                                        </div>
                                    )}
                                    {section.section.sectionType === SECTION_ID.DOCUMENTS && (
                                        <div>
                                            <p className="typo-emphasis text-gray-900 dark:text-gray-100">{String(item.documentName ?? '')}</p>
                                            <p className="typo-body-sm text-gray-500 dark:text-gray-400">
                                                {DOCUMENT_TYPES.find((o) => o.value === item.documentType)?.label ?? String(item.documentType ?? '')}
                                                {item.location ? ` · ${item.location}` : ''}
                                            </p>
                                            {!!item.referenceNumber && <p className="typo-caption text-gray-400 dark:text-gray-500 mt-1">{String(item.referenceNumber)}</p>}
                                            {!!item.notes && <p className="typo-body-sm text-gray-600 dark:text-gray-300 mt-2">{String(item.notes)}</p>}
                                        </div>
                                    )}
                                    {section.section.sectionType !== SECTION_ID.ASSETS &&
                                        section.section.sectionType !== SECTION_ID.POLICIES &&
                                        section.section.sectionType !== SECTION_ID.DOCUMENTS && (
                                        <div className="space-y-1.5">
                                            {Object.entries(item).map(([key, value]) => (
                                                <p key={`${String(item.id ?? index)}-${key}`} className="typo-body-sm text-gray-700 dark:text-gray-200">
                                                    <span className="typo-caption-strong mr-2 text-gray-500 dark:text-gray-400">
                                                        {formatLabel(key)}:
                                                    </span>
                                                    {toDisplayValue(value) || '—'}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </ModalOverlay>
    )
}
