import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveAssetFieldHeadingLabel } from './vault-assets-table-helpers.ts'

test('resolveAssetFieldHeadingLabel uses the live rename draft', () => {
  assert.equal(
    resolveAssetFieldHeadingLabel('company', 'Company Name', 'company', 'Broker'),
    'Broker',
  )
})

test('resolveAssetFieldHeadingLabel keeps the saved label while another column is edited', () => {
  assert.equal(
    resolveAssetFieldHeadingLabel('company', 'Company Name', 'notes', 'Notes'),
    'Company Name',
  )
})

test('resolveAssetFieldHeadingLabel ignores a blank rename draft', () => {
  assert.equal(
    resolveAssetFieldHeadingLabel('company', 'Company Name', 'company', '   '),
    'Company Name',
  )
})
