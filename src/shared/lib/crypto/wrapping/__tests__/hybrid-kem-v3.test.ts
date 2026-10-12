import test from 'node:test'
import assert from 'node:assert/strict'

import {
  generateDek,
  generateUserKeyBundle,
  getWrappedDekMetadata,
  recipientExpectsHybridWrap,
  unwrapDekWithKeyPair,
  wrapDekForPublicKey,
  HYBRID_KEM_WRAPPING_VERSION,
} from '../../index.ts'
import type { HybridKemWrappedDekEnvelope } from '../../types.ts'

const VAULT_ID = 'vault-hybrid-kem-v3-test'

test('hybrid v3 wrap unwraps with both private keys', async () => {
  const recipient = await generateUserKeyBundle()
  assert.ok(recipient.pqPublicKeyB64)
  assert.ok(recipient.pqPrivateKeyB64)

  const dek = generateDek()
  const wrapped = await wrapDekForPublicKey(
    dek,
    recipient.publicKeyB64,
    recipient.pqPublicKeyB64,
    { vaultId: VAULT_ID },
  )

  const metadata = getWrappedDekMetadata(wrapped)
  assert.equal(metadata.wrappingVersion, HYBRID_KEM_WRAPPING_VERSION)
  assert.equal(metadata.wrappingScheme, 'hybrid-x25519-mlkem768-hkdf-aes-256-gcm')

  const unwrapped = await unwrapDekWithKeyPair(
    wrapped,
    recipient.publicKeyB64,
    recipient.privateKeyB64,
    recipient.pqPrivateKeyB64,
    { vaultId: VAULT_ID },
  )
  assert.deepEqual(unwrapped, dek)
})

test('hybrid v3 wrap cannot be unwrapped with only the X25519 private key', async () => {
  const recipient = await generateUserKeyBundle()
  const other = await generateUserKeyBundle()
  assert.ok(recipient.pqPublicKeyB64)
  assert.ok(other.pqPrivateKeyB64)

  const dek = generateDek()
  const wrapped = await wrapDekForPublicKey(
    dek,
    recipient.publicKeyB64,
    recipient.pqPublicKeyB64,
    { vaultId: VAULT_ID },
  )

  // Pass a wrong ML-KEM private key so unwrap exercises combiner decrypt, not the null-PQ guard.
  await assert.rejects(
    () =>
      unwrapDekWithKeyPair(
        wrapped,
        recipient.publicKeyB64,
        recipient.privateKeyB64,
        other.pqPrivateKeyB64,
        { vaultId: VAULT_ID },
      ),
    /Unable to unwrap DEK with the hybrid recipient keys/,
  )
})

test('hybrid v3 wrap cannot be unwrapped with only the ML-KEM private key', async () => {
  const recipient = await generateUserKeyBundle()
  const other = await generateUserKeyBundle()
  assert.ok(recipient.pqPrivateKeyB64)
  assert.ok(other.privateKeyB64)

  const dek = generateDek()
  const wrapped = await wrapDekForPublicKey(
    dek,
    recipient.publicKeyB64,
    recipient.pqPublicKeyB64,
    { vaultId: VAULT_ID },
  )

  await assert.rejects(
    () =>
      unwrapDekWithKeyPair(
        wrapped,
        recipient.publicKeyB64,
        other.privateKeyB64,
        recipient.pqPrivateKeyB64,
        { vaultId: VAULT_ID },
      ),
    /Unable to unwrap DEK with the hybrid recipient keys/,
  )
})

test('hybrid v3 wrap rejects a mismatched vault id', async () => {
  const recipient = await generateUserKeyBundle()
  const dek = generateDek()
  const wrapped = await wrapDekForPublicKey(
    dek,
    recipient.publicKeyB64,
    recipient.pqPublicKeyB64,
    { vaultId: VAULT_ID },
  )

  await assert.rejects(
    () =>
      unwrapDekWithKeyPair(
        wrapped,
        recipient.publicKeyB64,
        recipient.privateKeyB64,
        recipient.pqPrivateKeyB64,
        { vaultId: 'different-vault' },
      ),
    /Unable to unwrap DEK with the hybrid recipient keys/,
  )
})

test('hybrid v3 wrap rejects stripped algorithm metadata', async () => {
  const recipient = await generateUserKeyBundle()
  const dek = generateDek()
  const wrapped = await wrapDekForPublicKey(
    dek,
    recipient.publicKeyB64,
    recipient.pqPublicKeyB64,
    { vaultId: VAULT_ID },
  )

  const envelope = JSON.parse(wrapped) as Omit<HybridKemWrappedDekEnvelope, 'wrappingScheme'> & {
    wrappingScheme: string
  }
  envelope.wrappingScheme = 'x25519-hkdf-aes-256-gcm'
  const tampered = JSON.stringify(envelope)

  await assert.rejects(
    () =>
      unwrapDekWithKeyPair(
        tampered,
        recipient.publicKeyB64,
        recipient.privateKeyB64,
        recipient.pqPrivateKeyB64,
        { vaultId: VAULT_ID },
      ),
  )
})

test('classic wrap is used when the recipient has no PQ public key', async () => {
  const recipient = await generateUserKeyBundle()
  const dek = generateDek()
  const wrapped = await wrapDekForPublicKey(dek, recipient.publicKeyB64, null, {
    vaultId: VAULT_ID,
  })
  const metadata = getWrappedDekMetadata(wrapped)
  assert.equal(metadata.wrappingVersion, 1)

  const unwrapped = await unwrapDekWithKeyPair(
    wrapped,
    recipient.publicKeyB64,
    recipient.privateKeyB64,
    recipient.pqPrivateKeyB64,
    { vaultId: VAULT_ID },
  )
  assert.deepEqual(unwrapped, dek)
})

test('requireHybrid refuses classic fallback when PQ public key is missing', async () => {
  const recipient = await generateUserKeyBundle()
  const dek = generateDek()

  await assert.rejects(
    () =>
      wrapDekForPublicKey(dek, recipient.publicKeyB64, null, {
        vaultId: VAULT_ID,
        requireHybrid: true,
      }),
    /Hybrid DEK wrapping is required but recipient PQ public key is missing/,
  )
})

test('recipientExpectsHybridWrap is true for keyBundleVersion >= 2 even without PQ bytes', () => {
  assert.equal(recipientExpectsHybridWrap({ keyBundleVersion: 2, pqPublicKeyB64: null }), true)
  assert.equal(recipientExpectsHybridWrap({ keyBundleVersion: 1, pqPublicKeyB64: null }), false)
  assert.equal(
    recipientExpectsHybridWrap({ keyBundleVersion: 1, pqPublicKeyB64: 'pq-key' }),
    true,
  )
})
