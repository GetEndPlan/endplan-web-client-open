import test from 'node:test'
import assert from 'node:assert/strict'

import { isInviteOnlyKeyPersonOnboarding } from '../key-person-onboarding.ts'

test('invite-only when server reports pending ack', () => {
  assert.equal(
    isInviteOnlyKeyPersonOnboarding({
      subscriptionLoaded: true,
      keyPersonBillingPendingAck: true,
    }),
    true,
  )
})

test('not invite-only when established before invite on free tier', () => {
  assert.equal(
    isInviteOnlyKeyPersonOnboarding({
      subscriptionLoaded: true,
      keyPersonBillingPendingAck: true,
      keyPersonEstablishedBeforeInvite: true,
    }),
    false,
  )
})

test('not invite-only while subscription is still loading', () => {
  assert.equal(
    isInviteOnlyKeyPersonOnboarding({
      subscriptionLoaded: false,
      keyPersonBillingPendingAck: true,
    }),
    false,
  )
})
