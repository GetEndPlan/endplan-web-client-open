import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import type {
  DecryptedVaultDocumentFile,
  DecryptedVaultDocumentFolder,
} from '../../hooks/documents/use-vault-documents-page'
import { DocumentsActionMenu, type DocumentsActionMenuItem } from './documents-action-menu'
import { DriveFileIconList, DriveFolderIconList } from './documents-drive-icons'

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

function formatDate(timestamp?: string | null): string {
  if (!timestamp) return '—'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export type DocumentsDriveSelection = {
  selectedFileIds: ReadonlySet<string>
  selectedFolderIds: ReadonlySet<string>
  onToggleFile: (fileId: string) => void
  onToggleFolder: (folderId: string) => void
  onToggleSelectAll: () => void
}

type DocumentsDriveListTableProps = {
  folders: DecryptedVaultDocumentFolder[]
  files: DecryptedVaultDocumentFile[]
  canWrite: boolean
  onOpenFolder: (folderId: string) => void
  buildFolderMenuItems: (folder: DecryptedVaultDocumentFolder) => DocumentsActionMenuItem[]
  buildFileMenuItems: (file: DecryptedVaultDocumentFile) => DocumentsActionMenuItem[]
  folderActionsLabel: string
  fileActionsLabel: string
  /** When rows exist, shows a leading column with per-item checkboxes and select-all. */
  driveSelection?: DocumentsDriveSelection | null
}

export function DocumentsDriveListTable({
  folders,
  files,
  canWrite,
  onOpenFolder,
  buildFolderMenuItems,
  buildFileMenuItems,
  folderActionsLabel,
  fileActionsLabel,
  driveSelection = null,
}: DocumentsDriveListTableProps) {
  const { t } = useTranslation()

  const visibleCount = folders.length + files.length
  const showSelection = visibleCount > 0 && driveSelection != null

  if (folders.length === 0 && files.length === 0) {
    return null
  }

  const nameCellPad = showSelection ? 'pl-3' : 'pl-5'

  return (
    <div className="overflow-hidden rounded-[10px] border border-slate-200 bg-white dark:border-ep-border-card dark:bg-ep-surface-subtle">
      <table className="typo-body-sm w-full border-collapse">
        <thead>
          <tr className="h-11 border-b border-slate-200 bg-slate-50 dark:border-ep-border-card dark:bg-ep-primary-dark">
            {showSelection ? (
              <th className="w-11 px-0 py-3 pl-5 text-left align-middle" aria-hidden />
            ) : null}
            <th
              className={`typo-emphasis min-w-[200px] px-4 py-3 text-left text-[13px] text-gray-500 dark:text-slate-400 sm:min-w-[280px] md:min-w-[300px] ${showSelection ? '' : 'pl-5'}`}
            >
              {t('vault.documentsManager.tableName')}
            </th>
            <th className="typo-emphasis w-[200px] px-4 py-3 text-left text-[13px] text-gray-500 dark:text-slate-400">
              {t('vault.documentsManager.tableCreated')}
            </th>
            <th className="typo-emphasis w-[120px] px-4 py-3 text-left text-[13px] text-gray-500 dark:text-slate-400">
              {t('vault.documentsManager.tableSize')}
            </th>
            <th className="typo-emphasis w-14 px-4 py-3 pr-5 text-right text-[13px] text-gray-500 dark:text-slate-400" />
          </tr>
        </thead>
        <tbody>
          {folders.map((folder) => {
            const menuItems = buildFolderMenuItems(folder)
            const showMenu = canWrite && menuItems.length > 0
            const folderChecked = showSelection && driveSelection.selectedFolderIds.has(folder.id)
            return (
              <tr
                key={`f-${folder.id}`}
                className="group/row h-[52px] cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 dark:border-ep-border-card/80 dark:hover:bg-ep-primary-dark/40"
                onClick={() => onOpenFolder(folder.id)}
              >
                {showSelection && driveSelection ? (
                  <td className="w-11 px-0 py-3 pl-5 align-middle" onClick={(e) => e.stopPropagation()}>
                    <div
                      className={cn(
                        'flex justify-start transition-opacity',
                        folderChecked
                          ? 'opacity-100'
                          : 'opacity-0 focus-within:opacity-100 group-hover/row:opacity-100',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={folderChecked}
                        onChange={() => driveSelection.onToggleFolder(folder.id)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-ep-primary focus:ring-ep-primary dark:border-ep-border-card dark:bg-ep-surface dark:text-ep-primary-accent"
                        aria-label={t('vault.documentsManager.selectionRowCheckbox', { name: folder.name })}
                      />
                    </div>
                  </td>
                ) : null}
                <td className={`max-w-0 px-4 py-3 align-middle ${nameCellPad}`}>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <DriveFolderIconList className="shrink-0" />
                    <span className="typo-emphasis min-w-0 truncate text-gray-900 dark:text-gray-100">
                      {folder.name}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle text-gray-900 dark:text-gray-100">
                  {formatDate(folder.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle text-gray-500 dark:text-slate-400">--</td>
                <td className="px-4 py-3 pr-5 text-right align-middle" onClick={(event) => event.stopPropagation()}>
                  {showMenu ? (
                    <div className="flex justify-end opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
                      <DocumentsActionMenu label={folderActionsLabel} items={menuItems} tone="drive" align="right" />
                    </div>
                  ) : null}
                </td>
              </tr>
            )
          })}
          {files.map((file) => {
            const menuItems = buildFileMenuItems(file)
            const checked = showSelection && driveSelection.selectedFileIds.has(file.id)
            return (
              <tr
                key={`file-${file.id}`}
                className="group/row h-[52px] border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0 dark:border-ep-border-card/80 dark:hover:bg-ep-primary-dark/40"
              >
                {showSelection && driveSelection ? (
                  <td className="w-11 px-0 py-3 pl-5 align-middle" onClick={(e) => e.stopPropagation()}>
                    <div
                      className={cn(
                        'flex justify-start transition-opacity',
                        checked
                          ? 'opacity-100'
                          : 'opacity-0 focus-within:opacity-100 group-hover/row:opacity-100',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => driveSelection.onToggleFile(file.id)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-ep-primary focus:ring-ep-primary dark:border-ep-border-card dark:bg-ep-surface dark:text-ep-primary-accent"
                        aria-label={t('vault.documentsManager.selectionRowCheckbox', { name: file.name })}
                      />
                    </div>
                  </td>
                ) : null}
                <td className={`max-w-0 px-4 py-3 align-middle ${nameCellPad}`}>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <DriveFileIconList
                      fileName={file.name}
                      mimeType={file.mimeType}
                      className="shrink-0"
                    />
                    <span className="typo-emphasis min-w-0 truncate text-gray-900 dark:text-gray-100">{file.name}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle text-gray-900 dark:text-gray-100">
                  {formatDate(file.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle text-gray-900 dark:text-gray-100">
                  {formatBytes(file.originalSizeBytes)}
                </td>
                <td className="px-4 py-3 pr-5 text-right align-middle">
                  {menuItems.length > 0 ? (
                    <div className="flex justify-end opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
                      <DocumentsActionMenu label={fileActionsLabel} items={menuItems} tone="drive" align="right" />
                    </div>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
