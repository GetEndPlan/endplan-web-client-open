import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ATTACHMENT_DOCUMENT_PICKER_ROOT_PARENT_KEY,
  buildAttachmentDocumentPickerIndices,
  filterAttachmentDocumentPickerFilesByQuery,
} from '../attachment-document-picker-tree.ts'

test('buildAttachmentDocumentPickerIndices includes root-folder files', () => {
  const indices = buildAttachmentDocumentPickerIndices(
    [{ id: 'folder-1', name: 'Taxes', parentFolderId: null }],
    [
      { id: 'root-file', name: 'Will.pdf', folderId: null, originalSizeBytes: 12 },
      { id: 'nested-file', name: 'Return.pdf', folderId: 'folder-1', originalSizeBytes: 8 },
    ],
  )

  const rootFiles = indices.directFilesByFolderId.get(ATTACHMENT_DOCUMENT_PICKER_ROOT_PARENT_KEY) ?? []
  const folderFiles = indices.directFilesByFolderId.get('folder-1') ?? []

  assert.deepEqual(
    rootFiles.map((file) => file.id),
    ['root-file'],
  )
  assert.deepEqual(
    folderFiles.map((file) => file.id),
    ['nested-file'],
  )
})

test('filterAttachmentDocumentPickerFilesByQuery matches root files by name', () => {
  const indices = buildAttachmentDocumentPickerIndices(
    [],
    [{ id: 'root-file', name: 'Will.pdf', folderId: null, originalSizeBytes: 12 }],
  )

  const results = filterAttachmentDocumentPickerFilesByQuery(
    indices.filesSorted,
    indices.folderById,
    'will',
  )

  assert.deepEqual(
    results.map((file) => file.id),
    ['root-file'],
  )
})
