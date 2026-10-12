import {
  ACTIVE_PASSWORD_KDF_ALGORITHM,
  ML_KEM_768_ALGORITHM,
  X25519_ALGORITHM,
  generateUserKeyBundle,
  upgradeKeyBundleIfSupported,
  deriveKek,
  encryptPrivateKey,
  decryptPrivateKey,
  kdfDefaults,
  type UserKeyBundle,
} from '@/shared/lib'
import { keysApi, type CreateUserKeysRequest, type KeySlotResponse, type UserKeysResponse } from './keys-api'
import { generateRecoveryMnemonic12, normalizeRecoveryMnemonicInput } from '../model/recovery-phrase'

const ACTIVE_RECOVERY_KDF_ALGORITHM = ACTIVE_PASSWORD_KDF_ALGORITHM

export type DecryptedKeySlot = {
  algorithm: string
  publicKeyB64: string
  privateKeyB64: string
}

export type KeyPair = {
  publicKeyB64: string
  privateKeyB64: string
  pqPublicKeyB64?: string | null
  pqPrivateKeyB64?: string | null
}

export type KeysWithPrivate = {
  keys: UserKeysResponse
  privateKeyB64: string
  pqPrivateKeyB64: string | null
  decryptedSlots?: DecryptedKeySlot[]
  /** Present when keys were just created with a new recovery mnemonic (signup / first-login bootstrap). */
  recoveryMnemonicForVault?: string
}

async function deriveUserKek(
  password: string,
  keysResponse?: UserKeysResponse,
  options?: { enforceClientBounds?: boolean },
) {
  return deriveKek(password, {
    saltB64: keysResponse?.kekSaltB64,
    iterations: keysResponse?.kekIterations ?? kdfDefaults.iterations,
    memorySize: keysResponse?.kekMemorySize ?? kdfDefaults.memorySize,
    parallelism: keysResponse?.kekParallelism ?? kdfDefaults.parallelism,
    hashLength: keysResponse?.kekHashLength ?? kdfDefaults.hashLength,
    enforceClientBounds: options?.enforceClientBounds,
  })
}

async function deriveRecoveryKek(
  recoverySecret: string,
  keysResponse?: UserKeysResponse,
  options?: { enforceClientBounds?: boolean },
) {
  return deriveKek(recoverySecret, {
    saltB64: keysResponse?.recoveryKekSaltB64,
    iterations: keysResponse?.recoveryKekIterations ?? kdfDefaults.iterations,
    memorySize: keysResponse?.recoveryKekMemorySize ?? kdfDefaults.memorySize,
    parallelism: keysResponse?.recoveryKekParallelism ?? kdfDefaults.parallelism,
    hashLength: keysResponse?.recoveryKekHashLength ?? kdfDefaults.hashLength,
    enforceClientBounds: options?.enforceClientBounds,
  })
}

function normalizeRecoverySecret(secret: string): string {
  return normalizeRecoveryMnemonicInput(secret)
}

async function encryptKeyBundle(
  bundle: UserKeyBundle,
  password: string,
  existingKeys?: UserKeysResponse,
  recoveryOptions?: {
    recoverySecret?: string
    keepExistingRecoveryWraps?: boolean
  },
): Promise<{ payload: CreateUserKeysRequest; params: Awaited<ReturnType<typeof deriveKek>>['params'] }> {
  const { kek, params } = await deriveUserKek(password, existingKeys, {
    enforceClientBounds: true,
  })
  const normalizedRecoverySecret = recoveryOptions?.recoverySecret
    ? normalizeRecoverySecret(recoveryOptions.recoverySecret)
    : null
  const recoveryKekResult = normalizedRecoverySecret
    ? await deriveRecoveryKek(normalizedRecoverySecret, undefined, { enforceClientBounds: true })
    : null
  const encryptedClassic = await encryptPrivateKey(bundle.privateKeyB64, kek)
  const encryptedClassicRecovery = recoveryKekResult
    ? await encryptPrivateKey(bundle.privateKeyB64, recoveryKekResult.kek)
    : null
  const existingClassicSlot = existingKeys?.keySlots.find((slot) => slot.algorithm === (bundle.keyAlgorithm ?? X25519_ALGORITHM))

  const keySlots: CreateUserKeysRequest['keySlots'] = [
    {
      algorithm: bundle.keyAlgorithm ?? X25519_ALGORITHM,
      publicKeyB64: bundle.publicKeyB64,
      encryptedPrivateKey: encryptedClassic.ciphertextB64,
      privateKeyIv: encryptedClassic.ivB64,
      recoveryEncryptedPrivateKey:
        recoveryOptions?.keepExistingRecoveryWraps && existingClassicSlot?.recoveryEncryptedPrivateKey
          ? existingClassicSlot.recoveryEncryptedPrivateKey
          : recoveryKekResult
            ? encryptedClassicRecovery?.ciphertextB64
            : undefined,
      recoveryPrivateKeyIv:
        recoveryOptions?.keepExistingRecoveryWraps && existingClassicSlot?.recoveryPrivateKeyIv
          ? existingClassicSlot.recoveryPrivateKeyIv
          : recoveryKekResult
            ? encryptedClassicRecovery?.ivB64
            : undefined,
    },
  ]

  if (bundle.pqPrivateKeyB64 && bundle.pqPublicKeyB64 && bundle.pqKeyAlgorithm) {
    const encryptedPq = await encryptPrivateKey(bundle.pqPrivateKeyB64, kek)
    const encryptedPqRecovery = recoveryKekResult
      ? await encryptPrivateKey(bundle.pqPrivateKeyB64, recoveryKekResult.kek)
      : null
    const existingPqSlot = existingKeys?.keySlots.find((slot) => slot.algorithm === bundle.pqKeyAlgorithm)
    keySlots.push({
      algorithm: bundle.pqKeyAlgorithm,
      publicKeyB64: bundle.pqPublicKeyB64,
      encryptedPrivateKey: encryptedPq.ciphertextB64,
      privateKeyIv: encryptedPq.ivB64,
      recoveryEncryptedPrivateKey:
        recoveryOptions?.keepExistingRecoveryWraps && existingPqSlot?.recoveryEncryptedPrivateKey
          ? existingPqSlot.recoveryEncryptedPrivateKey
          : encryptedPqRecovery?.ciphertextB64,
      recoveryPrivateKeyIv:
        recoveryOptions?.keepExistingRecoveryWraps && existingPqSlot?.recoveryPrivateKeyIv
          ? existingPqSlot.recoveryPrivateKeyIv
          : encryptedPqRecovery?.ivB64,
    })
  }

  return {
    payload: {
      publicKeyB64: bundle.publicKeyB64,
      kekSaltB64: params.saltB64,
      kekIterations: params.iterations,
      kekMemorySize: params.memorySize,
      kekParallelism: params.parallelism,
      kekHashLength: params.hashLength,
      recoveryKekSaltB64: recoveryKekResult?.params.saltB64,
      recoveryKekIterations: recoveryKekResult?.params.iterations,
      recoveryKekMemorySize: recoveryKekResult?.params.memorySize,
      recoveryKekParallelism: recoveryKekResult?.params.parallelism,
      recoveryKekHashLength: recoveryKekResult?.params.hashLength,
      recoveryKdfAlgorithm: recoveryKekResult ? ACTIVE_RECOVERY_KDF_ALGORITHM : undefined,
      keyAlgorithm: bundle.keyAlgorithm ?? X25519_ALGORITHM,
      keyBundleVersion: bundle.keyBundleVersion,
      passwordKdfAlgorithm: bundle.passwordKdfAlgorithm,
      keySlots,
    },
    params,
  }
}

export async function generateAndSaveKeys(password: string): Promise<KeysWithPrivate> {
  const bundle = await generateUserKeyBundle()
  const recoveryMnemonicForVault = generateRecoveryMnemonic12()
  const { payload } = await encryptKeyBundle(bundle, password, undefined, {
    recoverySecret: recoveryMnemonicForVault,
  })
  const keys = await keysApi.createKeys(payload)
  return {
    keys,
    privateKeyB64: bundle.privateKeyB64,
    pqPrivateKeyB64: bundle.pqPrivateKeyB64 ?? null,
    recoveryMnemonicForVault,
  }
}

export async function ensureUserHasKeys(password: string): Promise<KeysWithPrivate> {
  const existingKeys = await keysApi.getMyKeys()

  if (existingKeys) {
    const unlockedKeys = await unlockPrivateKey(existingKeys, password)
    const upgradedBundle = await upgradeKeyBundleIfSupported({
      publicKeyB64: existingKeys.publicKeyB64,
      privateKeyB64: unlockedKeys.privateKeyB64,
      keyAlgorithm: existingKeys.keyAlgorithm,
      pqPublicKeyB64: existingKeys.pqPublicKeyB64 ?? null,
      pqPrivateKeyB64: unlockedKeys.pqPrivateKeyB64,
      pqKeyAlgorithm: existingKeys.pqKeyAlgorithm ?? null,
      keyBundleVersion: existingKeys.keyBundleVersion ?? 1,
    })

    if (!upgradedBundle || upgradedBundle.keyBundleVersion === (existingKeys.keyBundleVersion ?? 1)) {
      return {
        keys: existingKeys,
        privateKeyB64: unlockedKeys.privateKeyB64,
        pqPrivateKeyB64: unlockedKeys.pqPrivateKeyB64,
      }
    }

    const { payload } = await encryptKeyBundle(
      upgradedBundle,
      password,
      existingKeys,
      existingKeys.recoveryKekSaltB64 ? { keepExistingRecoveryWraps: true } : undefined,
    )
    if (existingKeys.recoveryKekSaltB64) {
      payload.recoveryKekSaltB64 = existingKeys.recoveryKekSaltB64
      payload.recoveryKekIterations = existingKeys.recoveryKekIterations
      payload.recoveryKekMemorySize = existingKeys.recoveryKekMemorySize
      payload.recoveryKekParallelism = existingKeys.recoveryKekParallelism
      payload.recoveryKekHashLength = existingKeys.recoveryKekHashLength
      payload.recoveryKdfAlgorithm = existingKeys.recoveryKdfAlgorithm
    }
    const keys = await keysApi.rotateKeys(payload)
    return {
      keys,
      privateKeyB64: upgradedBundle.privateKeyB64,
      pqPrivateKeyB64: upgradedBundle.pqPrivateKeyB64 ?? null,
    }
  }

  return generateAndSaveKeys(password)
}

async function decryptKeySlots(
  slots: KeySlotResponse[],
  kek: Uint8Array,
): Promise<DecryptedKeySlot[]> {
  const result: DecryptedKeySlot[] = []
  for (const slot of slots) {
    if (!slot.encryptedPrivateKey || !slot.privateKeyIv) {
      continue
    }
    const privateKeyB64 = await decryptPrivateKey(
      { ciphertextB64: slot.encryptedPrivateKey, ivB64: slot.privateKeyIv },
      kek,
    )
    result.push({
      algorithm: slot.algorithm,
      publicKeyB64: slot.publicKeyB64,
      privateKeyB64,
    })
  }
  return result
}

/**
 * Decrypt the user's private key using their password.
 * All key material is read from keySlots.
 */
export async function unlockPrivateKey(
  keysResponse: UserKeysResponse,
  password: string
): Promise<{ privateKeyB64: string; pqPrivateKeyB64: string | null; decryptedSlots: DecryptedKeySlot[] }> {
  const { kek } = await deriveUserKek(password, keysResponse)

  const slots = keysResponse.keySlots
  if (!slots || slots.length === 0) {
    throw new Error('No key slots found — cannot decrypt private key')
  }

  const decryptedSlots = await decryptKeySlots(slots, kek)

  const primary = decryptedSlots.find((s) => s.algorithm === X25519_ALGORITHM)
    ?? decryptedSlots[0]
  if (!primary) {
    throw new Error('No decryptable key slot found')
  }

  const pqSlot = decryptedSlots.find((s) => s.algorithm === ML_KEM_768_ALGORITHM)

  return {
    privateKeyB64: primary.privateKeyB64,
    pqPrivateKeyB64: pqSlot?.privateKeyB64 ?? null,
    decryptedSlots,
  }
}

export async function rotateKeysWithNewPassword(
  currentPassword: string,
  newPassword: string
): Promise<UserKeysResponse> {
  const currentKeys = await keysApi.getMyKeys()
  if (!currentKeys) {
    throw new Error('No keys found to rotate')
  }

  const unlockedKeys = await unlockPrivateKey(currentKeys, currentPassword)
  const upgradedBundle = await upgradeKeyBundleIfSupported({
    publicKeyB64: currentKeys.publicKeyB64,
    privateKeyB64: unlockedKeys.privateKeyB64,
    keyAlgorithm: currentKeys.keyAlgorithm,
    pqPublicKeyB64: currentKeys.pqPublicKeyB64 ?? null,
    pqPrivateKeyB64: unlockedKeys.pqPrivateKeyB64,
    pqKeyAlgorithm: currentKeys.pqKeyAlgorithm ?? null,
    keyBundleVersion: currentKeys.keyBundleVersion ?? 1,
  })

  const bundle: UserKeyBundle = upgradedBundle ?? {
    publicKeyB64: currentKeys.publicKeyB64,
    privateKeyB64: unlockedKeys.privateKeyB64,
    keyAlgorithm: currentKeys.keyAlgorithm ?? X25519_ALGORITHM,
    pqPublicKeyB64: currentKeys.pqPublicKeyB64 ?? null,
    pqPrivateKeyB64: unlockedKeys.pqPrivateKeyB64,
    pqKeyAlgorithm: currentKeys.pqKeyAlgorithm ?? null,
    keyBundleVersion: currentKeys.pqPublicKeyB64 ? 2 : 1,
    passwordKdfAlgorithm: ACTIVE_PASSWORD_KDF_ALGORITHM,
  }

  const { payload } = await encryptKeyBundle(
    bundle,
    newPassword,
    currentKeys,
    currentKeys.recoveryKekSaltB64
      ? { keepExistingRecoveryWraps: true }
      : undefined,
  )
  if (currentKeys.recoveryKekSaltB64) {
    payload.recoveryKekSaltB64 = currentKeys.recoveryKekSaltB64
    payload.recoveryKekIterations = currentKeys.recoveryKekIterations
    payload.recoveryKekMemorySize = currentKeys.recoveryKekMemorySize
    payload.recoveryKekParallelism = currentKeys.recoveryKekParallelism
    payload.recoveryKekHashLength = currentKeys.recoveryKekHashLength
    payload.recoveryKdfAlgorithm = currentKeys.recoveryKdfAlgorithm
  }
  return keysApi.rotateKeys(payload)
}

function bundleFromUnlockedKeys(keys: UserKeysResponse, unlockedKeys: { privateKeyB64: string; pqPrivateKeyB64: string | null }): UserKeyBundle {
  const keyBundleVersion = keys.keyBundleVersion === 2 ? 2 : 1
  return {
    publicKeyB64: keys.publicKeyB64,
    privateKeyB64: unlockedKeys.privateKeyB64,
    keyAlgorithm: keys.keyAlgorithm ?? X25519_ALGORITHM,
    pqPublicKeyB64: keys.pqPublicKeyB64 ?? null,
    pqPrivateKeyB64: unlockedKeys.pqPrivateKeyB64,
    pqKeyAlgorithm: keys.pqKeyAlgorithm ?? null,
    keyBundleVersion,
    passwordKdfAlgorithm: ACTIVE_PASSWORD_KDF_ALGORITHM,
  }
}

export async function setupOrRotateRecoveryKey(
  password: string,
  options?: { recoveryMnemonic?: string },
): Promise<{ keys: UserKeysResponse; recoverySecret: string }> {
  const currentKeys = await keysApi.getMyKeys()
  if (!currentKeys) {
    throw new Error('No keys found to secure with a recovery key')
  }
  const unlocked = await unlockPrivateKey(currentKeys, password)
  const recoverySecret =
    options?.recoveryMnemonic != null && options.recoveryMnemonic.trim().length > 0
      ? normalizeRecoveryMnemonicInput(options.recoveryMnemonic)
      : generateRecoveryMnemonic12()
  const bundle = bundleFromUnlockedKeys(currentKeys, unlocked)
  const { payload } = await encryptKeyBundle(bundle, password, currentKeys, { recoverySecret })
  const keys = await keysApi.rotateKeys(payload)
  return { keys, recoverySecret }
}

export async function recoverKeysAfterPasswordReset(newPassword: string, recoverySecret: string): Promise<UserKeysResponse> {
  const currentKeys = await keysApi.getMyKeys()
  if (!currentKeys) {
    throw new Error('No keys found to recover')
  }
  if (!currentKeys.recoveryKekSaltB64) {
    throw new Error('Recovery key is not configured for this account')
  }
  const normalized = normalizeRecoverySecret(recoverySecret)
  const { kek: recoveryKek } = await deriveRecoveryKek(normalized, currentKeys)
  const decryptedSlots: DecryptedKeySlot[] = []
  for (const slot of currentKeys.keySlots) {
    if (!slot.recoveryEncryptedPrivateKey || !slot.recoveryPrivateKeyIv) {
      throw new Error('Recovery-protected key slots are incomplete')
    }
    const privateKeyB64 = await decryptPrivateKey(
      { ciphertextB64: slot.recoveryEncryptedPrivateKey, ivB64: slot.recoveryPrivateKeyIv },
      recoveryKek,
    )
    decryptedSlots.push({
      algorithm: slot.algorithm,
      publicKeyB64: slot.publicKeyB64,
      privateKeyB64,
    })
  }
  const primary = decryptedSlots.find((slot) => slot.algorithm === X25519_ALGORITHM) ?? decryptedSlots[0]
  if (!primary) {
    throw new Error('No recoverable key slot found')
  }
  const pq = decryptedSlots.find((slot) => slot.algorithm === ML_KEM_768_ALGORITHM) ?? null
  const bundle: UserKeyBundle = {
    publicKeyB64: currentKeys.publicKeyB64,
    privateKeyB64: primary.privateKeyB64,
    keyAlgorithm: currentKeys.keyAlgorithm ?? X25519_ALGORITHM,
    pqPublicKeyB64: currentKeys.pqPublicKeyB64 ?? null,
    pqPrivateKeyB64: pq?.privateKeyB64 ?? null,
    pqKeyAlgorithm: currentKeys.pqKeyAlgorithm ?? null,
    keyBundleVersion: currentKeys.keyBundleVersion === 2 ? 2 : 1,
    passwordKdfAlgorithm: ACTIVE_PASSWORD_KDF_ALGORITHM,
  }
  const { payload } = await encryptKeyBundle(bundle, newPassword, currentKeys, {
    keepExistingRecoveryWraps: true,
  })
  payload.recoveryKekSaltB64 = currentKeys.recoveryKekSaltB64
  payload.recoveryKekIterations = currentKeys.recoveryKekIterations
  payload.recoveryKekMemorySize = currentKeys.recoveryKekMemorySize
  payload.recoveryKekParallelism = currentKeys.recoveryKekParallelism
  payload.recoveryKekHashLength = currentKeys.recoveryKekHashLength
  payload.recoveryKdfAlgorithm = currentKeys.recoveryKdfAlgorithm
  return keysApi.rotateKeys(payload)
}
