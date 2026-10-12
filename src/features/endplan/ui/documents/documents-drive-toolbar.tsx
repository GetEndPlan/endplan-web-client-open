import { Download, Eye, Grid3x3, List, Search, Trash2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import type { DocumentsDriveViewMode } from '../../model/vault-documents-tree'

export type { DocumentsDriveViewMode }

export type DocumentsDriveToolbarSelection = {
  /** Total visible rows (folders + files) in the current drive view. */
  selectableCount: number
  allSelected: boolean
  someSelected: boolean
  selectedCount: number
  /** True when at least one file is selected (enables download). */
  hasSelectedFiles: boolean
  /** View single file: no folders selected and exactly one file. */
  canViewSingleFile: boolean
  onToggleSelectAll: () => void
  onDownload: () => void
  onView: () => void
  onDelete: () => void
}

type DocumentsDriveToolbarProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
  sortCreatedDesc: boolean
  onToggleSortOrder: () => void
  viewMode: DocumentsDriveViewMode
  onViewModeChange: (mode: DocumentsDriveViewMode) => void
  disabled?: boolean
  canDelete?: boolean
  /** Bulk selection + actions in the same bar as sort (Design Document Page UI). */
  selection?: DocumentsDriveToolbarSelection | null
}

const checkboxClassName =
  'h-4 w-4 cursor-pointer rounded border-slate-300 text-ep-primary focus:ring-ep-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-ep-border-card dark:bg-ep-surface-subtle dark:text-ep-primary-accent'

const iconActionClassName =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-ep-border-card dark:bg-ep-surface-subtle dark:text-slate-100 dark:hover:bg-ep-primary-dark/50'

/** Select-all + sort on the left; when items are selected, sort is replaced by “N selected” and the right shows icon actions only (grid/search hidden). */
export function DocumentsDriveToolbar({
  searchQuery,
  onSearchChange,
  sortCreatedDesc,
  onToggleSortOrder,
  viewMode,
  onViewModeChange,
  disabled = false,
  canDelete = false,
  selection = null,
}: DocumentsDriveToolbarProps) {
  const { t } = useTranslation()
  const selectAllRef = useRef<HTMLInputElement | null>(null)

  const showSelectAll = selection != null && selection.selectableCount > 0
  const showSelectionActions = selection != null && selection.selectedCount > 0

  useEffect(() => {
    const el = selectAllRef.current
    if (!el || !showSelectAll || !selection) return
    el.indeterminate = selection.someSelected
  }, [selection, showSelectAll])

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-[10px] border border-slate-200 bg-white px-4 py-3 dark:border-ep-border-card dark:bg-ep-surface-subtle lg:flex-row lg:items-center lg:justify-between">
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {showSelectAll && selection ? (
          <div className="flex shrink-0 items-center gap-2">
            <span className="sr-only">{t('vault.documentsManager.selectionSelectAllLabel')}</span>
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={selection.allSelected}
              disabled={disabled}
              className={checkboxClassName}
              aria-label={t('vault.documentsManager.selectionSelectAllLabel')}
              onChange={() => selection.onToggleSelectAll()}
            />
          </div>
        ) : null}

        {showSelectionActions && selection ? (
          <p className="typo-body-sm-strong min-w-0 text-slate-900 dark:text-slate-100">
            {t('vault.documentsManager.driveToolbarSelectedShort', { count: selection.selectedCount })}
          </p>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={onToggleSortOrder}
            className="typo-body-sm-strong inline-flex h-9 items-center gap-1.5 rounded-md border-0 bg-transparent px-2 py-1 text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-100 dark:hover:bg-ep-primary-dark/50"
          >
            <span>{t('vault.documentsManager.driveSortCreated')}</span>
            <span className="text-slate-500 dark:text-slate-400" aria-hidden>
              {sortCreatedDesc ? '↓' : '↑'}
            </span>
          </button>
        )}
      </div>

      <div className="flex min-w-0 w-full flex-wrap items-center justify-end gap-3 lg:w-auto lg:flex-nowrap">
        {showSelectionActions && selection ? (
          <div
            className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3"
            role="toolbar"
            aria-label={t('vault.documentsManager.selectionToolbarRegion')}
          >
            <button
              type="button"
              disabled={disabled || !selection.hasSelectedFiles}
              title={t('vault.documentsManager.download')}
              aria-label={t('vault.documentsManager.download')}
              onClick={() => void selection.onDownload()}
              className={iconActionClassName}
            >
              <Download className="h-[18px] w-[18px]" aria-hidden />
            </button>
            <button
              type="button"
              disabled={disabled || !selection.canViewSingleFile}
              title={
                selection.canViewSingleFile
                  ? t('vault.documentsManager.selectionToolbarView')
                  : t('vault.documentsManager.selectionToolbarViewSingleHint')
              }
              aria-label={t('vault.documentsManager.selectionToolbarView')}
              onClick={() => void selection.onView()}
              className={iconActionClassName}
            >
              <Eye className="h-[18px] w-[18px]" aria-hidden />
            </button>
            {canDelete ? (
              <button
                type="button"
                disabled={disabled}
                title={t('vault.documentsManager.selectionToolbarDelete')}
                aria-label={t('vault.documentsManager.selectionToolbarDelete')}
                onClick={selection.onDelete}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-red-200 bg-white text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/60 dark:bg-ep-surface-subtle dark:text-red-300 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-[18px] w-[18px]" aria-hidden />
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="inline-flex shrink-0 rounded-md border border-slate-200 bg-white p-0.5 dark:border-ep-border-card dark:bg-ep-surface">
              <button
                type="button"
                disabled={disabled}
                title={t('vault.documentsManager.driveViewGrid')}
                aria-label={t('vault.documentsManager.driveViewGrid')}
                aria-pressed={viewMode === 'grid'}
                onClick={() => onViewModeChange('grid')}
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-md transition disabled:opacity-50',
                  viewMode === 'grid'
                    ? 'bg-slate-100 text-ep-primary dark:bg-ep-primary/20 dark:text-ep-primary-muted'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-ep-primary-dark/50 dark:hover:text-slate-100',
                )}
              >
                <Grid3x3 className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                disabled={disabled}
                title={t('vault.documentsManager.driveViewList')}
                aria-label={t('vault.documentsManager.driveViewList')}
                aria-pressed={viewMode === 'list'}
                onClick={() => onViewModeChange('list')}
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-md transition disabled:opacity-50',
                  viewMode === 'list'
                    ? 'bg-slate-100 text-ep-primary dark:bg-ep-primary/20 dark:text-ep-primary-muted'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-ep-primary-dark/50 dark:hover:text-slate-100',
                )}
              >
                <List className="h-[18px] w-[18px]" />
              </button>
            </div>

            <div className="relative min-w-0 flex-1 lg:max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                disabled={disabled}
                placeholder={t('vault.documentsManager.driveSearchPlaceholder')}
                className="ep-input-field h-9 py-2 pl-9 pr-3 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
