import test from 'node:test'
import assert from 'node:assert/strict'

import { sanitizeUntrustedHtml } from '../sanitize.ts'

test('sanitizeUntrustedHtml escapes dangerous HTML characters', () => {
  const input = `<img src=x onerror='alert(1)'>&"`
  const output = sanitizeUntrustedHtml(input)

  assert.equal(output, '&lt;img src=x onerror=&#39;alert(1)&#39;&gt;&amp;&quot;')
})

test('sanitizeUntrustedHtml preserves plain text', () => {
  assert.equal(sanitizeUntrustedHtml('plain text'), 'plain text')
})
