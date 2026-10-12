import test from 'node:test'
import assert from 'node:assert/strict'

import { isEmptyVaultEnvelope } from '../empty-vault-envelope.ts'

test('isEmptyVaultEnvelope is true only for the vault-shell placeholder', () => {
  assert.equal(isEmptyVaultEnvelope({ ciphertextB64: '', ivB64: '' }), true)
  assert.equal(isEmptyVaultEnvelope({ ciphertextB64: 'abc', ivB64: '' }), false)
  assert.equal(isEmptyVaultEnvelope({ ciphertextB64: '', ivB64: 'abc' }), false)
  assert.equal(isEmptyVaultEnvelope({ ciphertextB64: 'abc', ivB64: 'def' }), false)
})
