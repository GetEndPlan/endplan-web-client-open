import test from 'node:test'
import assert from 'node:assert/strict'

import { isValidOptionalPhoneNumber } from '../phone-format.ts'

test('isValidOptionalPhoneNumber accepts an empty optional phone', () => {
  assert.equal(isValidOptionalPhoneNumber(''), true)
  assert.equal(isValidOptionalPhoneNumber('   '), true)
})

test('isValidOptionalPhoneNumber accepts international formatted numbers', () => {
  assert.equal(isValidOptionalPhoneNumber('+1 415 555 0124'), true)
  assert.equal(isValidOptionalPhoneNumber('+33 6 12 34 56 78'), true)
  assert.equal(isValidOptionalPhoneNumber('(415) 555-0124'), true)
})

test('isValidOptionalPhoneNumber rejects incomplete or invalid formats', () => {
  assert.equal(isValidOptionalPhoneNumber('+1'), false)
  assert.equal(isValidOptionalPhoneNumber('+1 (555)'), false)
  assert.equal(isValidOptionalPhoneNumber('123'), false)
  assert.equal(isValidOptionalPhoneNumber('000-0000'), false)
  assert.equal(isValidOptionalPhoneNumber('abc'), false)
  assert.equal(isValidOptionalPhoneNumber('+1 (555) 000-0000 extra'), false)
})
