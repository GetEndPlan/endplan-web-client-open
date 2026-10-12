import test from 'node:test'
import assert from 'node:assert/strict'

import { vaultKeys } from '../vault-query-keys.ts'

test('vaultKeys.byId and decrypted keys include vault id and updatedAt', () => {
  assert.deepEqual(vaultKeys.byId('vault-1'), ['vaults', 'vault-1'])
  assert.deepEqual(vaultKeys.decrypted('vault-1', '2026-03-12T00:00:00.000Z'), [
    'vaults',
    'vault-1',
    'decrypted',
    '2026-03-12T00:00:00.000Z',
  ])
  assert.deepEqual(vaultKeys.sharedDecrypted('vault-1', '2026-03-12T00:00:00.000Z'), [
    'vaults',
    'vault-1',
    'shared-decrypted',
    '2026-03-12T00:00:00.000Z',
  ])
})

test('vaultKeys.sharedSectionsDecrypted includes owner and sections hash dimensions', () => {
  assert.deepEqual(vaultKeys.sharedSectionsDecrypted('vault-1', 'owner-1', 'a:b:c'), [
    'vaults',
    'vault-1',
    'shared-sections-decrypted',
    'owner-1',
    'a:b:c',
  ])
})

test('vaultKeys section/document/assets key factories are stable', () => {
  assert.deepEqual(vaultKeys.sections('vault-1'), ['vaults', 'vault-1', 'sections'])
  assert.deepEqual(vaultKeys.ownerSectionsContentSignal('vault-1', 'a|b'), [
    'vaults',
    'vault-1',
    'owner-sections-content-signal',
    'a|b',
  ])
  assert.deepEqual(vaultKeys.sectionById('vault-1', 'section-9'), [
    'vaults',
    'vault-1',
    'sections',
    'section-9',
  ])
  assert.deepEqual(vaultKeys.documentsTree('vault-1'), ['vaults', 'vault-1', 'documents', 'tree'])
  assert.deepEqual(vaultKeys.assetsSchema('vault-1'), ['vaults', 'vault-1', 'assets', 'schema'])
  assert.deepEqual(vaultKeys.netWorth('vault-1', '3'), ['vaults', 'vault-1', 'net-worth', '3'])
  assert.deepEqual(vaultKeys.netWorthRoot('vault-1'), ['vaults', 'vault-1', 'net-worth'])
})

test('vaultKeys.activity isolates pagination dimensions', () => {
  assert.deepEqual(vaultKeys.activity(10, 0), ['vaults', 'activity', 10, 0])
  assert.deepEqual(vaultKeys.activity(10, 10), ['vaults', 'activity', 10, 10])
})
