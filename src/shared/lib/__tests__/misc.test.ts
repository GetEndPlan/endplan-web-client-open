import test from 'node:test'
import assert from 'node:assert/strict'

import { formatDate } from '../misc.ts'

test('formatDate returns a short US date string', () => {
  const formatted = formatDate('2026-03-12T12:00:00.000Z')

  assert.equal(typeof formatted, 'string')
  assert.equal(formatted.length > 0, true)
  assert.equal(/\b\d{4}\b/.test(formatted), true)
})

test('formatDate is deterministic for identical input', () => {
  const input = '2026-03-12T12:00:00.000Z'
  assert.equal(formatDate(input), formatDate(input))
})
