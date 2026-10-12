import test from 'node:test'
import assert from 'node:assert/strict'

import { cn } from '../cn.ts'

test('cn joins plain class names with spaces', () => {
  assert.equal(cn('p-2', 'text-sm', 'font-medium'), 'p-2 text-sm font-medium')
})

test('cn removes falsy and non-string values', () => {
  assert.equal(cn('p-2', false, undefined, null, 'text-sm'), 'p-2 text-sm')
})

test('cn flattens one-level arrays and filters invalid entries', () => {
  assert.equal(cn(['p-2', '', null, 'text-sm'], 'font-medium'), 'p-2 text-sm font-medium')
})
