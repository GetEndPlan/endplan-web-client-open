import type { IArgon2Options } from 'hash-wasm'

type KdfParams = {
  saltB64: string
  iterations: number
  memorySize: number
  parallelism: number
  hashLength: number
}

type DeriveKekOptions = Partial<Omit<KdfParams, 'saltB64'>> & {
  saltB64?: string
  /** See resolveArgon2idParams — default false so existing wraps still unlock. */
  enforceClientBounds?: boolean
}
type HashWasmModule = typeof import('hash-wasm')

type EncryptedPayload = {
  ciphertextB64: string
  ivB64: string
}

export type CryptoEnvelopeV1 = {
  v: 1
  alg: 'AES-256-GCM'
  ciphertextB64: string
  ivB64: string
}

const DEFAULT_KDF_PARAMS: Omit<KdfParams, 'saltB64'> = {
  iterations: 4,
  memorySize: 64 * 1024,
  parallelism: 4,
  hashLength: 32,
}

/** Reject absurd server-supplied costs that could hang the tab. */
const MAX_KDF_PARAMS: Omit<KdfParams, 'saltB64'> = {
  iterations: 64,
  memorySize: 512 * 1024,
  parallelism: 16,
  hashLength: 64,
}

type ResolveKdfParamsOptions = Partial<Omit<KdfParams, 'saltB64'>> & {
  /**
   * When sealing a new password wrap, clamp to client floors/ceilings so a
   * malicious server cannot dictate a weak (or DoS-sized) Argon2id cost.
   * When unlocking an existing wrap, pass false and use the stored params exactly.
   */
  enforceClientBounds?: boolean
}

export function resolveArgon2idParams(
  options: ResolveKdfParamsOptions = {},
): Omit<KdfParams, 'saltB64'> {
  const enforceClientBounds = options.enforceClientBounds ?? false
  const pick = (value: number | undefined, fallback: number, min: number, max: number) => {
    const raw = value ?? fallback
    if (!enforceClientBounds) return raw
    return Math.min(max, Math.max(min, raw))
  }

  return {
    iterations: pick(
      options.iterations,
      DEFAULT_KDF_PARAMS.iterations,
      DEFAULT_KDF_PARAMS.iterations,
      MAX_KDF_PARAMS.iterations,
    ),
    memorySize: pick(
      options.memorySize,
      DEFAULT_KDF_PARAMS.memorySize,
      DEFAULT_KDF_PARAMS.memorySize,
      MAX_KDF_PARAMS.memorySize,
    ),
    parallelism: pick(
      options.parallelism,
      DEFAULT_KDF_PARAMS.parallelism,
      DEFAULT_KDF_PARAMS.parallelism,
      MAX_KDF_PARAMS.parallelism,
    ),
    hashLength: pick(
      options.hashLength,
      DEFAULT_KDF_PARAMS.hashLength,
      DEFAULT_KDF_PARAMS.hashLength,
      MAX_KDF_PARAMS.hashLength,
    ),
  }
}

const AES_GCM_IV_BYTES = 12
const DEK_BYTES = 32
const KDF_SALT_BYTES = 16
const AES_KEY_SIZES = new Set([16, 24, 32])

const encoder = new TextEncoder()

let hashWasmPromise: Promise<HashWasmModule> | null = null

const loadHashWasm = async (): Promise<HashWasmModule> => {
  if (!hashWasmPromise) {
    hashWasmPromise = import('hash-wasm')
  }
  return hashWasmPromise
}

const getCrypto = () => {
  const cryptoObj = globalThis.crypto || (globalThis as unknown as { msCrypto?: Crypto }).msCrypto
  if (!cryptoObj?.subtle) {
    throw new Error('WebCrypto is not available in this environment')
  }
  return cryptoObj
}

const toBase64 = (input: Uint8Array): string => {
  if (typeof btoa === 'function') {
    let binary = ''
    input.forEach((byte) => {
      binary += String.fromCharCode(byte)
    })
    return btoa(binary)
  }
  const nodeBuffer = (globalThis as { Buffer?: { from(data: Uint8Array): { toString(encoding: string): string } } }).Buffer
  if (nodeBuffer) {
    return nodeBuffer.from(input).toString('base64')
  }
  throw new Error('Base64 encoding is not available in this environment')
}

const fromBase64 = (b64: string): Uint8Array => {
  if (typeof atob === 'function') {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
  const nodeBuffer = (globalThis as { Buffer?: { from(data: string, encoding: string): Uint8Array } }).Buffer
  if (nodeBuffer) {
    return new Uint8Array(nodeBuffer.from(b64, 'base64'))
  }
  throw new Error('Base64 decoding is not available in this environment')
}

const randomBytes = (length: number): Uint8Array => {
  const buffer = new Uint8Array(length)
  getCrypto().getRandomValues(buffer)
  return buffer
}

const assertAesKeySize = (rawKey: Uint8Array, label: string) => {
  if (!AES_KEY_SIZES.has(rawKey.byteLength)) {
    throw new Error(`${label} must be 16, 24, or 32 bytes for AES-GCM`)
  }
}

const toArrayBuffer = (view: Uint8Array): ArrayBuffer => {
  return new Uint8Array(view).buffer
}

const importAesKey = (rawKey: Uint8Array, label = 'AES key') => {
  assertAesKeySize(rawKey, label)
  const keyData: BufferSource = toArrayBuffer(rawKey)
  return getCrypto().subtle.importKey('raw', keyData, { name: 'AES-GCM', length: rawKey.byteLength * 8 }, false, ['encrypt', 'decrypt'])
}

const encryptAesGcm = async (plaintext: Uint8Array, rawKey: Uint8Array) => {
  const key = await importAesKey(rawKey)
  const iv = randomBytes(AES_GCM_IV_BYTES)
  const ciphertext = new Uint8Array(await getCrypto().subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(plaintext)))
  return { ciphertext, iv }
}

const decryptAesGcm = async (ciphertext: Uint8Array, iv: Uint8Array, rawKey: Uint8Array) => {
  const key = await importAesKey(rawKey)
  const plaintext = new Uint8Array(await getCrypto().subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(ciphertext)))
  return plaintext
}

export const hkdfSha256 = async (
  ikm: Uint8Array,
  info: string,
  length = 32,
  salt?: Uint8Array,
): Promise<Uint8Array> => {
  const key = await getCrypto().subtle.importKey(
    'raw',
    toArrayBuffer(ikm),
    { name: 'HKDF' },
    false,
    ['deriveBits'],
  )

  const bits = await getCrypto().subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt ? toArrayBuffer(salt) : new Uint8Array(0),
      info: encoder.encode(info),
    },
    key,
    length * 8,
  )

  return new Uint8Array(bits)
}

export const encryptAesGcmV1 = async (
  plaintext: Uint8Array,
  rawKey: Uint8Array,
  aad: string,
): Promise<CryptoEnvelopeV1> => {
  const key = await importAesKey(rawKey)
  const iv = randomBytes(AES_GCM_IV_BYTES)

  const ciphertext = new Uint8Array(
    await getCrypto().subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: toArrayBuffer(iv),
        additionalData: toArrayBuffer(encoder.encode(aad)),
      },
      key,
      toArrayBuffer(plaintext),
    ),
  )

  return {
    v: 1,
    alg: 'AES-256-GCM',
    ciphertextB64: toBase64(ciphertext),
    ivB64: toBase64(iv),
  }
}

export const decryptAesGcmV1 = async (
  payload: CryptoEnvelopeV1,
  rawKey: Uint8Array,
  aad: string,
): Promise<Uint8Array> => {
  if (payload.v !== 1 || payload.alg !== 'AES-256-GCM') {
    throw new Error('Unsupported crypto envelope version or algorithm')
  }

  const key = await importAesKey(rawKey)

  return new Uint8Array(
    await getCrypto().subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toArrayBuffer(fromBase64(payload.ivB64)),
        additionalData: toArrayBuffer(encoder.encode(aad)),
      },
      key,
      toArrayBuffer(fromBase64(payload.ciphertextB64)),
    ),
  )
}

export const generateDek = () => randomBytes(DEK_BYTES)

export const deriveKek = async (
  password: string,
  options: DeriveKekOptions = {},
): Promise<{ kek: Uint8Array; params: KdfParams }> => {
  const { argon2id } = await loadHashWasm()
  const salt = options.saltB64 ? fromBase64(options.saltB64) : randomBytes(KDF_SALT_BYTES)
  const bounded = resolveArgon2idParams({
    iterations: options.iterations,
    memorySize: options.memorySize,
    parallelism: options.parallelism,
    hashLength: options.hashLength,
    enforceClientBounds: options.enforceClientBounds,
  })
  const argonOptions: IArgon2Options = {
    password,
    salt,
    iterations: bounded.iterations,
    memorySize: bounded.memorySize,
    parallelism: bounded.parallelism,
    hashLength: bounded.hashLength,
    outputType: 'binary',
  }

  const derived = await argon2id(argonOptions)
  const kek = typeof derived === 'string' ? new Uint8Array([...derived].map((c) => c.charCodeAt(0))) : new Uint8Array(derived)

  return {
    kek,
    params: {
      saltB64: options.saltB64 ?? toBase64(salt),
      iterations: argonOptions.iterations,
      memorySize: argonOptions.memorySize,
      parallelism: argonOptions.parallelism,
      hashLength: argonOptions.hashLength,
    },
  }
}

export const encryptPrivateKey = async (
  privateKeyB64: string,
  kek: Uint8Array,
): Promise<EncryptedPayload> => {
  const { ciphertext, iv } = await encryptAesGcm(fromBase64(privateKeyB64), kek)
  return { ciphertextB64: toBase64(ciphertext), ivB64: toBase64(iv) }
}

export const decryptPrivateKey = async (payload: EncryptedPayload, kek: Uint8Array): Promise<string> => {
  const plaintext = await decryptAesGcm(fromBase64(payload.ciphertextB64), fromBase64(payload.ivB64), kek)
  return toBase64(plaintext)
}

export const wrapDekForRsaPublicKey = async (
  dek: Uint8Array,
  rsaPublicKeySpkiB64: string,
): Promise<string> => {
  if (dek.length !== 32) {
    throw new Error('DEK must be 32 bytes')
  }
  const spki = fromBase64(rsaPublicKeySpkiB64)
  const crypto = getCrypto()
  const key = await crypto.subtle.importKey(
    'spki',
    toArrayBuffer(spki),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  )
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    key,
    toArrayBuffer(dek),
  )
  return toBase64(new Uint8Array(ciphertext))
}

export const cryptoEncoding = { toBase64, fromBase64 }

export const kdfDefaults = { ...DEFAULT_KDF_PARAMS, saltBytes: KDF_SALT_BYTES }
