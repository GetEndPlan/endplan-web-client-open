/// <reference types="node" />

import {
  cryptoEncoding,
  decryptPrivateKey,
  decryptVaultJson,
  deriveKek,
  encryptPrivateKey,
  encryptVaultJson,
  generateDek,
  generateUserKeyPair,
  wrapDekForPublicKey,
  unwrapDekWithKeyPair,
} from '../src/shared/lib/crypto'

// Minimal demo harness showing the full flow:
// 1) derive KEK from password
// 2) create user keypair, encrypt private key with KEK
// 3) encrypt a vault JSON with a DEK (with HKDF + AAD)
// 4) wrap/unwrap the DEK and decrypt the vault
void (async () => {
  const password = 'correct horse battery staple'
  const { kek, params } = await deriveKek(password)
  console.log('Derived KEK with params:', params)

  const { publicKeyB64, privateKeyB64 } = await generateUserKeyPair()
  console.log('Generated keypair (public key b64 length):', publicKeyB64.length)

  const encryptedPriv = await encryptPrivateKey(privateKeyB64, kek)
  console.log('Encrypted private key (ciphertext length):', encryptedPriv.ciphertextB64.length)

  // Simulate restoring private key
  const restoredPrivB64 = await decryptPrivateKey(encryptedPriv, kek)
  console.log('Restored private key matches:', restoredPrivB64 === privateKeyB64)

  // Vault encryption with HKDF + AAD
  const dek = generateDek()
  const vaultData = { note: 'Hello shared world', ts: Date.now() }
  const vaultId = 'vault-123'
  const ownerId = 'user-456'
  
  const encryptedVault = await encryptVaultJson(vaultData, dek, vaultId, ownerId)
  console.log('Encrypted vault envelope:', {
    v: encryptedVault.v,
    alg: encryptedVault.alg,
    ciphertextLength: encryptedVault.ciphertextB64.length,
  })

  // Wrap/unwrap DEK for this user
  const wrappedDek = await wrapDekForPublicKey(dek, publicKeyB64)
  console.log('Wrapped DEK length:', wrappedDek.length)

  const unwrappedDek = await unwrapDekWithKeyPair(wrappedDek, publicKeyB64, restoredPrivB64)
  console.log('Unwrapped DEK matches:', cryptoEncoding.toBase64(unwrappedDek) === cryptoEncoding.toBase64(dek))

  // Decrypt vault
  const decryptedVault = await decryptVaultJson<typeof vaultData>(encryptedVault, unwrappedDek, vaultId, ownerId)
  console.log('Decrypted vault matches:', JSON.stringify(decryptedVault) === JSON.stringify(vaultData))

  // Demonstrate AAD binding - wrong vaultId should fail
  console.log('\n--- AAD Binding Test ---')
  try {
    await decryptVaultJson<typeof vaultData>(encryptedVault, unwrappedDek, 'wrong-vault-id', ownerId)
    console.log('[AAD] UNEXPECTED: Decryption should have failed with wrong vaultId')
  } catch {
    console.log('[AAD] EXPECTED: Decryption failed with wrong vaultId (AAD mismatch)')
  }

  // Wrong ownerId should also fail
  try {
    await decryptVaultJson<typeof vaultData>(encryptedVault, unwrappedDek, vaultId, 'wrong-owner-id')
    console.log('[AAD] UNEXPECTED: Decryption should have failed with wrong ownerId')
  } catch {
    console.log('[AAD] EXPECTED: Decryption failed with wrong ownerId (AAD mismatch)')
  }
})().catch((err) => {
  console.error('Crypto demo failed:', err)
  process.exitCode = 1
})
