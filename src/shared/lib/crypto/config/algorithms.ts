import algorithmPolicy from '@/algorithm.json'
import type {
  KeyBundleVersion,
  KeyAlgorithm,
  MlKemAlgorithm,
  PasswordKdfAlgorithm,
  SharedSecretKdfAlgorithm,
  X25519Algorithm,
} from '../types'

export const X25519_ALGORITHM: X25519Algorithm = 'X25519'
export const ML_KEM_768_ALGORITHM: MlKemAlgorithm = 'ML-KEM-768'

const SUPPORTED_KEY_ALGORITHMS = [
  X25519_ALGORITHM,
  ML_KEM_768_ALGORITHM,
] as const satisfies readonly KeyAlgorithm[]

const DH_CAPABLE_ALGORITHMS: ReadonlySet<KeyAlgorithm> = new Set([X25519_ALGORITHM])

function parseConfiguredKeyAlgorithms(rawValue: unknown): readonly KeyAlgorithm[] {
  if (!Array.isArray(rawValue)) {
    throw new Error('algorithm.json must define keyAlgorithms as an array')
  }

  const configured = rawValue.filter((value): value is KeyAlgorithm =>
    typeof value === 'string' && SUPPORTED_KEY_ALGORITHMS.includes(value as KeyAlgorithm),
  )

  if (configured.length !== rawValue.length) {
    throw new Error('algorithm.json contains an unsupported key algorithm')
  }

  if (configured.length === 0) {
    throw new Error('algorithm.json must include at least one key algorithm')
  }

  return configured
}

function parsePrimaryKeyExchangeAlgorithm(rawValue: unknown): KeyAlgorithm {
  if (typeof rawValue !== 'string') {
    throw new Error('algorithm.json must define primaryKeyExchangeAlgorithm as a string')
  }
  const algo = rawValue as KeyAlgorithm
  if (!SUPPORTED_KEY_ALGORITHMS.includes(algo)) {
    throw new Error(`Unsupported primaryKeyExchangeAlgorithm: ${rawValue}`)
  }
  if (!DH_CAPABLE_ALGORITHMS.has(algo)) {
    throw new Error(`primaryKeyExchangeAlgorithm must be DH-capable; ${rawValue} is KEM-only`)
  }
  return algo
}

export const CONFIGURED_KEY_ALGORITHMS = parseConfiguredKeyAlgorithms(algorithmPolicy.keyAlgorithms)
export const PRIMARY_KEY_EXCHANGE_ALGORITHM = parsePrimaryKeyExchangeAlgorithm(
  algorithmPolicy.primaryKeyExchangeAlgorithm,
)

export const ACTIVE_PASSWORD_KDF_ALGORITHM: PasswordKdfAlgorithm = 'Argon2id'
export const ACTIVE_SHARED_SECRET_KDF_ALGORITHM: SharedSecretKdfAlgorithm = 'HKDF-SHA256'

export function hasConfiguredKeyAlgorithm(algorithm: KeyAlgorithm): boolean {
  return CONFIGURED_KEY_ALGORITHMS.includes(algorithm)
}

export function isX25519WrappingEnabled(): boolean {
  return hasConfiguredKeyAlgorithm(X25519_ALGORITHM)
}

export function isMlKem768WrappingEnabled(): boolean {
  return hasConfiguredKeyAlgorithm(ML_KEM_768_ALGORITHM)
}

export function getSupplementaryAlgorithms(): readonly KeyAlgorithm[] {
  return CONFIGURED_KEY_ALGORITHMS.filter((algo) => algo !== PRIMARY_KEY_EXCHANGE_ALGORITHM)
}

export function getPreferredKeyBundleVersion(): KeyBundleVersion {
  return getSupplementaryAlgorithms().length > 0 ? 2 : 1
}
