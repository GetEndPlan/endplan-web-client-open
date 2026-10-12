import test from 'node:test'
import assert from 'node:assert/strict'

import { ApiError } from '@/shared/api/client.ts'
import type { AssetSchemaCategory } from '../../../api/clients/vault-api.ts'
import type { AssetSectionPayloadV2 } from '../../../model/asset-table-model.ts'
import { hashAssetPayload } from '../../../model/asset-payload-hash.ts'
import type { PendingAssetsAutosaveSnapshot } from '../../../model/assets-autosave-queue.ts'
import {
  buildAssetsHydrationKey,
  buildPayloadWithInitialRowsForAddedCategories,
  countAssetRowsInPayload,
  filterAssetCategoriesBySelection,
  isLikelyOfflineError,
  resolveAssetsHydrationSelectedCategoryIds,
  shouldApplyPendingAssetsSnapshot,
  shouldApplyServerHydratedAssetsPayload,
  withSelectedCategories,
} from '../vault-assets-shared.ts'

const schemaCategories: AssetSchemaCategory[] = [
  {
    id: 'bank',
    key: 'bank',
    name: 'Bank Accounts',
    displayOrder: 1,
    isActive: true,
    fields: [],
  },
  {
    id: 'crypto',
    key: 'crypto',
    name: 'Crypto',
    displayOrder: 2,
    isActive: true,
    fields: [],
  },
  {
    id: 'real-estate',
    key: 'real_estate',
    name: 'Real Estate',
    displayOrder: 3,
    isActive: true,
    fields: [],
  },
]

test('withSelectedCategories keeps selected ordering, preserves rows, and fills schema names', () => {
  const payload: AssetSectionPayloadV2 = {
    schemaVersion: 2,
    categories: [
      {
        categoryTemplateId: 'bank',
        rows: [{ id: 'row-1', values: { asset_name: 'Checking' } }],
      },
      {
        categoryTemplateId: 'crypto',
        categoryName: 'Custom Crypto Name',
        rows: [{ id: 'row-2', values: { asset_name: 'BTC' } }],
      },
    ],
  }

  const result = withSelectedCategories(payload, ['crypto', 'real-estate', 'bank'], schemaCategories)

  assert.deepEqual(result, {
    schemaVersion: 2,
    categories: [
      {
        categoryTemplateId: 'crypto',
        categoryName: 'Custom Crypto Name',
        rows: [{ id: 'row-2', values: { asset_name: 'BTC' } }],
      },
      {
        categoryTemplateId: 'real-estate',
        categoryName: 'Real Estate',
        rows: [],
      },
      {
        categoryTemplateId: 'bank',
        categoryName: 'Bank Accounts',
        rows: [{ id: 'row-1', values: { asset_name: 'Checking' } }],
      },
    ],
  })
})

test('buildPayloadWithInitialRowsForAddedCategories seeds one empty row for newly added categories', () => {
  const payload: AssetSectionPayloadV2 = {
    schemaVersion: 2,
    categories: [],
  }

  const result = buildPayloadWithInitialRowsForAddedCategories({
    payload,
    selectedCategoryIds: ['bank'],
    schemaCategories,
    addedCategoryTemplateIds: ['bank'],
  })

  assert.equal(result.categories.length, 1)
  assert.equal(result.categories[0]?.categoryTemplateId, 'bank')
  assert.equal(result.categories[0]?.categoryName, 'Bank Accounts')
  assert.equal(result.categories[0]?.rows.length, 1)
  assert.deepEqual(result.categories[0]?.rows[0]?.values, {})
})

test('buildAssetsHydrationKey distinguishes empty and section-backed asset state', () => {
  assert.equal(buildAssetsHydrationKey('vault-1', null), 'vault:vault-1:assets:none')
  assert.equal(
    buildAssetsHydrationKey('vault-1', { id: 'section-1', updatedAt: '2026-03-23T10:00:00Z' }),
    'vault:vault-1:assets:section-1:2026-03-23T10:00:00Z',
  )
})

test('isLikelyOfflineError treats transport failures as offline but excludes API errors', () => {
  assert.equal(isLikelyOfflineError(new TypeError('Failed to fetch')), true)
  assert.equal(isLikelyOfflineError(new Error('Network request failed')), true)
  assert.equal(isLikelyOfflineError(new ApiError(409, 'Conflict')), false)
})

test('shouldApplyPendingAssetsSnapshot rejects empty pending draft over server rows', () => {
  const serverPayload: AssetSectionPayloadV2 = {
    schemaVersion: 2,
    categories: [
      {
        categoryTemplateId: 'bank',
        rows: [{ id: 'row-1', values: { asset_name: 'Checking' } }],
      },
    ],
  }
  const serverPayloadHash = hashAssetPayload(serverPayload)
  const pending: PendingAssetsAutosaveSnapshot = {
    vaultId: 'vault-1',
    payload: { schemaVersion: 2, categories: [{ categoryTemplateId: 'bank', rows: [] }] },
    selectedCategoryIds: ['bank'],
    payloadHash: hashAssetPayload({
      schemaVersion: 2,
      categories: [{ categoryTemplateId: 'bank', rows: [] }],
    }),
    lastPersistedPayloadHash: serverPayloadHash,
    updatedAt: Date.now(),
  }

  assert.equal(
    shouldApplyPendingAssetsSnapshot({
      pending,
      serverPayload,
      serverPayloadHash,
      schemaCategories,
    }),
    false,
  )
})

test('shouldApplyPendingAssetsSnapshot accepts pending draft forked from server baseline', () => {
  const serverPayload: AssetSectionPayloadV2 = {
    schemaVersion: 2,
    categories: [
      {
        categoryTemplateId: 'bank',
        rows: [{ id: 'row-1', values: { asset_name: 'Checking' } }],
      },
    ],
  }
  const serverPayloadHash = hashAssetPayload(serverPayload)
  const pendingPayload: AssetSectionPayloadV2 = {
    schemaVersion: 2,
    categories: [
      {
        categoryTemplateId: 'bank',
        rows: [
          { id: 'row-1', values: { asset_name: 'Checking' } },
          { id: 'row-2', values: { asset_name: 'Savings' } },
        ],
      },
    ],
  }
  const pending: PendingAssetsAutosaveSnapshot = {
    vaultId: 'vault-1',
    payload: pendingPayload,
    selectedCategoryIds: ['bank'],
    payloadHash: hashAssetPayload(pendingPayload),
    lastPersistedPayloadHash: serverPayloadHash,
    updatedAt: Date.now(),
  }

  assert.equal(
    shouldApplyPendingAssetsSnapshot({
      pending,
      serverPayload,
      serverPayloadHash,
      schemaCategories,
    }),
    true,
  )
})

test('resolveAssetsHydrationSelectedCategoryIds prefers schema once loaded', () => {
  assert.deepEqual(
    resolveAssetsHydrationSelectedCategoryIds({
      schemaSelectedCategoryIds: ['bank'],
      payloadCategoryIds: ['bank', 'crypto'],
      isSchemaLoaded: true,
    }),
    ['bank'],
  )
})

test('resolveAssetsHydrationSelectedCategoryIds infers from payload while schema is loading', () => {
  assert.deepEqual(
    resolveAssetsHydrationSelectedCategoryIds({
      schemaSelectedCategoryIds: [],
      payloadCategoryIds: ['bank', 'crypto'],
      isSchemaLoaded: false,
    }),
    ['bank', 'crypto'],
  )
})

test('countAssetRowsInPayload sums rows across categories', () => {
  const payload: AssetSectionPayloadV2 = {
    schemaVersion: 2,
    categories: [
      { categoryTemplateId: 'bank', rows: [{ id: '1', values: {} }, { id: '2', values: {} }] },
      { categoryTemplateId: 'crypto', rows: [{ id: '3', values: {} }] },
    ],
  }
  assert.equal(countAssetRowsInPayload(payload), 3)
})

test('shouldApplyServerHydratedAssetsPayload rejects stale server payload with fewer rows', () => {
  const lastPersistedPayload: AssetSectionPayloadV2 = {
    schemaVersion: 2,
    categories: [
      {
        categoryTemplateId: 'bank',
        rows: [{ id: 'row-1', values: { asset_name: 'Checking' } }],
      },
    ],
  }
  const serverPayload: AssetSectionPayloadV2 = {
    schemaVersion: 2,
    categories: [{ categoryTemplateId: 'bank', rows: [] }],
  }
  const serverPayloadHash = hashAssetPayload(serverPayload)
  const lastPersistedPayloadHash = hashAssetPayload(lastPersistedPayload)

  assert.equal(
    shouldApplyServerHydratedAssetsPayload({
      serverPayload,
      serverPayloadHash,
      lastPersistedPayload,
      lastPersistedPayloadHash,
    }),
    false,
  )
})

test('shouldApplyServerHydratedAssetsPayload accepts matching server hash', () => {
  const payload: AssetSectionPayloadV2 = {
    schemaVersion: 2,
    categories: [
      {
        categoryTemplateId: 'bank',
        rows: [{ id: 'row-1', values: { asset_name: 'Checking' } }],
      },
    ],
  }
  const payloadHash = hashAssetPayload(payload)

  assert.equal(
    shouldApplyServerHydratedAssetsPayload({
      serverPayload: payload,
      serverPayloadHash: payloadHash,
      lastPersistedPayload: payload,
      lastPersistedPayloadHash: payloadHash,
    }),
    true,
  )
})

test('filterAssetCategoriesBySelection uses schema selection when loaded', () => {
  const blobCategories = [
    { categoryTemplateId: 'bank', rows: [{ id: '1' }] },
    { categoryTemplateId: 'crypto', rows: [{ id: '2' }] },
  ]

  assert.deepEqual(filterAssetCategoriesBySelection(blobCategories, [], true), [])
  assert.deepEqual(
    filterAssetCategoriesBySelection(blobCategories, ['bank'], true),
    [blobCategories[0]],
  )
  assert.deepEqual(filterAssetCategoriesBySelection(blobCategories, ['bank'], false), [])
})
