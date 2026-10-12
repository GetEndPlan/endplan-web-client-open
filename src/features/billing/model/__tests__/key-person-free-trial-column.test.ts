import test from 'node:test'
import assert from 'node:assert/strict'

import { shouldShowKeyPersonFreeTrialColumn } from '../key-person-free-trial-column.ts'

test('shows when server reports pending ack', () => {
  assert.equal(
    shouldShowKeyPersonFreeTrialColumn({
      keyPersonBillingPendingAck: true,
      hasActiveSubscription: false,
      isLoadingSubscription: false,
      isFetchingSubscription: false,
      fromKeyPersonStartOwnFlow: false,
    }),
    true,
  )
})

test('shows while subscription loads from start-own EndPlan navigation', () => {
  assert.equal(
    shouldShowKeyPersonFreeTrialColumn({
      keyPersonBillingPendingAck: false,
      hasActiveSubscription: false,
      isLoadingSubscription: true,
      isFetchingSubscription: false,
      fromKeyPersonStartOwnFlow: true,
    }),
    true,
  )
})

test('hides after load when server denies pending ack', () => {
  assert.equal(
    shouldShowKeyPersonFreeTrialColumn({
      keyPersonBillingPendingAck: false,
      hasActiveSubscription: false,
      isLoadingSubscription: false,
      isFetchingSubscription: false,
      fromKeyPersonStartOwnFlow: true,
    }),
    false,
  )
})

test('hides when user already has an active subscription', () => {
  assert.equal(
    shouldShowKeyPersonFreeTrialColumn({
      keyPersonBillingPendingAck: true,
      hasActiveSubscription: true,
      isLoadingSubscription: false,
      isFetchingSubscription: false,
      fromKeyPersonStartOwnFlow: true,
    }),
    false,
  )
})
