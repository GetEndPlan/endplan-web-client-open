import test from 'node:test'
import assert from 'node:assert/strict'

import { countSectionContentItems } from '../section-content-counts.ts'
import { SECTION_ID } from '../vault-section-types.ts'

test('countSectionContentItems does not treat empty asset category rows as added assets', () => {
  assert.equal(
    countSectionContentItems(SECTION_ID.ASSETS, {
      categories: [{ rows: [{ id: 'placeholder', values: { company: '', notes: '' } }] }],
    }),
    0,
  )
})

test('countSectionContentItems counts an asset row after a field is filled', () => {
  assert.equal(
    countSectionContentItems(SECTION_ID.ASSETS, {
      categories: [{ rows: [{ id: 'row-1', values: { company: 'Acme' } }] }],
    }),
    1,
  )
})

test('countSectionContentItems counts instruction and contact items by length', () => {
  assert.equal(
    countSectionContentItems(SECTION_ID.INSTRUCTIONS, { items: [{ id: '1' }, { id: '2' }] }),
    2,
  )
  assert.equal(countSectionContentItems(SECTION_ID.CONTACTS, { items: [{ id: '1' }] }), 1)
})
