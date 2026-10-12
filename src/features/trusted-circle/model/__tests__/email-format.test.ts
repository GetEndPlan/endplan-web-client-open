import test from 'node:test'
import assert from 'node:assert/strict'

import { inviteEmailFieldError, isValidInviteEmail } from '../email-format.ts'

test('inviteEmailFieldError shows format issues while typing and required only when requested', () => {
  const messages = { required: 'required', invalid: 'invalid' }

  assert.equal(inviteEmailFieldError('', messages, false), null)
  assert.equal(inviteEmailFieldError('', messages, true), 'required')
  assert.equal(inviteEmailFieldError('user@', messages, false), 'invalid')
  assert.equal(inviteEmailFieldError('user@example.com', messages, true), null)
})

test('isValidInviteEmail accepts a normal address', () => {
  assert.equal(isValidInviteEmail('user@example.com'), true)
  assert.equal(isValidInviteEmail('  ada@endplan.com  '), true)
})

test('isValidInviteEmail rejects incomplete or invalid addresses', () => {
  assert.equal(isValidInviteEmail(''), false)
  assert.equal(isValidInviteEmail('not-an-email'), false)
  assert.equal(isValidInviteEmail('user@'), false)
  assert.equal(isValidInviteEmail('user@domain'), false)
  assert.equal(isValidInviteEmail('user@domain.'), false)
  assert.equal(isValidInviteEmail('user name@example.com'), false)
})
