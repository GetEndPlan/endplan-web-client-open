import test from 'node:test'
import assert from 'node:assert/strict'

import { isVisibleVaultSectionType } from '../vault-section-types.ts'

test('isVisibleVaultSectionType hides videos and recovery', () => {
  assert.equal(isVisibleVaultSectionType('videos'), false)
  assert.equal(isVisibleVaultSectionType('video'), false)
  assert.equal(isVisibleVaultSectionType('recovery'), false)
  assert.equal(isVisibleVaultSectionType('policies'), true)
  assert.equal(isVisibleVaultSectionType('assets'), true)
})
