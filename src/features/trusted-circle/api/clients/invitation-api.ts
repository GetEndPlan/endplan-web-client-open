import { api } from '@/shared/api'

export type UserRole = 'key_person' | 'recipient' | 'advisor'

export type InvitationStatus = 'pending_release' | 'pending' | 'accepted' | 'expired' | 'cancelled'

export type Inviter = {
  id: string
  email: string
  name: string
}

export type Invitation = {
  id: string
  inviterId: string
  inviteeEmail: string
  inviteeName?: string
  relationship?: string
  phone?: string
  role: UserRole
  advisorType?: string
  accessDurationDays?: number
  accessTiming?: 'now' | 'in_end'
  token?: string
  message?: string
  status: InvitationStatus
  expiresAt: string
  createdAt: string
  acceptedAt?: string
  allowedSectionTypes?: string[]
  inviter?: Inviter
}

export type CreateInvitationRequest = {
  inviteeEmail: string
  inviteeName?: string
  relationship?: string
  phone?: string
  role: UserRole
  advisorType?: string
  accessDurationDays?: number
  /** key_person only: when they should be granted vault access */
  accessTiming?: 'now' | 'in_end'
  message?: string
  expiresInDays?: number
  /** Section types this member can access (e.g. ["assets","documents"]). Only these sections will be visible to them. */
  allowedSectionTypes?: string[]
}

export type InvitationListResponse = {
  invitations: Invitation[]
}

export const invitationApi = {
  /**
   * Send an invitation to join trusted circle
   */
  async create(data: CreateInvitationRequest): Promise<Invitation> {
    return api.post<Invitation>('/api/v1/invitations', data)
  },

  /**
   * Get all invitations sent by the current user
   */
  async listSent(): Promise<InvitationListResponse> {
    return api.get<InvitationListResponse>('/api/v1/invitations/sent')
  },

  /**
   * Get all pending invitations received by the current user
   */
  async listReceived(): Promise<InvitationListResponse> {
    return api.get<InvitationListResponse>('/api/v1/invitations/received')
  },

  /**
   * Get invitation by token (for invitation links)
   */
  async getByToken(token: string): Promise<Invitation> {
    return api.get<Invitation>(`/api/v1/invitations/token/${token}`)
  },

  /**
   * Accept an invitation
   */
  async accept(invitationId: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/api/v1/invitations/${invitationId}/accept`, {})
  },

  /**
   * Decline an invitation
   */
  async decline(invitationId: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/api/v1/invitations/${invitationId}/decline`, {})
  },

  /**
   * Cancel an invitation (as inviter)
   */
  async cancel(invitationId: string): Promise<void> {
    return api.delete(`/api/v1/invitations/${invitationId}`)
  },

  /**
   * Get all pending release invitations (recipients waiting for release)
   */
  async listPendingRelease(): Promise<InvitationListResponse> {
    return api.get<InvitationListResponse>('/api/v1/invitations/pending-release')
  },

  /**
   * Release a single invitation (send email to recipient)
   */
  async release(invitationId: string): Promise<Invitation> {
    return api.post<Invitation>(`/api/v1/invitations/${invitationId}/release`, {})
  },

  /**
   * Release all pending invitations (simulate release - send emails to all recipients)
   */
  async releaseAll(): Promise<{ message: string; released: number }> {
    return api.post<{ message: string; released: number }>('/api/v1/invitations/release', {})
  },
}
