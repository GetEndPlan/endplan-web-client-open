import assert from 'node:assert/strict'
import test from 'node:test'
import { nextOtherCategoryName } from '../other-category-name.ts'

test('nextOtherCategoryName returns base when unused', () => {
  assert.equal(nextOtherCategoryName(['Bank Accounts'], 'Other Assets'), 'Other Assets')
})

test('nextOtherCategoryName suffixes when base exists', () => {
  assert.equal(
    nextOtherCategoryName(['Other Assets', 'Bank Accounts'], 'Other Assets'),
    'Other Assets 2',
  )
  assert.equal(
    nextOtherCategoryName(['Other Assets', 'Other Assets 2'], 'Other Assets'),
    'Other Assets 3',
  )
})
