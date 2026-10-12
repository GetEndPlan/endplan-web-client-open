import test from 'node:test'
import assert from 'node:assert/strict'

import type { AssetSchemaCategory } from '../../api/clients/vault-api.ts'
import {
  filterKnownPolicyCategoryIds,
  selectSuggestedPolicyCategories,
} from '../policy-category-suggestions.ts'

const life: AssetSchemaCategory = {
  id: 'life-id',
  key: 'life',
  name: 'Life',
  displayOrder: 1,
  suggestionOrder: 1,
  isActive: true,
  source: 'template',
  fields: [],
}

const health: AssetSchemaCategory = {
  id: 'health-id',
  key: 'health',
  name: 'Health',
  displayOrder: 2,
  suggestionOrder: 2,
  isActive: true,
  source: 'template',
  fields: [],
}

const custom: AssetSchemaCategory = {
  id: 'custom-id',
  key: 'custom',
  name: 'My category',
  displayOrder: 8,
  isActive: true,
  source: 'custom',
  fields: [],
}

test('selectSuggestedPolicyCategories shows only active unselected database templates', () => {
  const suggested = selectSuggestedPolicyCategories(
    [custom, health, { ...life, isActive: false }, life],
    ['health-id'],
  )

  assert.deepEqual(
    suggested.map((category) => category.id),
    ['life-id'],
  )
})

test('selectSuggestedPolicyCategories matches asset ordering by suggestionOrder and limits to three', () => {
  const income: AssetSchemaCategory = {
    ...health,
    id: 'income-id',
    key: 'income',
    name: 'Income',
    displayOrder: 3,
    suggestionOrder: 3,
  }
  const vehicles: AssetSchemaCategory = {
    ...health,
    id: 'vehicles-id',
    key: 'vehicles',
    name: 'Vehicles',
    displayOrder: 5,
    suggestionOrder: 5,
  }
  const unordered: AssetSchemaCategory = {
    ...health,
    id: 'no-suggest-id',
    key: 'no_suggest',
    name: 'Not suggested',
    displayOrder: 0,
    suggestionOrder: 0,
  }

  const suggested = selectSuggestedPolicyCategories(
    [vehicles, income, unordered, health, life],
    [],
  )
  assert.deepEqual(
    suggested.map((category) => category.key),
    ['life', 'health', 'income'],
  )
})

test('filterKnownPolicyCategoryIds drops ids that are not in the schema', () => {
  assert.deepEqual(
    filterKnownPolicyCategoryIds(['stale-key', 'life-id', 'health-id'], [life, health]),
    ['life-id', 'health-id'],
  )
})
