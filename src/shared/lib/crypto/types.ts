export type KeyBundleVersion = 1 | 2

export type X25519Algorithm = 'X25519'
export type MlKemAlgorithm = 'ML-KEM-768'
export type KeyAlgorithm = X25519Algorithm | MlKemAlgorithm
export type PasswordKdfAlgorithm = 'Argon2id'
export type SharedSecretKdfAlgorithm = 'HKDF-SHA256'

export type PublicKeyBundle = {
  publicKeyB64: string
  keyAlgorithm?: KeyAlgorithm | string | null
  pqPublicKeyB64?: string | null
  pqKeyAlgorithm?: MlKemAlgorithm | string | null
  keyBundleVersion?: number | null
}

export type PrivateKeyBundle = PublicKeyBundle & {
  privateKeyB64: string
  pqPrivateKeyB64?: string | null
}

export type UserKeyBundle = PrivateKeyBundle & {
  passwordKdfAlgorithm: PasswordKdfAlgorithm
  keyBundleVersion: KeyBundleVersion
}

export type WrappedDekMetadata = {
  wrappingVersion: number
  wrappingScheme: string
  asymmetricAlg: KeyAlgorithm | string
  kemAlg?: MlKemAlgorithm | string | null
  kdfAlg: SharedSecretKdfAlgorithm | string
  keyAlgorithms?: KeyAlgorithm[] | string[] | null
}

export type X25519WrappedDekPayload = {
  ephemeralPublicKeyB64: string
  ciphertextB64: string
  ivB64: string
}

export type MlKemWrappedDekPayload = {
  pqCiphertextB64: string
  ciphertextB64: string
  ivB64: string
}

export type X25519WrappedDekEntry = {
  algorithm: 'X25519'
  payload: X25519WrappedDekPayload
}

export type MlKemWrappedDekEntry = {
  algorithm: 'ML-KEM-768'
  payload: MlKemWrappedDekPayload
}

export type WrappedDekEntry = X25519WrappedDekEntry | MlKemWrappedDekEntry

export type X25519WrappedDekEnvelope = WrappedDekMetadata & X25519WrappedDekPayload & {
  wrappingVersion: 1
  wrappingScheme: 'x25519-hkdf-aes-256-gcm'
  asymmetricAlg: 'X25519'
  kdfAlg: 'HKDF-SHA256'
}

export type HybridWrappedDekEnvelope = WrappedDekMetadata & {
  wrappingVersion: 2
  wrappingScheme: 'multi-algorithm-key-wrap-set'
  asymmetricAlg: 'MULTI-ALGORITHM'
  kdfAlg: 'HKDF-SHA256'
  keyAlgorithms: KeyAlgorithm[]
  wraps: WrappedDekEntry[]
}

/** Context bound into a version-3 hybrid wrap. Unwrap must supply the same vault id. */
export type DekWrapContext = {
  vaultId: string
  /**
   * When true, refuse classic X25519-only fallback if a hybrid wrap cannot be produced
   * (missing PQ public key or ML-KEM unavailable). Use for recipients expected to be PQ-capable.
   */
  requireHybrid?: boolean
}

export type HybridKemWrappedDekEnvelope = WrappedDekMetadata & {
  wrappingVersion: 3
  wrappingScheme: 'hybrid-x25519-mlkem768-hkdf-aes-256-gcm'
  asymmetricAlg: 'X25519'
  kemAlg: 'ML-KEM-768'
  kdfAlg: 'HKDF-SHA256'
  keyAlgorithms: ['X25519', 'ML-KEM-768']
  vaultId: string
  recipientPublicKeyB64: string
  recipientPqPublicKeyB64: string
  ephemeralPublicKeyB64: string
  pqCiphertextB64: string
  ciphertextB64: string
  ivB64: string
}

export type WrappedDekEnvelope =
  | X25519WrappedDekEnvelope
  | HybridWrappedDekEnvelope
  | HybridKemWrappedDekEnvelope
