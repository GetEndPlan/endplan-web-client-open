import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/shared/ui'
import type {
  DecryptedVaultAssetAttachment,
  DecryptedVaultDocumentFileForAssets,
} from '../../hooks/assets/use-vault-assets-page'
import type { VaultDocumentViewerState } from '../../hooks/documents/use-vault-document-viewer'
import { parseAssetAttachmentCellValue } from '../../model/asset-attachment-ref'
import {
  resolveAssetContactCellLabel,
  type AssetContactOption,
} from '../../model/asset-contact-ref'
import { VaultDocumentViewerModal } from '../documents/vault-document-viewer-modal'

type VaultAssetReadOnlyRow = {
  id?: string
  values?: Record<string, unknown>
}

export type VaultAssetReadOnlyCategory = {
  id?: string
  key: string
  name: string
  rows: VaultAssetReadOnlyRow[]
}

type VaultAssetsReadOnlyTableProps = {
  categories: VaultAssetReadOnlyCategory[]
  emptyStateMessage: string
  emptyCategoryMessage: string
  getRowCountLabel: (count: number) => string
  attachmentFieldKeysByCategory?: Record<string, Set<string>>
  /** Column keys (from schema) whose cell values should be shown masked in read-only tables. */
  passwordFieldKeysByCategory?: Record<string, Set<string>>
  contactFieldKeysByCategory?: Record<string, Set<string>>
  contactsById?: Record<string, AssetContactOption>
  attachmentsById?: Record<string, DecryptedVaultAssetAttachment>
  linkedDocumentsById?: Record<string, DecryptedVaultDocumentFileForAssets>
  onDownloadAttachment?: (attachment: DecryptedVaultAssetAttachment) => void
  onDownloadLinkedDocument?: (document: DecryptedVaultDocumentFileForAssets) => void
  onViewLinkedDocument?: (document: DecryptedVaultDocumentFileForAssets) => void | Promise<boolean>
  onViewAttachment?: (attachment: DecryptedVaultAssetAttachment) => void | Promise<boolean>
  documentViewer?: VaultDocumentViewerState
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

function formatLabel(raw: string): string {
  return raw
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getAssetColumns(rows: VaultAssetReadOnlyRow[]): string[] {
  const columns: string[] = []
  for (const row of rows) {
    const values = row.values ?? {}
    for (const key of Object.keys(values)) {
      if (!columns.includes(key)) {
        columns.push(key)
      }
    }
  }
  return columns
}

export function VaultAssetsReadOnlyTable({
  categories,
  emptyStateMessage,
  emptyCategoryMessage,
  getRowCountLabel,
  attachmentFieldKeysByCategory = {},
  passwordFieldKeysByCategory = {},
  contactFieldKeysByCategory = {},
  contactsById = {},
  attachmentsById = {},
  linkedDocumentsById = {},
  onDownloadAttachment,
  onDownloadLinkedDocument,
  onViewLinkedDocument,
  onViewAttachment,
  documentViewer,
}: VaultAssetsReadOnlyTableProps) {
  const { t } = useTranslation()
  const [passwordRevealByCell, setPasswordRevealByCell] = useState<Record<string, boolean>>({})

  if (categories.length === 0) {
    return (
      <Card className="p-5">
        <p className="typo-body-sm italic text-slate-500 dark:text-slate-400">
          {emptyStateMessage}
        </p>
      </Card>
    )
  }

  return (
    <>
    <div className="space-y-8">
      {categories.map((category) => {
        const columns = getAssetColumns(category.rows)
        const attachmentFieldKeys =
          (category.id ? attachmentFieldKeysByCategory[category.id] : undefined) ??
          attachmentFieldKeysByCategory[category.key] ??
          new Set<string>()
        const passwordFieldKeys =
          (category.id ? passwordFieldKeysByCategory[category.id] : undefined) ??
          passwordFieldKeysByCategory[category.key] ??
          new Set<string>()
        const contactFieldKeys =
          (category.id ? contactFieldKeysByCategory[category.id] : undefined) ??
          contactFieldKeysByCategory[category.key] ??
          new Set<string>()

        return (
          <Card key={category.key} className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="typo-heading-card text-slate-900 dark:text-slate-100">
                {category.name}
              </h3>
              <span className="typo-caption text-slate-500 dark:text-slate-400">
                {getRowCountLabel(category.rows.length)}
              </span>
            </div>

            {category.rows.length === 0 ? (
              <p className="typo-body-sm italic text-slate-500 dark:text-slate-400">
                {emptyCategoryMessage}
              </p>
            ) : (
              <div className="ep-data-table-wrap">
                <table className="w-full min-w-[680px] bg-white dark:bg-ep-surface-panel">
                  <thead className="ep-data-table-head">
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={`${category.key}-${column}`}
                          className="border-b border-r first:border-l border-slate-200 px-3 py-2 text-left typo-caption-strong text-slate-600 dark:border-ep-border-card dark:text-slate-300"
                        >
                          {formatLabel(column)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {category.rows.map((row, rowIndex) => (
                      <tr key={String(row.id ?? `${category.key}-row-${rowIndex}`)} className="align-top">
                        {columns.map((column) => (
                          <td
                            key={`${String(row.id ?? `${category.key}-row-${rowIndex}`)}-${column}`}
                            className="break-words whitespace-pre-wrap border-b border-r first:border-l border-slate-200 px-3 py-2 typo-body-sm text-slate-700 dark:border-ep-border-card dark:text-slate-200"
                          >
                            {attachmentFieldKeys.has(column) && typeof row.values?.[column] === 'string' ? (
                              (() => {
                                const parsed = parseAssetAttachmentCellValue(row.values?.[column] as string)
                                if (parsed.kind === 'empty') return '—'

                                if (parsed.kind === 'asset_attachment') {
                                  const attachment = attachmentsById[parsed.attachmentId]
                                  if (!attachment) return t('vault.assets.attachments.unavailableLabel')
                                  return (
                                    <div className="flex min-w-0 items-center gap-2">
                                      {onDownloadAttachment ? (
                                        <button
                                          type="button"
                                          onClick={() => onDownloadAttachment(attachment)}
                                          className="min-w-0 truncate text-left typo-body-sm-emphasis text-slate-700 transition hover:text-ep-primary dark:text-slate-100 dark:hover:text-ep-primary-muted"
                                        >
                                          {attachment.name}
                                        </button>
                                      ) : (
                                        <span className="min-w-0 truncate typo-body-sm text-slate-700 dark:text-slate-100">
                                          {attachment.name}
                                        </span>
                                      )}
                                      {onViewAttachment ? (
                                        <button
                                          type="button"
                                          onClick={() => void onViewAttachment(attachment)}
                                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-ep-primary-dark/40 dark:hover:text-slate-100"
                                          aria-label={t('common.view')}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </button>
                                      ) : null}
                                    </div>
                                  )
                                }

                                const linkedDocument = linkedDocumentsById[parsed.reference.fileId]
                                const linkedName =
                                  linkedDocument?.name ??
                                  parsed.reference.fileName ??
                                  t('vault.assets.attachments.unavailableLabel')
                                return (
                                  <div className="flex min-w-0 items-center gap-2">
                                    {linkedDocument && onDownloadLinkedDocument ? (
                                      <button
                                        type="button"
                                        onClick={() => onDownloadLinkedDocument(linkedDocument)}
                                        className="min-w-0 truncate text-left typo-body-sm-emphasis text-slate-700 transition hover:text-ep-primary dark:text-slate-100 dark:hover:text-ep-primary-muted"
                                      >
                                        {linkedName}
                                      </button>
                                    ) : (
                                      <span className="min-w-0 truncate typo-body-sm text-slate-700 dark:text-slate-100">
                                        {linkedName}
                                      </span>
                                    )}
                                    {linkedDocument && onViewLinkedDocument ? (
                                      <button
                                        type="button"
                                        onClick={() => void onViewLinkedDocument(linkedDocument)}
                                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-ep-primary-dark/40 dark:hover:text-slate-100"
                                        aria-label={t('common.view')}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                    ) : null}
                                  </div>
                                )
                              })()
                            ) : contactFieldKeys.has(column) && typeof row.values?.[column] === 'string' ? (
                              (() => {
                                const raw = row.values?.[column] as string
                                if (!raw.trim()) return '—'
                                return (
                                  resolveAssetContactCellLabel(raw, contactsById) ??
                                  t('vault.assets.contacts.unavailableLabel')
                                )
                              })()
                            ) : passwordFieldKeys.has(column) &&
                              String(toDisplayValue(row.values?.[column])).trim() !== '' ? (
                              (() => {
                                const rowKey = String(row.id ?? `${category.key}-row-${rowIndex}`)
                                const passwordCellKey = `${category.id ?? category.key}:${rowKey}:${column}`
                                const passwordVisible = Boolean(passwordRevealByCell[passwordCellKey])
                                const passwordValue = toDisplayValue(row.values?.[column])

                                return (
                                  <div className="flex min-w-0 items-center gap-1">
                                    <input
                                      readOnly
                                      type={passwordVisible ? 'text' : 'password'}
                                      value={passwordValue}
                                      autoComplete="off"
                                      className="min-w-0 flex-1 border-0 bg-transparent p-0 typo-body-sm text-slate-700 outline-none dark:text-slate-200"
                                      aria-label={formatLabel(column)}
                                    />
                                    <button
                                      type="button"
                                      className="inline-flex shrink-0 rounded-md p-1 text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-ep-primary-dark/40 dark:hover:text-slate-100"
                                      aria-label={
                                        passwordVisible
                                          ? t('vault.assets.passwordField.hidePasswordAria')
                                          : t('vault.assets.passwordField.showPasswordAria')
                                      }
                                      aria-pressed={passwordVisible}
                                      onClick={() =>
                                        setPasswordRevealByCell((prev) => ({
                                          ...prev,
                                          [passwordCellKey]: !prev[passwordCellKey],
                                        }))
                                      }
                                    >
                                      {passwordVisible ? (
                                        <EyeOff className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                                      ) : (
                                        <Eye className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                                      )}
                                    </button>
                                  </div>
                                )
                              })()
                            ) : (
                              toDisplayValue(row.values?.[column]) || '—'
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )
      })}
    </div>
    {documentViewer ? (
      <VaultDocumentViewerModal
        isOpen={documentViewer.isOpen}
        file={documentViewer.file}
        blob={documentViewer.blob}
        isLoading={documentViewer.isLoading}
        isDownloadOnly={documentViewer.isDownloadOnly}
        error={documentViewer.error}
        onClose={documentViewer.onClose}
        onDownload={documentViewer.onDownload}
      />
    ) : null}
    </>
  )
}
