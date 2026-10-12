import test from 'node:test'
import assert from 'node:assert/strict'

import {
  AUTH_ERROR_CODE,
  AuthClientError,
  parseBetterAuthClientError,
} from '../auth-client-error.ts'

test('parseBetterAuthClientError reads code and message', () => {
  const parsed = parseBetterAuthClientError({
    code: AUTH_ERROR_CODE.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL,
    message: 'User already exists',
  })

  assert.equal(parsed.code, AUTH_ERROR_CODE.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL)
  assert.equal(parsed.message, 'User already exists')
})

test('AuthClientError preserves code', () => {
  const err = new AuthClientError('Signup failed', AUTH_ERROR_CODE.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL)
  assert.equal(err.code, AUTH_ERROR_CODE.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL)
  assert.equal(err.message, 'Signup failed')
})
