import test from 'node:test'
import assert from 'node:assert/strict'

import { loginSchema, signupSchema } from '../schemas.ts'

test('loginSchema accepts valid credentials', () => {
  const parsed = loginSchema.parse({
    email: 'user@example.com',
    password: 'Password1!',
  })

  assert.equal(parsed.email, 'user@example.com')
  assert.equal(parsed.password, 'Password1!')
})

test('loginSchema rejects invalid email/password', () => {
  assert.throws(
    () =>
      loginSchema.parse({
        email: 'not-an-email',
        password: 'short',
      }),
    /Enter a valid email|Password must be at least 8 characters/,
  )
})

test('signupSchema accepts valid payload with optional passwordHint', () => {
  const parsed = signupSchema.parse({
    name: 'John',
    email: 'john@example.com',
    password: 'Passwordx!',
    confirmPassword: 'Passwordx!',
    passwordHint: '',
  })

  assert.equal(parsed.name, 'John')
  assert.equal(parsed.email, 'john@example.com')
})

test('signupSchema rejects mismatched confirmPassword', () => {
  assert.throws(
    () =>
      signupSchema.parse({
        name: 'John',
        email: 'john@example.com',
        password: 'Passwordx!',
        confirmPassword: 'Passwordy!',
      }),
    /Passwords don't match/,
  )
})

test('signupSchema rejects password missing uppercase or special character', () => {
  assert.throws(
    () =>
      signupSchema.parse({
        name: 'John',
        email: 'john@example.com',
        password: 'abcdefgh1',
        confirmPassword: 'abcdefgh1',
      }),
    /uppercase|special/i,
  )
})
