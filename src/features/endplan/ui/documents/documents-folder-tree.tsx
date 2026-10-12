import type { ReactNode } from 'react'
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react'
import { cn } from '@/shared/lib'
import type { DecryptedVaultDocumentFolder } from '../../hooks/documents/use-vault-documents-page'
import { DocumentsActionMenu, type DocumentsActionMenuItem } from './documents-action-menu'

const MAX_FOLDER_INDENT_PX = 40
const ROOT_FOLDER_ROW_MARGIN_PX = 8

function getFolderIndent(depth: number): number {
  const safeDepth = Math.max(depth, 0)
  return Math.min(8 + safeDepth * 16, MAX_FOLDER_INDENT_PX)
}

type DocumentsFolderTreeProps = {
  rootFolderKey: string
  foldersByParent: Record<string, DecryptedVaultDocumentFolder[]>
  selectedFolderId: string | null
  expandedFolderIds: Set<string>
  totalFileCountByFolderId: Map<string, number>
  onToggleFolderExpanded: (folderId: string) => void
  onSelectFolder: (folderId: string) => void
  buildFolderMenuItems: (folder: DecryptedVaultDocumentFolder) => DocumentsActionMenuItem[]
  folderActionsLabel: string
  expandFolderLabel: string
  collapseFolderLabel: string
}

export function DocumentsFolderTree({
  rootFolderKey,
  foldersByParent,
  selectedFolderId,
  expandedFolderIds,
  totalFileCountByFolderId,
  onToggleFolderExpanded,
  onSelectFolder,
  buildFolderMenuItems,
  folderActionsLabel,
  expandFolderLabel,
  collapseFolderLabel,
}: DocumentsFolderTreeProps) {
  const renderFolderTree = (parentFolderKey: string, depth: number): ReactNode => {
    const folders =
      parentFolderKey === rootFolderKey
        ? foldersByParent[rootFolderKey] ?? []
        : foldersByParent[parentFolderKey] ?? []

    if (folders.length === 0) return null

    return (
      <ul>
        {folders.map((folder) => {
          const isSelected = folder.id === selectedFolderId
          const childFolders = foldersByParent[folder.id] ?? []
          const hasChildren = childFolders.length > 0
          const isExpanded = hasChildren && expandedFolderIds.has(folder.id)
          const fileCount = totalFileCountByFolderId.get(folder.id) ?? 0
          const menuItems = buildFolderMenuItems(folder)

          return (
            <li key={folder.id}>
              <div
                className={cn(
                  'group flex h-9 items-center overflow-hidden rounded-lg typo-nav-link typo-emphasis transition-[background-color,color] duration-200 ease-out',
                  isSelected
                    ? 'bg-ep-primary-softer text-ep-primary-accent dark:bg-ep-primary-dark/50 dark:text-ep-primary-muted'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-ep-surface-panel',
                )}
                style={{
                  marginLeft: `${getFolderIndent(depth)}px`,
                  marginRight: `${ROOT_FOLDER_ROW_MARGIN_PX}px`,
                }}
              >
                {hasChildren ? (
                  <button
                    type="button"
                    aria-label={isExpanded ? collapseFolderLabel : expandFolderLabel}
                    onClick={() => onToggleFolderExpanded(folder.id)}
                    className={cn(
                      'ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition',
                      isSelected
                        ? 'text-ep-primary hover:bg-ep-primary-softer dark:text-ep-primary-muted dark:hover:bg-ep-primary-dark/50'
                        : 'text-slate-500 hover:bg-ep-primary-softer hover:text-ep-primary-accent dark:text-slate-400 dark:hover:bg-ep-primary/15 dark:hover:text-ep-primary-muted',
                    )}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <span className="ml-2 h-7 w-7 shrink-0" />
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (hasChildren && !isExpanded) {
                      onToggleFolderExpanded(folder.id)
                    }
                    onSelectFolder(folder.id)
                  }}
                  className="flex min-w-0 flex-1 items-center text-left"
                >
                  <span
                    className={cn(
                      'inline-flex h-4 w-4 shrink-0 items-center justify-center',
                      isSelected
                        ? 'text-ep-primary dark:text-ep-primary-muted'
                        : 'text-slate-400 dark:text-slate-500',
                    )}
                  >
                    {isSelected ? (
                      <FolderOpen className="h-4 w-4" />
                    ) : (
                      <Folder className="h-4 w-4" />
                    )}
                  </span>
                  <span className="ml-2 min-w-0 flex-1 truncate">{folder.name}</span>
                  <span className="ml-2 mr-2 flex items-center">
                    <span className="inline-flex items-center rounded-full whitespace-nowrap bg-ep-primary-softer px-2 py-0.5 text-ep-primary typo-badge dark:bg-ep-primary-dark dark:text-ep-primary-accent">
                      {fileCount}
                    </span>
                  </span>
                </button>

                {menuItems.length > 0 ? (
                  <DocumentsActionMenu
                    label={folderActionsLabel}
                    items={menuItems}
                    align="left"
                    className={cn(
                      'mr-1 opacity-0 transition group-hover:opacity-100',
                      isSelected ? 'opacity-100' : '',
                    )}
                    menuClassName="translate-x-3"
                    triggerClassName={cn(
                      'h-7 w-7 rounded-lg border-transparent bg-transparent',
                      isSelected
                        ? 'text-ep-primary hover:border-transparent hover:bg-ep-primary-softer hover:text-ep-primary-accent dark:text-ep-primary-muted dark:hover:bg-ep-primary-dark/50 dark:hover:text-ep-primary-soft'
                        : 'text-slate-500 hover:border-transparent hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-ep-surface-panel dark:hover:text-slate-200',
                    )}
                  />
                ) : null}
              </div>

              {isExpanded ? renderFolderTree(folder.id, depth + 1) : null}
            </li>
          )
        })}
      </ul>
    )
  }

  return renderFolderTree(rootFolderKey, 0)
}
