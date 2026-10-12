import test from 'node:test'
import assert from 'node:assert/strict'

import { releaseKeys, trustedCircleKeys } from '../trusted-circle-query-keys.ts'

test('trustedCircleKeys base collections are correctly namespaced', () => {
  assert.deepEqual(trustedCircleKeys.members(), ['trusted-circle', 'members'])
  assert.deepEqual(trustedCircleKeys.memberships(), ['trusted-circle', 'memberships'])
  assert.deepEqual(trustedCircleKeys.invitations(), ['trusted-circle', 'invitations'])
})

test('trustedCircleKeys invitation token and sent keys compose from invitations namespace', () => {
  assert.deepEqual(trustedCircleKeys.token('abc123'), [
    'trusted-circle',
    'invitations',
    'token',
    'abc123',
  ])
  assert.deepEqual(trustedCircleKeys.sentInvitations(), ['trusted-circle', 'invitations', 'sent'])
  assert.deepEqual(trustedCircleKeys.pendingReleaseInvitations(), [
    'trusted-circle',
    'invitations',
    'pendingRelease',
  ])
})

test('trustedCircleKeys pending-access and release pending-claims keys are distinct', () => {
  assert.deepEqual(trustedCircleKeys.pendingAccess(), ['trusted-circle', 'pending-access'])
  assert.deepEqual(releaseKeys.pendingClaims(), ['pending-claims'])
})
