import assert from 'node:assert/strict'
import test from 'node:test'

import type { Subscription } from '../../api/billing-api'
import {
  billingIntervalKey,
  isSelectedPlanDifferent,
  shouldOpenBillingPortalForSubscribe,
} from '../plan-change'

const basicMonthly: Subscription = {
  id: 'sub-1',
  status: 'active',
  tier: 'basic',
  billingInterval: 'month',
  currentPeriodStart: '2026-01-01T00:00:00Z',
  currentPeriodEnd: '2026-02-01T00:00:00Z',
  cancelAtPeriodEnd: false,
}

test('billingIntervalKey maps monthly and yearly selectors', () => {
  assert.equal(billingIntervalKey('monthly'), 'month')
  assert.equal(billingIntervalKey('yearly'), 'year')
})

test('isSelectedPlanDifferent detects tier and interval changes', () => {
  assert.equal(isSelectedPlanDifferent(basicMonthly, 'basic', 'monthly'), false)
  assert.equal(isSelectedPlanDifferent(basicMonthly, 'pro', 'monthly'), true)
  assert.equal(isSelectedPlanDifferent(basicMonthly, 'basic', 'yearly'), true)
})

test('shouldOpenBillingPortalForSubscribe only when subscribed and plan differs', () => {
  assert.equal(shouldOpenBillingPortalForSubscribe(false, null, 'pro', 'monthly'), false)
  assert.equal(shouldOpenBillingPortalForSubscribe(true, basicMonthly, 'basic', 'monthly'), false)
  assert.equal(shouldOpenBillingPortalForSubscribe(true, basicMonthly, 'pro', 'monthly'), true)
})
