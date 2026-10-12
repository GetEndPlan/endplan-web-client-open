import { api } from '@/shared/api'
import type { UserRole } from './invitation-api'

export type UserInfo = {
  id: string
  email: string
  name: string
}

export type PendingAccessMember = {
  trustedCircleId: string
  memberId: string
  role: UserRole
  vaultId: string
  member?: UserInfo
  publicKeyB64: string
  pqPublicKeyB64?: string | null
  keyBundleVersion?: number
}

export type PendingAccessResponse = {
  members: PendingAccessMember[]
}

export type VaultAccessEntry = {
  id: string
  vaultId: string
  userId: string
  wrappedDek: string
  role: UserRole
  accessLevel: 'full' | 'partial' | 'read_only'
  expiresAt?: string
  grantedBy?: string
  grantedAt: string
  isActive: boolean
  user?: UserInfo
}

export type VaultAccessListResponse = {
  access: VaultAccessEntry[]
}

export type SectionAccessEntry = {
  id: string
  sectionId: string
  userId: string
  wrappedDek: string
  grantedBy?: string
  grantedAt: string
  isActive: boolean
  user?: UserInfo
}

export type SectionAccessListResponse = {
  access: SectionAccessEntry[]
}

export type GrantVaultAccessRequest = {
  userId: string
  wrappedDek: string
  role: UserRole
  accessLevel: 'full' | 'partial' | 'read_only'
  expiresAt?: string
}

export type RotateVaultWrappedDEKItem = {
  userId: string
  wrappedDek: string
}

export type RotateVaultWrappedDEKsRequest = {
  items: RotateVaultWrappedDEKItem[]
}

export type RotateVaultWrappedDEKsResponse = {
  vaultAccessUpdated: number
  sectionAccessUpdated: number
}

export const accessApi = {
  /**
   * Get trusted circle members who need vault access granted
   */
  async listPendingAccess(): Promise<PendingAccessResponse> {
    return api.get<PendingAccessResponse>('/api/v1/trusted-circle/pending-access')
  },

  /**
   * Grant vault access to a user
   */
  async grantVaultAccess(vaultId: string, data: GrantVaultAccessRequest): Promise<void> {
    return api.post(`/api/v1/vaults/${vaultId}/access`, data)
  },

  /**
   * List vault access rows for a vault (owner only)
   */
  async listVaultAccess(vaultId: string): Promise<VaultAccessListResponse> {
    return api.get<VaultAccessListResponse>(`/api/v1/vaults/${vaultId}/access`)
  },

  /**
   * Replace wrapped DEKs for all active users on vault + section access rows
   */
  async rotateVaultWrappedDEKs(
    vaultId: string,
    data: RotateVaultWrappedDEKsRequest,
  ): Promise<RotateVaultWrappedDEKsResponse> {
    return api.post<RotateVaultWrappedDEKsResponse>(
      `/api/v1/vaults/${vaultId}/access/rotate-wrapped-deks`,
      data,
    )
  },

  /**
   * Replace the calling user's own wrapped DEK on a vault (and its sections).
   * Used after key bundle upgrade so the member's DEK wrapping matches their new keys.
   */
  async rewrapOwnWrappedDEK(
    vaultId: string,
    data: { wrappedDek: string },
  ): Promise<{ status: string }> {
    return api.post<{ status: string }>(
      `/api/v1/vaults/${vaultId}/access/rewrap-self`,
      data,
    )
  },

  /**
   * List section access rows for a section (owner only)
   */
  async listSectionAccess(sectionId: string): Promise<SectionAccessListResponse> {
    return api.get<SectionAccessListResponse>(`/api/v1/sections/${sectionId}/access`)
  },
}
