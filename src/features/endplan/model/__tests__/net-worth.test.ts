import assert from 'node:assert/strict'
import test from 'node:test'
import type { AssetSchemaCategory } from '../../api/clients/vault-api'
import type { AssetSectionPayloadV2 } from '../asset-table-model'
import {
  buildNetWorthSummary,
  groupNetWorthSlicesForDisplay,
  NET_WORTH_OTHER_SLICE_ID,
  parsePositiveMoneyAmount,
} from '../net-worth'

const bankCategory: AssetSchemaCategory = {
  id: 'bank',
  key: 'bank_account',
  name: 'Bank',
  displayOrder: 1,
  isActive: true,
  fields: [
    {
      id: 'f1',
      key: 'asset_name',
      label: 'Name',
      fieldType: 'text',
      required: true,
      displayOrder: 1,
      source: 'template',
    },
    {
      id: 'f2',
      key: 'value',
      label: 'Value',
      fieldType: 'value',
      required: false,
      displayOrder: 2,
      source: 'template',
    },
    {
      id: 'f3',
      key: 'value_2',
      label: 'Other Value',
      fieldType: 'value',
      required: false,
      displayOrder: 3,
      source: 'custom',
    },
  ],
}

const propertyCategory: AssetSchemaCategory = {
  id: 'property',
  key: 'property_deed',
  name: 'Property',
  displayOrder: 2,
  isActive: true,
  fields: [
    {
      id: 'f4',
      key: 'asset_name',
      label: 'Name',
      fieldType: 'text',
      required: true,
      displayOrder: 1,
      source: 'template',
    },
    {
      id: 'f5',
      key: 'value',
      label: 'Value',
      fieldType: 'value',
      required: false,
      displayOrder: 2,
      source: 'template',
    },
  ],
}

const schemaCategories = [bankCategory, propertyCategory]

const payload: AssetSectionPayloadV2 = {
  schemaVersion: 2,
  categories: [
    {
      categoryTemplateId: 'bank',
      rows: [
        { id: 'row-1', values: { asset_name: 'Trading Account', value: '120000', value_2: '5000' } },
        { id: 'row-2', values: { asset_name: 'Empty', value: '' } },
        { id: 'row-3', values: { asset_name: 'Negative', value: '-100' } },
        { id: 'row-4', values: { asset_name: 'Zero', value: '0' } },
        { id: 'row-5', values: { asset_name: 'Invalid', value: 'abc' } },
      ],
    },
    {
      categoryTemplateId: 'property',
      rows: [{ id: 'row-6', values: { asset_name: 'House', value: '450000.50' } }],
    },
  ],
}

test('parsePositiveMoneyAmount accepts positive decimals and rejects invalid values', () => {
  assert.equal(parsePositiveMoneyAmount('120000'), 120000)
  assert.equal(parsePositiveMoneyAmount('450000.50'), 450000.5)
  assert.equal(parsePositiveMoneyAmount('$1,234.56'), 1234.56)
  assert.equal(parsePositiveMoneyAmount(''), null)
  assert.equal(parsePositiveMoneyAmount('abc'), null)
  assert.equal(parsePositiveMoneyAmount('-100'), null)
  assert.equal(parsePositiveMoneyAmount('0'), null)
})

test('buildNetWorthSummary creates one slice per row and sums multiple value fields', () => {
  const summary = buildNetWorthSummary(payload, schemaCategories)

  assert.equal(summary.hasValueColumns, true)
  assert.equal(summary.slices.length, 2)
  assert.deepEqual(
    summary.slices.map((slice) => ({ label: slice.label, value: slice.value })),
    [
      { label: 'House', value: 450000.5 },
      { label: 'Trading Account', value: 125000 },
    ],
  )
  assert.equal(summary.total, 575000.5)
})

test('buildNetWorthSummary sorts slices by value descending for color assignment', () => {
  const summary = buildNetWorthSummary(
    {
      schemaVersion: 2,
      categories: [
        {
          categoryTemplateId: 'bank',
          rows: [
            { id: 'row-low', values: { asset_name: 'Savings', value: '1000' } },
            { id: 'row-high', values: { asset_name: 'Brokerage', value: '50000' } },
          ],
        },
      ],
    },
    schemaCategories,
  )

  assert.deepEqual(
    summary.slices.map((slice) => slice.label),
    ['Brokerage', 'Savings'],
  )
})

test('buildNetWorthSummary resolves primary text field when asset_name key differs', () => {
  const customNameCategory: AssetSchemaCategory = {
    ...bankCategory,
    fields: [
      {
        id: 'f-name',
        key: 'property_name',
        label: 'Property Name',
        fieldType: 'text',
        required: true,
        displayOrder: 1,
        source: 'custom',
      },
      bankCategory.fields![1],
    ],
  }

  const summary = buildNetWorthSummary(
    {
      schemaVersion: 2,
      categories: [
        {
          categoryTemplateId: 'bank',
          rows: [{ id: 'row-1', values: { property_name: 'Lake House', value: '250000' } }],
        },
      ],
    },
    [customNameCategory],
  )

  assert.equal(summary.slices[0]?.label, 'Lake House')
})

test('buildNetWorthSummary reports no value columns when schema has none', () => {
  const summary = buildNetWorthSummary(payload, [
    {
      ...bankCategory,
      fields: (bankCategory.fields ?? []).filter((field) => field.fieldType !== 'value'),
    },
  ])

  assert.equal(summary.hasValueColumns, false)
  assert.deepEqual(summary.slices, [])
  assert.equal(summary.total, 0)
})

test('groupNetWorthSlicesForDisplay returns slices unchanged when count is within limit', () => {
  const slices = [
    { id: 'a', label: 'House', value: 300_000 },
    { id: 'b', label: 'Car', value: 40_000 },
  ]

  assert.deepEqual(groupNetWorthSlicesForDisplay(slices, 'Other assets'), slices)
})

test('groupNetWorthSlicesForDisplay keeps top four assets and sums the remainder into Other assets', () => {
  const slices = [
    { id: '1', label: 'Trading Account', value: 300_000 },
    { id: '2', label: 'House', value: 200_000 },
    { id: '3', label: 'Bank Account', value: 80_000 },
    { id: '4', label: 'Car', value: 40_000 },
    { id: '5', label: 'Boat', value: 25_000 },
    { id: '6', label: 'Jewelry', value: 15_000 },
  ]

  const grouped = groupNetWorthSlicesForDisplay(slices, 'Other assets')

  assert.equal(grouped.length, 5)
  assert.deepEqual(
    grouped.map((slice) => slice.label),
    ['Trading Account', 'House', 'Bank Account', 'Car', 'Other assets'],
  )
  assert.equal(grouped[4]?.id, NET_WORTH_OTHER_SLICE_ID)
  assert.equal(grouped[4]?.value, 40_000)
})

test('groupNetWorthSlicesForDisplay re-sorts so a large Other bucket ranks by amount', () => {
  const slices = [
    { id: '1', label: 'Trading', value: 100 },
    { id: '2', label: 'House', value: 90 },
    { id: '3', label: 'Bank', value: 80 },
    { id: '4', label: 'Car', value: 70 },
    { id: '5', label: 'Boat', value: 60 },
    { id: '6', label: 'Jewelry', value: 50 },
    { id: '7', label: 'Art', value: 40 },
  ]

  const grouped = groupNetWorthSlicesForDisplay(slices, 'Other assets')

  assert.deepEqual(
    grouped.map((slice) => ({ label: slice.label, value: slice.value })),
    [
      { label: 'Other assets', value: 150 },
      { label: 'Trading', value: 100 },
      { label: 'House', value: 90 },
      { label: 'Bank', value: 80 },
      { label: 'Car', value: 70 },
    ],
  )
})

test('groupNetWorthSlicesForDisplay preserves total value across grouped slices', () => {
  const slices = [
    { id: '1', label: 'A', value: 100 },
    { id: '2', label: 'B', value: 90 },
    { id: '3', label: 'C', value: 80 },
    { id: '4', label: 'D', value: 70 },
    { id: '5', label: 'E', value: 10 },
    { id: '6', label: 'F', value: 5 },
  ]

  const grouped = groupNetWorthSlicesForDisplay(slices, 'Other assets')
  const groupedTotal = grouped.reduce((sum, slice) => sum + slice.value, 0)
  const rawTotal = slices.reduce((sum, slice) => sum + slice.value, 0)

  assert.equal(groupedTotal, rawTotal)
})
