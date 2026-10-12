/**
 * Pure helpers for vault documents folder tree (no React, no i18n).
 * Used by drive UI hooks and delete-folder flow.
 */

export const ROOT_FOLDER_KEY = '__root__' as const

export type DocumentsDriveViewMode = 'grid' | 'list'

export type FolderParentKey = string

/** Folders grouped by `parentFolderId ?? ROOT_FOLDER_KEY`. */
export type FoldersByParent<T extends { id: string }> = Record<string, T[]>

export function getChildFoldersForParent<T extends { id: string }>(
  foldersByParent: FoldersByParent<T>,
  selectedFolderId: string | null,
): T[] {
  const parentKey = (selectedFolderId ?? ROOT_FOLDER_KEY) as string
  return foldersByParent[parentKey] ?? []
}

export function flattenFoldersFromParentMap<T extends { id: string }>(
  foldersByParent: FoldersByParent<T>,
): T[] {
  return Object.values(foldersByParent).flat()
}

export function buildFolderByIdMap<T extends { id: string }>(folders: T[]): Map<string, T> {
  return new Map(folders.map((folder) => [folder.id, folder]))
}

export function collectSubtreeFolderIds(
  rootFolderId: string,
  foldersByParent: FoldersByParent<{ id: string }>,
): string[] {
  const folderIds: string[] = [rootFolderId]
  const queue = [rootFolderId]

  while (queue.length > 0) {
    const currentFolderId = queue.shift()
    if (!currentFolderId) continue

    const childFolders = foldersByParent[currentFolderId] ?? []
    for (const childFolder of childFolders) {
      folderIds.push(childFolder.id)
      queue.push(childFolder.id)
    }
  }

  return folderIds
}

export function getFolderPathLabel<T extends { id: string; name: string; parentFolderId?: string | null }>(
  folder: T,
  folderById: Map<string, T>,
): string {
  const labels: string[] = []
  const visited = new Set<string>()
  let current: T | null = folder

  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    labels.push(current.name)
    const parentId: string | null | undefined = current.parentFolderId
    current = parentId ? folderById.get(parentId) ?? null : null
  }

  return labels.reverse().join(' / ')
}

export function getFileIdsInFolderSubtree(
  files: { id: string; folderId?: string | null }[],
  subtreeFolderIdSet: Set<string>,
): string[] {
  return files
    .filter((file) => file.folderId && subtreeFolderIdSet.has(file.folderId))
    .map((file) => file.id)
}

export function buildDeleteFolderMoveDestinationOptions<
  T extends { id: string; name: string; parentFolderId?: string | null },
>(allFolders: T[], subtreeFolderIdSet: Set<string>): { id: string; label: string }[] {
  const folderById = buildFolderByIdMap(allFolders)
  return allFolders
    .filter((candidate) => !subtreeFolderIdSet.has(candidate.id))
    .map((candidate) => ({
      id: candidate.id,
      label: getFolderPathLabel(candidate, folderById),
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

export function filterItemsByNameQuery<T extends { name: string }>(items: readonly T[], query: string): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...items]
  return items.filter((item) => item.name.toLowerCase().includes(q))
}

export function sortByCreatedAt<T extends { createdAt: string }>(items: readonly T[], desc: boolean): T[] {
  const next = [...items]
  next.sort((a, b) => {
    const ta = new Date(a.createdAt).getTime()
    const tb = new Date(b.createdAt).getTime()
    return desc ? tb - ta : ta - tb
  })
  return next
}

export function hasTopLevelFolders<T extends { id: string }>(foldersByParent: FoldersByParent<T>): boolean {
  return (foldersByParent[ROOT_FOLDER_KEY] ?? []).length > 0
}
