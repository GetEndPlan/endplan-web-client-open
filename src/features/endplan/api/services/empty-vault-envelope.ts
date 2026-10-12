/**
 * Placeholder envelope written when creating a vault shell, before the first
 * encrypt-and-update with a real vault id. Decrypting it with AES-GCM throws.
 */
export function isEmptyVaultEnvelope(payload: {
  ciphertextB64: string
  ivB64: string
}): boolean {
  return payload.ciphertextB64.length === 0 && payload.ivB64.length === 0
}
