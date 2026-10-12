import { api } from '@/shared/api'
import type { UserRole } from './invitation-api'

export type MembershipStatus = 'pending' | 'active' | 'suspended' | 'revoked'

export type UserInfo = {
  id: string
  email: string
  name: string
}

export type TrustedCircleMember = {
  id: string
  ownerId: string
  memberId: string
  role: UserRole
  status: MembershipStatus
  advisorType?: string
  accessExpiresAt?: string
  accessTiming?: 'now' | 'in_end'
  accessGrantStatus?: 'available' | 'deferred'
  notes?: string
  invitedAt: string
  acceptedAt?: string
  /** Section types shared with this member (for update modal) */
  allowedSectionTypes?: string[]
  member?: UserInfo  // The member's info (when viewing your circle)
}

export type UpdateTrustedCircleMemberRequest = {
  role?: UserRole
  advisorType?: string
  notes?: string
  /** Section types this member can access; syncs section_access (add/remove rows) */
  allowedSectionTypes?: string[]
}

export type TrustedCircleMembership = {
  id: string
  ownerId: string
  memberId: string
  role: UserRole
  status: MembershipStatus
  advisorType?: string
  accessExpiresAt?: string
  accessTiming?: 'now' | 'in_end'
  accessGrantStatus?: 'available' | 'deferred'
  notes?: string
  invitedAt: string
  acceptedAt?: string
  member?: UserInfo  // The owner's info (when viewing your memberships)
}

export type TrustedCircleListResponse = {
  members: TrustedCircleMember[]
}

export type MembershipsListResponse = {
  memberships: TrustedCircleMembership[]
}

export const trustedCircleApi = {
  /**
   * Get all members in my trusted circle (people I've invited)
   */
  async listMyCircle(): Promise<TrustedCircleListResponse> {
    return api.get<TrustedCircleListResponse>('/api/v1/trusted-circle')
  },

  /**
   * Get all circles I'm a member of (circles others have invited me to)
   */
  async listMyMemberships(): Promise<MembershipsListResponse> {
    return api.get<MembershipsListResponse>('/api/v1/memberships')
  },

  /**
   * Get a single trusted circle member (e.g. for editing shared sections)
   */
  async getMember(memberId: string): Promise<TrustedCircleMember> {
    return api.get<TrustedCircleMember>(`/api/v1/trusted-circle/${memberId}`)
  },

  /**
   * Update a trusted circle member (e.g. which sections they can access)
   */
  async updateMember(memberId: string, data: UpdateTrustedCircleMemberRequest): Promise<TrustedCircleMember> {
    return api.put<TrustedCircleMember>(`/api/v1/trusted-circle/${memberId}`, data)
  },

  /**
   * Remove someone from my trusted circle
   */
  async removeMember(memberId: string): Promise<void> {
    return api.delete(`/api/v1/trusted-circle/${memberId}`)
  },
}
