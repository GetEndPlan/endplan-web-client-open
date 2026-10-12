import { api } from '@/shared/api/client'

export interface ReleasePublicKeyResponse {
  publicKeyB64: string
  keyId: string
  algorithm: string
}

export interface ReleaseToRecipientRequest {
  accessLevel?: 'full' | 'partial' | 'read_only'
  expiresAt?: string
}

export interface VaultAccessResponse {
  id: string
  vaultId: string
  userId: string
  role: string
  accessLevel: string
  expiresAt?: string
  grantedAt: string
  isActive: boolean
  user?: {
    id: string
    email: string
    name: string
  }
}

export interface PendingClaim {
  membershipId: string
  ownerId: string
  ownerName: string
  ownerEmail: string
  vaultId: string
  vaultName: string
  role: string
  invitedAt: string
  acceptedAt?: string
  claimRequestedAt?: string
}

export interface PendingClaimsResponse {
  claims: PendingClaim[]
}

export interface ClaimAccessResponse {
  membershipId: string
  vaultId: string
  claimRequestedAt: string
  alreadyRequested: boolean
  owner?: {
    id: string
    email: string
    name: string
  }
}

export type PostReleaseRecoveryDecision = 'restore_endplan' | 'keep_trusted_circle'

export interface PostReleaseRecoveryStatusResponse {
  required: boolean
  triggeredAt?: string
  /** Owner's inactivity threshold (days) when recovery is required; may be absent for older rows. */
  inactivityPeriodDays?: number
  /** Display names of active access-now key persons (for recovery step copy). */
  accessNowKeyPersonNames?: string[]
}

export interface ResolvePostReleaseRecoveryRequest {
  decision: PostReleaseRecoveryDecision
}

export interface ResolvePostReleaseRecoveryResponse {
  required: boolean
  decision: PostReleaseRecoveryDecision
}

export const releaseApi = {
  /**
   * Get the release service's public key
   * Used to encrypt DEKs for deferred identity binding
   */
  async getPublicKey(): Promise<ReleasePublicKeyResponse> {
    return api.get<ReleasePublicKeyResponse>('/api/v1/release/public-key')
  },

  /**
   * Release vault access to a recipient
   * Uses the Release Service to unwrap and rewrap the DEK
   */
  async releaseToRecipient(
    vaultId: string,
    recipientId: string,
    options?: ReleaseToRecipientRequest
  ): Promise<VaultAccessResponse> {
    return api.post<VaultAccessResponse>(
      `/api/v1/release/vaults/${vaultId}/release/${recipientId}`,
      options || {}
    )
  },

  /**
   * List pending vaults that the recipient can claim access to
   */
  async listPendingClaims(): Promise<PendingClaimsResponse> {
    return api.get<PendingClaimsResponse>('/api/v1/release/pending-claims')
  },

  /**
   * Claim access to a vault as a recipient.
   * The claim is queued and granted by key-person auto-share flow.
   */
  async claimAccess(membershipId: string): Promise<ClaimAccessResponse> {
    return api.post<ClaimAccessResponse>(`/api/v1/release/claim/${membershipId}`)
  },

  async getPostReleaseRecoveryStatus(): Promise<PostReleaseRecoveryStatusResponse> {
    return api.get<PostReleaseRecoveryStatusResponse>('/api/v1/release/recovery/status')
  },

  async resolvePostReleaseRecovery(
    data: ResolvePostReleaseRecoveryRequest
  ): Promise<ResolvePostReleaseRecoveryResponse> {
    return api.post<ResolvePostReleaseRecoveryResponse>('/api/v1/release/recovery/decision', data)
  },
}
