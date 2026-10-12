import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ROOT_FOLDER_KEY,
  buildDeleteFolderMoveDestinationOptions,
  buildFolderByIdMap,
  collectSubtreeFolderIds,
  filterItemsByNameQuery,
  getChildFoldersForParent,
  getFileIdsInFolderSubtree,
  getFolderPathLabel,
  sortByCreatedAt,
} from '../vault-documents-tree.ts'

test('collectSubtreeFolderIds walks nested children', () => {
  const byParent = {
    [ROOT_FOLDER_KEY]: [{ id: 'a' }],
    a: [{ id: 'b' }],
    b: [{ id: 'c' }],
    c: [],
  }
  assert.deepEqual(collectSubtreeFolderIds('a', byParent).sort(), ['a', 'b', 'c'])
})

test('getFolderPathLabel builds root-to-leaf path', () => {
  const folders = [
    { id: 'root1', name: 'Docs', parentFolderId: null as string | null },
    { id: 'sub1', name: '2024', parentFolderId: 'root1' },
  ]
  const map = buildFolderByIdMap(folders)
  assert.equal(getFolderPathLabel(folders[1], map), 'Docs / 2024')
})

test('getFileIdsInFolderSubtree filters by folder set', () => {
  const files = [
    { id: 'f1', folderId: 'a' },
    { id: 'f2', folderId: 'b' },
    { id: 'f3', folderId: null },
  ]
  assert.deepEqual(getFileIdsInFolderSubtree(files, new Set(['a'])), ['f1'])
})

test('buildDeleteFolderMoveDestinationOptions excludes subtree', () => {
  const all = [
    { id: 'keep', name: 'Keep', parentFolderId: null as string | null },
    { id: 'del', name: 'DeleteMe', parentFolderId: null },
  ]
  const opts = buildDeleteFolderMoveDestinationOptions(all, new Set(['del']))
  assert.deepEqual(
    opts.map((o) => o.id),
    ['keep'],
  )
})

test('getChildFoldersForParent uses ROOT key when null', () => {
  const by = { [ROOT_FOLDER_KEY]: [{ id: 'x' }] }
  assert.equal(getChildFoldersForParent(by, null).length, 1)
})

test('filterItemsByNameQuery is case-insensitive substring', () => {
  assert.deepEqual(filterItemsByNameQuery([{ name: 'Hello' }, { name: 'World' }], 'ell'), [{ name: 'Hello' }])
})

test('sortByCreatedAt respects desc flag', () => {
  const a = { id: '1', createdAt: '2020-01-01T00:00:00.000Z' }
  const b = { id: '2', createdAt: '2021-01-01T00:00:00.000Z' }
  assert.deepEqual(
    sortByCreatedAt([a, b], true).map((x) => x.id),
    ['2', '1'],
  )
  assert.deepEqual(
    sortByCreatedAt([a, b], false).map((x) => x.id),
    ['1', '2'],
  )
})
