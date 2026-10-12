import { useAuthUser } from '@/features/auth/session'
import { useSubscription } from '@/features/billing'
import {
  useTrustedCircle,
  useMemberships,
  useSentInvitations,
  useReceivedInvitations,
} from '../api/index'
import { countActiveKeyPersons } from '@/features/endplan/model/plan-quota-guards'

export function useTrustedCircleData() {
  const { user } = useAuthUser()
  const queryEnabled = !!user

  const { data: subscription } = useSubscription({ enabled: queryEnabled })
  const features = subscription?.features
  const { data: members = [], isLoading: isMembersLoading } = useTrustedCircle({ enabled: queryEnabled })
  const { data: memberships = [], isLoading: isMembershipsLoading } = useMemberships({ enabled: queryEnabled })
  const { data: sentInvitations = [], isLoading: isSentLoading } = useSentInvitations({ enabled: queryEnabled })
  const { data: receivedInvitations = [], isLoading: isReceivedLoading } = useReceivedInvitations({ enabled: queryEnabled })

  const hasKeyPersonMember = members.some(
    (member) => member.role === 'key_person' && member.status !== 'revoked',
  )
  const hasKeyPersonInvitation = sentInvitations.some(
    (invitation) =>
      invitation.role === 'key_person' &&
      (invitation.status === 'pending' ||
        invitation.status === 'pending_release' ||
        invitation.status === 'accepted'),
  )
  const hasKeyPerson = hasKeyPersonMember || hasKeyPersonInvitation

  const showPlanLimits = features != null
  const maxMembers = features?.max_key_persons ?? 0
  const keyPersonCount = countActiveKeyPersons({ members, sentInvitations })
  const atLimit = showPlanLimits && keyPersonCount >= maxMembers
  const ownerTrustedCircleReadOnly = subscription?.canAccess === false
  const isLoading =
    isMembersLoading || isMembershipsLoading || isSentLoading || isReceivedLoading

  return {
    user,
    members,
    memberships,
    sentInvitations,
    receivedInvitations,
    maxMembers,
    keyPersonCount,
    showPlanLimits,
    atLimit,
    ownerTrustedCircleReadOnly,
    hasKeyPerson,
    isLoading,
  }
}
