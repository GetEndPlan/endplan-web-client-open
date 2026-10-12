import type { TFunction } from 'i18next'
import { ChevronDown, ChevronRight, Circle, FileText, Upload } from 'lucide-react'
import { cn } from '@/shared/lib'
import type {
  AttachmentDocumentPickerFile,
  AttachmentDocumentPickerFolder,
} from '../../model/attachment-document-picker-tree'

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

type AttachmentDocumentPickerFileRowProps = {
  file: AttachmentDocumentPickerFile
  depth: number
  selectedFileId: string | null
  onSelectFile: (fileId: string) => void
}

export function AttachmentDocumentPickerFileRow({
  file,
  depth,
  selectedFileId,
  onSelectFile,
}: AttachmentDocumentPickerFileRowProps) {
  const isSelected = selectedFileId === file.id

  return (
    <button
      type="button"
      onClick={() => onSelectFile(file.id)}
      className={cn(
        'grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-2 py-3 pr-4 text-left transition',
        isSelected
          ? 'bg-ep-primary-softer text-ep-primary-accent dark:bg-ep-primary/20 dark:text-ep-primary-muted'
          : 'hover:bg-slate-50 dark:hover:bg-ep-primary-dark/40',
      )}
      style={{ paddingLeft: 12 + depth * 16 }}
    >
      <span className="w-7 shrink-0" aria-hidden />
      <span className="inline-flex min-w-0 items-center gap-2">
        <FileText
          className={cn(
            'h-4 w-4 shrink-0',
            isSelected
              ? 'text-ep-primary dark:text-ep-primary-muted'
              : 'text-slate-400 dark:text-slate-500',
          )}
          aria-hidden
        />
        <span
          className={cn(
            'truncate typo-body-sm-emphasis',
            isSelected ? undefined : 'text-slate-800 dark:text-slate-100',
          )}
        >
          {file.name}
        </span>
      </span>
      <span
        className={cn(
          'typo-body-sm',
          isSelected
            ? 'text-ep-primary/80 dark:text-ep-primary-muted/80'
            : 'text-slate-500 dark:text-slate-400',
        )}
      >
        {formatBytes(file.originalSizeBytes)}
      </span>
      <span
        className={cn(
          'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
          isSelected
            ? 'border-ep-primary bg-ep-primary-softer text-ep-primary dark:border-ep-primary-accent dark:bg-ep-primary/30 dark:text-ep-primary-muted'
            : 'border-slate-400 text-transparent dark:border-slate-500',
        )}
      >
        <Circle className="h-3.5 w-3.5 fill-current" aria-hidden />
      </span>
    </button>
  )
}

type AttachmentDocumentFolderTreeProps = {
  parentKey: string
  depth: number
  foldersByParent: Record<string, AttachmentDocumentPickerFolder[]>
  directFilesByFolderId: Map<string, AttachmentDocumentPickerFile[]>
  expandedFolderIds: ReadonlySet<string>
  selectedFileId: string | null
  canManageDocuments: boolean
  isBusy: boolean
  t: TFunction
  fileCountInSubtree: (folderId: string) => number
  onFolderRowClick: (folderId: string, canExpand: boolean) => void
  onSelectFile: (fileId: string) => void
  onUploadToFolder: (folderId: string) => void
}

export function AttachmentDocumentFolderTree({
  parentKey,
  depth,
  foldersByParent,
  directFilesByFolderId,
  expandedFolderIds,
  selectedFileId,
  canManageDocuments,
  isBusy,
  t,
  fileCountInSubtree,
  onFolderRowClick,
  onSelectFile,
  onUploadToFolder,
}: AttachmentDocumentFolderTreeProps) {
  const folders = foldersByParent[parentKey] ?? []

  return folders.map((folder) => {
    const childFolders = foldersByParent[folder.id] ?? []
    const directFiles = directFilesByFolderId.get(folder.id) ?? []
    const canExpand = childFolders.length > 0 || directFiles.length > 0 || canManageDocuments
    const isExpanded = expandedFolderIds.has(folder.id)
    const rowPaddingLeftPx = 12 + depth * 16

    return (
      <div key={folder.id}>
        <button
          type="button"
          onClick={() => onFolderRowClick(folder.id, canExpand)}
          className={cn(
            'grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 py-3 pr-4 text-left transition',
            canExpand ? 'hover:bg-slate-50 dark:hover:bg-ep-primary-dark/40' : '',
            isExpanded && canExpand
              ? 'bg-ep-primary-softer text-ep-primary-accent dark:bg-ep-primary/20 dark:text-ep-primary-muted'
              : canExpand
                ? 'text-slate-900 dark:text-slate-100'
                : 'cursor-default text-slate-700 dark:text-slate-200',
          )}
          style={{ paddingLeft: rowPaddingLeftPx }}
          aria-expanded={canExpand ? isExpanded : undefined}
        >
          <span
            className={cn(
              'inline-flex w-7 shrink-0 items-center justify-center',
              isExpanded && canExpand
                ? 'text-ep-primary dark:text-ep-primary-muted'
                : 'text-slate-500 dark:text-slate-400',
            )}
          >
            {canExpand ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronRight className="h-4 w-4" aria-hidden />
              )
            ) : (
              <span className="h-4 w-4" aria-hidden />
            )}
          </span>
          <span className="inline-flex min-w-0 items-center gap-2 typo-body-sm-emphasis">
            <Circle className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden />
            <span className="truncate">{folder.name}</span>
          </span>
          <span
            className={cn(
              'typo-body-sm',
              isExpanded && canExpand
                ? 'text-ep-primary/80 dark:text-ep-primary-muted/80'
                : 'text-slate-500 dark:text-slate-400',
            )}
          >
            {t('vault.assets.attachments.folderFileCount', {
              count: fileCountInSubtree(folder.id),
            })}
          </span>
        </button>
        {isExpanded && canExpand ? (
          <div className="divide-y divide-slate-200 border-t border-slate-200 dark:divide-ep-border-card dark:border-ep-border-card">
            <AttachmentDocumentFolderTree
              parentKey={folder.id}
              depth={depth + 1}
              foldersByParent={foldersByParent}
              directFilesByFolderId={directFilesByFolderId}
              expandedFolderIds={expandedFolderIds}
              selectedFileId={selectedFileId}
              canManageDocuments={canManageDocuments}
              isBusy={isBusy}
              t={t}
              fileCountInSubtree={fileCountInSubtree}
              onFolderRowClick={onFolderRowClick}
              onSelectFile={onSelectFile}
              onUploadToFolder={onUploadToFolder}
            />
            {directFiles.map((file) => (
              <AttachmentDocumentPickerFileRow
                key={file.id}
                file={file}
                depth={depth + 1}
                selectedFileId={selectedFileId}
                onSelectFile={onSelectFile}
              />
            ))}
            {canManageDocuments ? (
              <button
                type="button"
                onClick={() => onUploadToFolder(folder.id)}
                disabled={isBusy}
                className="flex w-full items-center gap-2 py-3 pr-4 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-ep-primary-dark/40"
                style={{ paddingLeft: 12 + (depth + 1) * 16 }}
              >
                <span className="inline-flex w-7 shrink-0 items-center justify-center text-ep-primary dark:text-ep-primary-muted">
                  <Upload className="h-4 w-4" aria-hidden />
                </span>
                <span className="typo-body-sm-emphasis text-ep-primary dark:text-ep-primary-muted">
                  {t('vault.assets.attachments.uploadToFolderAction')}
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  })
}
