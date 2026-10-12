import assert from 'node:assert/strict'
import test from 'node:test'

import { ApiError } from '@/shared/api'
import { shouldSuppressPostResetCleanupError } from '../post-reset-cleanup-errors'

test('shouldSuppressPostResetCleanupError returns true for forbidden API responses', () => {
  assert.equal(shouldSuppressPostResetCleanupError(new ApiError(403, 'Forbidden')), true)
})

test('shouldSuppressPostResetCleanupError returns false for non-403 errors', () => {
  assert.equal(shouldSuppressPostResetCleanupError(new ApiError(500, 'Internal Server Error')), false)
  assert.equal(shouldSuppressPostResetCleanupError(new Error('network failed')), false)
})
