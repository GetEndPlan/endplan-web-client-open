import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import type {
  DecryptedVaultDocumentFile,
} from '../../hooks/documents/use-vault-documents-page'
import { DocumentsActionMenu, type DocumentsActionMenuItem } from './documents-action-menu'
import { DriveFileCardPreview } from './documents-drive-icons'
import { DocumentsDriveListTable, type DocumentsDriveSelection } from './documents-drive-list-table'

export type DocumentsFileListLayout = 'list' | 'grid'

type DocumentsFileListProps = {
  files: DecryptedVaultDocumentFile[]
  canWrite: boolean
  layout?: DocumentsFileListLayout
  /** When true with a sibling folder list, parent supplies layout; this list uses `display: contents`. */
  mergeWithSibling?: boolean
  buildFileMenuItems: (file: DecryptedVaultDocumentFile) => DocumentsActionMenuItem[]
  driveSelection?: DocumentsDriveSelection | null
}

export function DocumentsFileList({
  files,
  canWrite,
  layout = 'list',
  mergeWithSibling = false,
  buildFileMenuItems,
  driveSelection = null,
}: DocumentsFileListProps) {
  const { t } = useTranslation()

  if (files.length === 0) {
    return null
  }

  if (layout === 'list' && !mergeWithSibling) {
    return (
      <DocumentsDriveListTable
        folders={[]}
        files={files}
        canWrite={canWrite}
        onOpenFolder={() => {}}
        buildFolderMenuItems={() => []}
        buildFileMenuItems={buildFileMenuItems}
        folderActionsLabel=""
        fileActionsLabel={t('vault.documentsManager.documentActions')}
        driveSelection={driveSelection}
      />
    )
  }

  if (layout === 'grid') {
    const gridItems = (
      <ul
        className={
          mergeWithSibling
            ? 'contents'
            : 'grid grid-cols-2 justify-start gap-4 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(160px,160px))]'
        }
      >
        {files.map((file) => {
          const menuItems = buildFileMenuItems(file)
          const checked = driveSelection != null && driveSelection.selectedFileIds.has(file.id)
          return (
            <li key={file.id} className="flex min-w-0 self-stretch">
              <div
                className={cn(
                  'group relative flex h-full w-full flex-col items-center rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-ep-border-card dark:bg-ep-surface-subtle dark:hover:border-ep-primary/40',
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
                      onChange={() => driveSelection.onToggleFile(file.id)}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-ep-primary focus:ring-ep-primary dark:border-ep-border-card dark:bg-ep-surface dark:text-ep-primary-accent"
                      aria-label={t('vault.documentsManager.selectionRowCheckbox', { name: file.name })}
                    />
                  </div>
                ) : null}
                {menuItems.length > 0 ? (
                  <div className="absolute right-3 top-3 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <DocumentsActionMenu
                      label={t('vault.documentsManager.documentActions')}
                      items={menuItems}
                      tone="drive"
                      align="right"
                      menuPlacement="right"
                    />
                  </div>
                ) : null}

                <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center text-center">
                  <DriveFileCardPreview fileName={file.name} mimeType={file.mimeType} />
                  <div className="w-full min-w-0 px-0">
                    <p className="typo-emphasis truncate text-center text-[13px] leading-[1.3] text-gray-900 dark:text-gray-100">
                      {file.name}
                    </p>
                    <p
                      className="mt-0.5 truncate text-center text-[11px] leading-[1.3] text-transparent select-none"
                      aria-hidden
                    >
                      {t('vault.documentsManager.entryCount', { count: 0 })}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    )

    if (mergeWithSibling) {
      return gridItems
    }

    return (
      <div className="xl:h-full xl:overflow-y-auto xl:pr-1">
        <div className="space-y-4 pb-1">{gridItems}</div>
      </div>
    )
  }

  return null
}
