import test from 'node:test'
import assert from 'node:assert/strict'

import type { AssetSchemaCategory } from '../../api/clients/vault-api.ts'
import { assetRowHasUserInput, countFilledAssetRowsInCategories, getCategoryRows, isAssetSectionPayloadV2, normalizeAssetPayload } from '../asset-table-model.ts'

const categories: AssetSchemaCategory[] = [
  {
    id: 'cat-bank',
    key: 'bank_accounts',
    name: 'Bank Accounts',
    displayOrder: 1,
    isActive: true,
    fields: [],
  },
  {
    id: 'cat-other',
    key: 'other',
    name: 'Other',
    displayOrder: 2,
    isActive: true,
    fields: [],
  },
]

test('isAssetSectionPayloadV2 validates shape', () => {
  assert.equal(
    isAssetSectionPayloadV2({
      schemaVersion: 2,
      categories: [{ categoryTemplateId: 'cat-bank', rows: [{ id: '1', values: { a: 'b' } }] }],
    }),
    true,
  )

  assert.equal(
    isAssetSectionPayloadV2({
      schemaVersion: 2,
      categories: [{ categoryTemplateId: 1 }],
    }),
    false,
  )

  assert.equal(
    isAssetSectionPayloadV2({
      schemaVersion: 2,
      categories: [{ categoryTemplateId: 'cat-bank', rows: [{ id: '1', values: [] }] }],
    }),
    false,
  )
})

test('normalizeAssetPayload normalizes V2 payload and fills missing category names', () => {
  const payload = normalizeAssetPayload(
    {
      schemaVersion: 2,
      categories: [
        {
          categoryTemplateId: 'cat-bank',
          categoryName: '',
          rows: [
            {
              id: 'row-1',
              values: { amount: 100, notes: null },
            },
          ],
        },
      ],
    },
    categories,
  )

  assert.equal(payload.schemaVersion, 2)
  assert.equal(payload.categories[0]?.categoryName, 'Bank Accounts')
  assert.deepEqual(payload.categories[0]?.rows[0]?.values, { amount: '', notes: '' })
})

test('normalizeAssetPayload converts legacy payload to V2 with category grouping', () => {
  const payload = normalizeAssetPayload(
    {
      items: [
        {
          id: 'legacy-1',
          assetType: 'bank_accounts',
          assetName: 'Main Account',
          institution: 'My Bank',
          accountOrPolicyNumber: '1234',
          notes: 'Primary',
        },
        {
          id: 'legacy-2',
          assetType: 'unknown-type',
          assetName: 'Fallback Asset',
        },
      ],
    },
    categories,
  )

  assert.equal(payload.schemaVersion, 2)
  assert.equal(payload.categories.length, 2)
  assert.equal(payload.categories[0]?.categoryTemplateId, 'cat-bank')
  assert.equal(payload.categories[0]?.rows[0]?.id, 'legacy-1')
  assert.equal(payload.categories[1]?.categoryTemplateId, 'cat-other')
  assert.equal(payload.categories[1]?.rows[0]?.id, 'legacy-2')
})

test('normalizeAssetPayload returns empty categories when legacy payload has no resolvable categories', () => {
  const payload = normalizeAssetPayload(
    {
      items: [{ id: 'legacy-1', assetType: 'bank_accounts', assetName: 'A' }],
    },
    [],
  )

  assert.equal(payload.schemaVersion, 2)
  assert.deepEqual(payload.categories, [])
})

test('normalizeAssetPayload generates row id and coerces non-string values to empty string', () => {
  const payload = normalizeAssetPayload(
    {
      schemaVersion: 2,
      categories: [
        {
          categoryTemplateId: 'cat-bank',
          rows: [
            {
              id: '',
              values: {
                name: 'Primary',
                amount: 1000,
                enabled: true,
                details: null,
              },
            },
          ],
        },
      ],
    },
    categories,
  )

  const row = payload.categories[0]?.rows[0]
  assert.equal(typeof row?.id, 'string')
  assert.equal((row?.id?.length ?? 0) > 0, true)
  assert.deepEqual(row?.values, {
    name: 'Primary',
    amount: '',
    enabled: '',
    details: '',
  })
})

test('normalizeAssetPayload keeps explicit categoryName when provided', () => {
  const payload = normalizeAssetPayload(
    {
      schemaVersion: 2,
      categories: [
        {
          categoryTemplateId: 'cat-bank',
          categoryName: 'My Custom Bank Label',
          rows: [],
        },
      ],
    },
    categories,
  )

  assert.equal(payload.categories[0]?.categoryName, 'My Custom Bank Label')
})

test('getCategoryRows returns rows for matching categoryTemplateId', () => {
  const payload = normalizeAssetPayload(
    {
      schemaVersion: 2,
      categories: [
        { categoryTemplateId: 'cat-bank', rows: [{ id: 'row-1', values: { name: 'A' } }] },
        { categoryTemplateId: 'cat-other', rows: [{ id: 'row-2', values: { name: 'B' } }] },
      ],
    },
    categories,
  )

  assert.deepEqual(getCategoryRows(payload, 'cat-other'), [{ id: 'row-2', values: { name: 'B' } }])
  assert.deepEqual(getCategoryRows(payload, 'missing'), [])
})

test('assetRowHasUserInput is false for empty placeholder rows', () => {
  assert.equal(assetRowHasUserInput({ id: 'row-1', values: { company: '', notes: '' } }), false)
  assert.equal(assetRowHasUserInput({ id: 'row-1', values: { company: '   ' } }), false)
  assert.equal(assetRowHasUserInput({ id: 'row-1', values: {} }), false)
  assert.equal(assetRowHasUserInput(null), false)
})

test('assetRowHasUserInput is true when any field has a value', () => {
  assert.equal(assetRowHasUserInput({ id: 'row-1', values: { company: 'Acme' } }), true)
  assert.equal(assetRowHasUserInput({ id: 'row-1', values: { company: '', notes: 'Held jointly' } }), true)
})

test('countFilledAssetRowsInCategories ignores empty category rows', () => {
  assert.equal(
    countFilledAssetRowsInCategories([
      { rows: [{ id: 'empty', values: { company: '' } }] },
      { rows: [{ id: 'filled', values: { company: 'Acme' } }, { id: 'also-empty', values: {} }] },
    ]),
    1,
  )
  assert.equal(countFilledAssetRowsInCategories([{ rows: [] }]), 0)
  assert.equal(countFilledAssetRowsInCategories(undefined), 0)
})
