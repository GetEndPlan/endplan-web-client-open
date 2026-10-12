/** Parent key for folders whose `parentFolderId` is null or undefined (vault document tree root). */
export const ATTACHMENT_DOCUMENT_PICKER_ROOT_PARENT_KEY = ''

export type AttachmentDocumentPickerFolder = {
  id: string
  name: string
  parentFolderId?: string | null
}

export type AttachmentDocumentPickerFile = {
  id: string
  name: string
  folderId?: string | null
  originalSizeBytes: number
}

export function attachmentDocumentPickerFolderParentKey(
  parentFolderId: string | null | undefined,
): string {
  return parentFolderId ?? ATTACHMENT_DOCUMENT_PICKER_ROOT_PARENT_KEY
}

export type AttachmentDocumentPickerIndices = {
  foldersSorted: AttachmentDocumentPickerFolder[]
  filesSorted: AttachmentDocumentPickerFile[]
  folderById: Map<string, AttachmentDocumentPickerFolder>
  foldersByParent: Record<string, AttachmentDocumentPickerFolder[]>
  topLevelFolders: AttachmentDocumentPickerFolder[]
  directFilesByFolderId: Map<string, AttachmentDocumentPickerFile[]>
}

export function buildAttachmentDocumentPickerIndices(
  folders: AttachmentDocumentPickerFolder[],
  files: AttachmentDocumentPickerFile[],
): AttachmentDocumentPickerIndices {
  const foldersSorted = [...folders].sort((a, b) => a.name.localeCompare(b.name))
  const filesSorted = [...files].sort((a, b) => a.name.localeCompare(b.name))
  const folderById = new Map(foldersSorted.map((folder) => [folder.id, folder]))

  const foldersByParent: Record<string, AttachmentDocumentPickerFolder[]> = {}
  for (const folder of foldersSorted) {
    const key = attachmentDocumentPickerFolderParentKey(folder.parentFolderId)
    if (!foldersByParent[key]) foldersByParent[key] = []
    foldersByParent[key].push(folder)
  }
  for (const key of Object.keys(foldersByParent)) {
    foldersByParent[key].sort((a, b) => a.name.localeCompare(b.name))
  }

  const topLevelFolders = foldersByParent[ATTACHMENT_DOCUMENT_PICKER_ROOT_PARENT_KEY] ?? []

  const directFilesByFolderId = new Map<string, AttachmentDocumentPickerFile[]>()
  for (const file of filesSorted) {
    const key = attachmentDocumentPickerFolderParentKey(file.folderId)
    const list = directFilesByFolderId.get(key)
    if (list) list.push(file)
    else directFilesByFolderId.set(key, [file])
  }
  for (const list of directFilesByFolderId.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  return {
    foldersSorted,
    filesSorted,
    folderById,
    foldersByParent,
    topLevelFolders,
    directFilesByFolderId,
  }
}

export function isAttachmentDocumentFileInFolderSubtree(
  file: AttachmentDocumentPickerFile,
  folderId: string,
  folderById: Map<string, AttachmentDocumentPickerFolder>,
): boolean {
  let currentFolderId = file.folderId ?? null
  let safetyCounter = 0
  while (currentFolderId && safetyCounter < 100) {
    if (currentFolderId === folderId) return true
    currentFolderId = folderById.get(currentFolderId)?.parentFolderId ?? null
    safetyCounter += 1
  }
  return false
}

export function countAttachmentDocumentFilesInFolderSubtree(
  folderId: string,
  filesSorted: AttachmentDocumentPickerFile[],
  folderById: Map<string, AttachmentDocumentPickerFolder>,
): number {
  return filesSorted.filter((file) => isAttachmentDocumentFileInFolderSubtree(file, folderId, folderById)).length
}

export function filterAttachmentDocumentPickerFilesByQuery(
  filesSorted: AttachmentDocumentPickerFile[],
  folderById: Map<string, AttachmentDocumentPickerFolder>,
  normalizedQuery: string,
): AttachmentDocumentPickerFile[] {
  if (!normalizedQuery) return []
  return filesSorted.filter((file) => {
    const fileName = file.name.toLowerCase()
    const folderName = (file.folderId ? folderById.get(file.folderId)?.name : '')?.toLowerCase() ?? ''
    return fileName.includes(normalizedQuery) || folderName.includes(normalizedQuery)
  })
}

/** Folder id and ancestors (walking up `parentFolderId`), for expanding the tree after create/upload. */
export function attachmentDocumentPickerFolderAncestorIds(
  folderId: string,
  folderById: Map<string, AttachmentDocumentPickerFolder>,
): string[] {
  const chain: string[] = []
  let currentId: string | null | undefined = folderId
  let guard = 0
  while (currentId && guard < 100) {
    chain.push(currentId)
    const nextParentId: string | null | undefined = folderById.get(currentId)?.parentFolderId
    currentId = nextParentId ?? null
    guard += 1
  }
  return chain
}
