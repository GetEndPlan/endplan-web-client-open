import test from 'node:test'
import assert from 'node:assert/strict'

import { scrubAnalyticsUrl } from '../scrub-analytics-url.ts'

test('scrubAnalyticsUrl redacts invite path tokens', () => {
  assert.equal(
    scrubAnalyticsUrl('https://app.endplan.com/invite/super-secret-token'),
    '/invite/:token',
  )
})

test('scrubAnalyticsUrl redacts invite and email query params', () => {
  assert.equal(
    scrubAnalyticsUrl('https://app.endplan.com/signup?invite=abc&email=a%40b.com&name=Ada'),
    '/signup?invite=redacted&email=redacted&name=redacted',
  )
})
