import test from 'node:test'
import assert from 'node:assert/strict'

import {
  canCreateDocumentFolder,
  canUploadAtLeastOneDocumentFile,
  checkFileUploadsAgainstPlan,
  checkFolderCreateAgainstPlan,
  documentsPlanLimitsFromFeatures,
  resolveDocumentsPlanLimits,
} from '../vault-documents-plan-guards.ts'

const limits = documentsPlanLimitsFromFeatures({
  documents_folders_max: 5,
  documents_files_max: 10,
  documents_file_size_max_bytes: 1000,
  documents_total_size_max_bytes: 5000,
})

test('resolveDocumentsPlanLimits falls back to basic defaults when features missing', () => {
  const resolved = resolveDocumentsPlanLimits({ inTrial: true, canAccess: true })
  assert.equal(resolved.foldersMax, 10)
  assert.equal(resolved.filesMax, 10)
  assert.equal(resolved.fileSizeMaxBytes, 104857600)
  assert.equal(resolved.totalSizeMaxBytes, 1073741824)
})

test('documentsPlanLimitsFromFeatures returns null when features missing', () => {
  assert.equal(documentsPlanLimitsFromFeatures(undefined), null)
})

test('checkFolderCreateAgainstPlan blocks while subscription loading', () => {
  assert.equal(
    checkFolderCreateAgainstPlan({
      isSubscriptionLoading: true,
      limits: limits!,
      currentFolderCount: 0,
    }),
    'subscription_loading',
  )
})

test('checkFolderCreateAgainstPlan blocks at folder cap', () => {
  assert.equal(
    checkFolderCreateAgainstPlan({
      isSubscriptionLoading: false,
      limits: limits!,
      currentFolderCount: 5,
    }),
    'folder_limit',
  )
})

test('checkFolderCreateAgainstPlan allows below cap', () => {
  assert.equal(
    checkFolderCreateAgainstPlan({
      isSubscriptionLoading: false,
      limits: limits!,
      currentFolderCount: 4,
    }),
    null,
  )
})

test('canCreateDocumentFolder and canUploadAtLeastOneDocumentFile respect caps', () => {
  assert.equal(canCreateDocumentFolder({ limits: limits!, currentFolderCount: 5 }), false)
  assert.equal(canUploadAtLeastOneDocumentFile({
    limits: limits!,
    currentFileCount: 10,
    currentTotalSizeBytes: 0,
  }), false)
})

test('checkFileUploadsAgainstPlan blocks oversized file', () => {
  const block = checkFileUploadsAgainstPlan({
    isSubscriptionLoading: false,
    limits: limits!,
    currentFileCount: 0,
    currentTotalSizeBytes: 0,
    files: [{ name: 'big.pdf', size: 2000 }],
  })
  assert.deepEqual(block, { kind: 'file_size', fileName: 'big.pdf', maxBytes: 1000 })
})

test('checkFileUploadsAgainstPlan blocks when batch would exceed file cap', () => {
  const block = checkFileUploadsAgainstPlan({
    isSubscriptionLoading: false,
    limits: limits!,
    currentFileCount: 9,
    currentTotalSizeBytes: 0,
    files: [
      { name: 'a.pdf', size: 1 },
      { name: 'b.pdf', size: 1 },
    ],
  })
  assert.deepEqual(block, { kind: 'file_limit', max: 10, current: 9, adding: 2 })
})

test('checkFileUploadsAgainstPlan allows when within cap', () => {
  assert.equal(
    checkFileUploadsAgainstPlan({
      isSubscriptionLoading: false,
      limits: limits!,
      currentFileCount: 9,
      currentTotalSizeBytes: 0,
      files: [{ name: 'a.pdf', size: 1 }],
    }),
    null,
  )
})
