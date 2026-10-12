import test from 'node:test'
import assert from 'node:assert/strict'

import { getBillingHeaderSubtitle } from '../billing-copy.ts'

const dateFormatter = (value: string) => `formatted(${value})`
const translation = (key: string, options?: Record<string, unknown>) => {
  switch (key) {
    case 'billing.header.activeSubtitle':
      return 'Manage your plan and billing settings.'
    case 'billing.header.trialSubtitle':
      return `Your trial ends on ${options?.date}. Choose a plan to keep full access.`
    case 'billing.header.endedSubtitle':
      return 'Your trial has ended. Choose a plan to continue using EndPlan.'
    case 'billing.header.chooserSubtitle':
      return 'Choose the best plan for you and your workspace.'
    default:
      return key
  }
}

test('billing subtitle prefers active subscription message', () => {
  const subtitle = getBillingHeaderSubtitle({
    hasActiveSubscription: true,
    inTrial: true,
    trialEndsAt: '2026-03-31',
    canAccess: false,
    formatDate: dateFormatter,
    t: translation,
  })

  assert.equal(subtitle, 'Manage your plan and billing settings.')
})

test('billing subtitle shows trial ending message when trial is active', () => {
  const subtitle = getBillingHeaderSubtitle({
    hasActiveSubscription: false,
    inTrial: true,
    trialEndsAt: '2026-03-31',
    canAccess: true,
    formatDate: dateFormatter,
    t: translation,
  })

  assert.equal(
    subtitle,
    'Your trial ends on formatted(2026-03-31). Choose a plan to keep full access.',
  )
})

test('billing subtitle shows access-ended message when trial is over', () => {
  const subtitle = getBillingHeaderSubtitle({
    hasActiveSubscription: false,
    inTrial: false,
    trialEndsAt: null,
    canAccess: false,
    formatDate: dateFormatter,
    t: translation,
  })

  assert.equal(subtitle, 'Your trial has ended. Choose a plan to continue using EndPlan.')
})

test('billing subtitle falls back to default chooser copy', () => {
  const subtitle = getBillingHeaderSubtitle({
    hasActiveSubscription: false,
    inTrial: false,
    trialEndsAt: null,
    canAccess: true,
    formatDate: dateFormatter,
    t: translation,
  })

  assert.equal(subtitle, 'Choose the best plan for you and your workspace.')
})
