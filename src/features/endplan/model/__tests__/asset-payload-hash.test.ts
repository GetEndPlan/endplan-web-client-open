import test from 'node:test'
import assert from 'node:assert/strict'

import { hashAssetPayload } from '../asset-payload-hash.ts'
import type { AssetSectionPayloadV2 } from '../asset-table-model.ts'

test('hashAssetPayload is stable across object key order', () => {
  const payloadA: AssetSectionPayloadV2 = {
    schemaVersion: 2,
    categories: [
      {
        categoryTemplateId: 'bank',
        rows: [
          {
            id: 'row-1',
            values: {
              account_number: '123',
              asset_name: 'Checking',
            },
          },
        ],
      },
    ],
  }

  const payloadB: AssetSectionPayloadV2 = {
    categories: [
      {
        rows: [
          {
            values: {
              asset_name: 'Checking',
              account_number: '123',
            },
            id: 'row-1',
          },
        ],
        categoryTemplateId: 'bank',
      },
    ],
    schemaVersion: 2,
  }

  assert.equal(hashAssetPayload(payloadA), hashAssetPayload(payloadB))
})

test('hashAssetPayload changes when content changes', () => {
  const base: AssetSectionPayloadV2 = {
    schemaVersion: 2,
    categories: [{ categoryTemplateId: 'bank', rows: [{ id: 'row-1', values: { asset_name: 'A' } }] }],
  }
  const changed: AssetSectionPayloadV2 = {
    schemaVersion: 2,
    categories: [{ categoryTemplateId: 'bank', rows: [{ id: 'row-1', values: { asset_name: 'B' } }] }],
  }

  assert.notEqual(hashAssetPayload(base), hashAssetPayload(changed))
})

test('hashAssetPayload preserves array ordering semantics', () => {
  const payloadA: AssetSectionPayloadV2 = {
    schemaVersion: 2,
    categories: [
      { categoryTemplateId: 'bank', rows: [{ id: 'r1', values: { name: 'A' } }] },
      { categoryTemplateId: 'crypto', rows: [{ id: 'r2', values: { name: 'B' } }] },
    ],
  }
  const payloadB: AssetSectionPayloadV2 = {
    schemaVersion: 2,
    categories: [
      { categoryTemplateId: 'crypto', rows: [{ id: 'r2', values: { name: 'B' } }] },
      { categoryTemplateId: 'bank', rows: [{ id: 'r1', values: { name: 'A' } }] },
    ],
  }

  assert.notEqual(hashAssetPayload(payloadA), hashAssetPayload(payloadB))
})

test('hashAssetPayload canonicalizes nested object keys recursively', () => {
  const payloadA = {
    schemaVersion: 2,
    categories: [{ categoryTemplateId: 'bank', rows: [] }],
    metadata: {
      nested: {
        z: 1,
        a: 2,
      },
    },
  } as unknown as AssetSectionPayloadV2

  const payloadB = {
    categories: [{ rows: [], categoryTemplateId: 'bank' }],
    metadata: {
      nested: {
        a: 2,
        z: 1,
      },
    },
    schemaVersion: 2,
  } as unknown as AssetSectionPayloadV2

  assert.equal(hashAssetPayload(payloadA), hashAssetPayload(payloadB))
})
