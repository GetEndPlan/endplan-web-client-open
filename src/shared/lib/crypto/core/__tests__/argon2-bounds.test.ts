import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveArgon2idParams, kdfDefaults } from '../../index.ts'

test('resolveArgon2idParams leaves unlock params unchanged even when weak', () => {
  const resolved = resolveArgon2idParams({
    iterations: 1,
    memorySize: 8,
    parallelism: 1,
    hashLength: 32,
    enforceClientBounds: false,
  })
  assert.deepEqual(resolved, {
    iterations: 1,
    memorySize: 8,
    parallelism: 1,
    hashLength: 32,
  })
})

test('resolveArgon2idParams raises weak seal params to client floors', () => {
  const resolved = resolveArgon2idParams({
    iterations: 1,
    memorySize: 8,
    parallelism: 1,
    hashLength: 16,
    enforceClientBounds: true,
  })
  assert.deepEqual(resolved, {
    iterations: kdfDefaults.iterations,
    memorySize: kdfDefaults.memorySize,
    parallelism: kdfDefaults.parallelism,
    hashLength: kdfDefaults.hashLength,
  })
})

test('resolveArgon2idParams caps absurd seal params', () => {
  const resolved = resolveArgon2idParams({
    iterations: 10_000,
    memorySize: 10_000_000,
    parallelism: 128,
    hashLength: 256,
    enforceClientBounds: true,
  })
  assert.equal(resolved.iterations, 64)
  assert.equal(resolved.memorySize, 512 * 1024)
  assert.equal(resolved.parallelism, 16)
  assert.equal(resolved.hashLength, 64)
})
