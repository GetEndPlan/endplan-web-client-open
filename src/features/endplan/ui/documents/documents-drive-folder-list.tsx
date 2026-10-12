import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import type { DecryptedVaultDocumentFolder } from '../../hooks/documents/use-vault-documents-page'
import { type DocumentsActionMenuItem, DocumentsActionMenu } from './documents-action-menu'
import { DriveFolderIconGrid } from './documents-drive-icons'
import { DocumentsDriveListTable, type DocumentsDriveSelection } from './documents-drive-list-table'

export type DocumentsDriveFolderLayout = 'list' | 'grid'

type DocumentsDriveFolderListProps = {
  folders: DecryptedVaultDocumentFolder[]
  itemCountByFolderId: Map<string, number>
  layout?: DocumentsDriveFolderLayout
  /** When true with a sibling file list, the parent supplies grid/stack layout; this list uses `display: contents`. */
  mergeWithSibling?: boolean
  canWrite: boolean
  isBusy: boolean
  onOpenFolder: (folderId: string) => void
  buildFolderMenuItems: (folder: DecryptedVaultDocumentFolder) => DocumentsActionMenuItem[]
  folderActionsLabel: string
  driveSelection?: DocumentsDriveSelection | null
}

export function DocumentsDriveFolderList({
  folders,
  itemCountByFolderId,
  layout = 'list',
  mergeWithSibling = false,
  canWrite,
  isBusy,
  onOpenFolder,
  buildFolderMenuItems,
  folderActionsLabel,
  driveSelection = null,
}: DocumentsDriveFolderListProps) {
  const { t } = useTranslation()

  if (folders.length === 0) return null

  if (layout === 'list' && !mergeWithSibling) {
    return (
      <DocumentsDriveListTable
        folders={folders}
        files={[]}
        canWrite={canWrite}
        onOpenFolder={onOpenFolder}
        buildFolderMenuItems={buildFolderMenuItems}
        buildFileMenuItems={() => []}
        folderActionsLabel={folderActionsLabel}
        fileActionsLabel={t('vault.documentsManager.documentActions')}
        driveSelection={driveSelection}
      />
    )
  }

  /** Matches Design `.document-grid`: gap 16px, min track 160px */
  const gridClass =
    'grid grid-cols-2 justify-start gap-4 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(160px,160px))]'

  if (layout === 'grid') {
    return (
      <ul className={mergeWithSibling ? 'contents' : gridClass}>
        {folders.map((folder) => {
          const count = itemCountByFolderId.get(folder.id) ?? 0
          const menuItems = buildFolderMenuItems(folder)
          const showMenu = canWrite && menuItems.length > 0
          const checked = driveSelection != null && driveSelection.selectedFolderIds.has(folder.id)

          return (
            <li key={folder.id} className="flex min-w-0 self-stretch">
              <div
                className={cn(
                  'group relative flex h-full w-full cursor-default flex-col items-center rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-ep-border-card dark:bg-ep-surface-subtle dark:hover:border-ep-primary/40',
                )}
              >
                {driveSelection ? (
                  <div
                    className={cn(
                      'absolute left-3 top-3 z-20 transition-opacity',
                      checked
                        ? 'opacity-100'
                        : 'opacity-0 focus-within:opacity-100 group-hover:opacity-100',
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => driveSelection.onToggleFolder(folder.id)}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-ep-primary focus:ring-ep-primary dark:border-ep-border-card dark:bg-ep-surface dark:text-ep-primary-accent"
                      aria-label={t('vault.documentsManager.selectionRowCheckbox', { name: folder.name })}
                    />
                  </div>
                ) : null}
                {showMenu ? (
                  <div className="absolute right-3 top-3 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <DocumentsActionMenu
                      label={folderActionsLabel}
                      items={menuItems}
                      tone="drive"
                      align="right"
                      menuPlacement="right"
                    />
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onOpenFolder(folder.id)}
                  className="flex h-full min-h-0 w-full flex-1 flex-col items-center text-center disabled:opacity-50"
                >
                  <div className="mb-3 flex h-16 w-16 shrink-0 items-center justify-center">
                    <DriveFolderIconGrid />
                  </div>
                  <div className="w-full min-w-0 px-0">
                    <p className="typo-emphasis truncate text-center text-[13px] leading-[1.3] text-gray-900 dark:text-gray-100">
                      {folder.name}
                    </p>
                    <p className="mt-0.5 truncate text-center text-[11px] leading-[1.3] text-gray-400 dark:text-slate-500">
                      {t('vault.documentsManager.entryCount', { count })}
                    </p>
                  </div>
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  return null
}
