import { api, ApiError } from '@/shared/api'
import type { PasswordKdfAlgorithm } from '@/shared/lib'

export type KeySlotResponse = {
  algorithm: string
  publicKeyB64: string
  encryptedPrivateKey: string
  privateKeyIv: string
  recoveryEncryptedPrivateKey?: string
  recoveryPrivateKeyIv?: string
}

export type KeySlotRequest = {
  algorithm: string
  publicKeyB64: string
  encryptedPrivateKey: string
  privateKeyIv: string
  recoveryEncryptedPrivateKey?: string
  recoveryPrivateKeyIv?: string
}

export type UserKeysResponse = {
  id: string
  userId: string
  publicKeyB64: string
  kekSaltB64: string
  kekIterations: number
  kekMemorySize: number
  kekParallelism: number
  kekHashLength: number
  recoveryKekSaltB64?: string
  recoveryKekIterations?: number
  recoveryKekMemorySize?: number
  recoveryKekParallelism?: number
  recoveryKekHashLength?: number
  recoveryKdfAlgorithm?: PasswordKdfAlgorithm | string
  hasRecoveryWrap?: boolean
  keyAlgorithm: string
  keyBundleVersion?: number
  passwordKdfAlgorithm?: PasswordKdfAlgorithm | string
  pqPublicKeyB64?: string | null
  pqKeyAlgorithm?: string | null
  keySlots: KeySlotResponse[]
  isCurrent: boolean
  createdAt: string
  rotatedAt: string | null
}

export type CreateUserKeysRequest = {
  publicKeyB64: string
  kekSaltB64: string
  kekIterations: number
  kekMemorySize: number
  kekParallelism: number
  kekHashLength: number
  recoveryKekSaltB64?: string
  recoveryKekIterations?: number
  recoveryKekMemorySize?: number
  recoveryKekParallelism?: number
  recoveryKekHashLength?: number
  recoveryKdfAlgorithm?: PasswordKdfAlgorithm | string
  keyAlgorithm?: string
  keyBundleVersion?: number
  passwordKdfAlgorithm?: PasswordKdfAlgorithm | string
  keySlots: KeySlotRequest[]
}

export type PublicKeySlotResponse = {
  algorithm: string
  publicKeyB64: string
}

export type PublicKeyResponse = {
  userId: string
  publicKeyB64: string
  keyAlgorithm?: string
  keyBundleVersion?: number
  pqPublicKeyB64?: string | null
  pqKeyAlgorithm?: string | null
  keySlots?: PublicKeySlotResponse[]
}

export type PublicKeyBundlesRequest = {
  userIds: string[]
}

export type PublicKeyBundlesResponse = {
  keys: PublicKeyResponse[]
}

export const keysApi = {
  async getMyKeys(): Promise<UserKeysResponse | null> {
    try {
      return await api.get<UserKeysResponse>('/api/v1/keys')
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) {
        return null
      }
      throw error
    }
  },

  async createKeys(data: CreateUserKeysRequest): Promise<UserKeysResponse> {
    return api.post<UserKeysResponse>('/api/v1/keys', data)
  },

  async getPublicKey(userId: string): Promise<PublicKeyResponse> {
    return api.get<PublicKeyResponse>(`/api/v1/keys/${userId}/public`)
  },

  async listPublicKeys(data: PublicKeyBundlesRequest): Promise<PublicKeyBundlesResponse> {
    return api.post<PublicKeyBundlesResponse>('/api/v1/keys/public-bundles', data)
  },

  async rotateKeys(data: CreateUserKeysRequest): Promise<UserKeysResponse> {
    return api.post<UserKeysResponse>('/api/v1/keys/rotate', data)
  },
}
