import test from 'node:test'
import assert from 'node:assert/strict'

import {
  __resetTrustedTypesPolicyForTests,
  installTrustedTypesPolicy,
} from '../trusted-types.ts'

test('installTrustedTypesPolicy creates policy once when supported', () => {
  __resetTrustedTypesPolicyForTests()

  const calls: string[] = []
  const fakeWindow = {
    trustedTypes: {
      createPolicy(name: string, rules: unknown) {
        void rules
        calls.push(name)
        return {}
      },
    },
  }

  installTrustedTypesPolicy(fakeWindow)
  installTrustedTypesPolicy(fakeWindow)

  assert.deepEqual(calls, ['endplan'])
})

test('installTrustedTypesPolicy is a no-op when trustedTypes is unavailable', () => {
  __resetTrustedTypesPolicyForTests()

  assert.doesNotThrow(() => installTrustedTypesPolicy({}))
})
