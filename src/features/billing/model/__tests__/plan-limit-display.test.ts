import test from 'node:test'
import assert from 'node:assert/strict'

import {
  formatPlanCountLimit,
  formatPlanStorageBytes,
  PRO_DISPLAY_UNLIMITED_THRESHOLD,
  resolveAssetCategoriesMax,
  resolveAssetRowsPerCategoryMax,
  resolveInstructionsMax,
} from '../plan-limit-display.ts'

test('resolveAssetRowsPerCategoryMax falls back to basic default of 5', () => {
  assert.equal(
    resolveAssetRowsPerCategoryMax({
      inTrial: true,
      canAccess: true,
    }),
    5,
  )
})

test('resolveInstructionsMax falls back to basic default of 5', () => {
  assert.equal(
    resolveInstructionsMax({
      inTrial: true,
      canAccess: true,
    }),
    5,
  )
})

test('resolveAssetCategoriesMax normalizes legacy basic cap of 3 to 10', () => {
  assert.equal(
    resolveAssetCategoriesMax({
      features: {
        max_key_persons: 1,
        asset_categories_max: 3,
        asset_rows_per_category_max: 5,
        documents_folders_max: 10,
        documents_files_max: 10,
        documents_file_size_max_bytes: 104857600,
        documents_total_size_max_bytes: 1073741824,
        instructions_max: 5,
        contacts_max: 10,
      },
      inTrial: true,
      canAccess: true,
    }),
    10,
  )
})

test('formatPlanCountLimit shows Unlimited for pro at threshold', () => {
  assert.equal(
    formatPlanCountLimit(PRO_DISPLAY_UNLIMITED_THRESHOLD, 'pro'),
    'Unlimited',
  )
  assert.equal(formatPlanCountLimit(100, 'basic'), '100')
  assert.equal(formatPlanCountLimit(10, 'pro'), '10')
})

test('formatPlanStorageBytes formats human-readable sizes', () => {
  assert.equal(formatPlanStorageBytes(1073741824), '1.0 GB')
})
