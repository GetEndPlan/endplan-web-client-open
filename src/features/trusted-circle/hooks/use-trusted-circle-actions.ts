import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useKeyMaterial } from '@/features/keys'
import { ApiError, ApiRequestsBlockedError } from '@/shared/api'
import { toast } from '@/shared/ui'
import {
  type CreateInvitationRequest,
  type Invitation,
  type TrustedCircleMember,
  trustedCircleApi,
  trustedCircleKeys,
  useInviteMember,
  useAcceptInvitation,
  useDeclineInvitation,
  useCancelInvitation,
  useRemoveMember,
  useUpdateMember,
  rotateVaultDataAfterMemberRemoval,
} from '../api/index'

const MEMBER_DETAILS_STALE_TIME_MS = 30_000

type UseTrustedCircleActionsParams = {
  openSectionsModalState: () => void
  setSectionsModalMember: (member: TrustedCircleMember | null) => void
  closeSectionsModal: () => void
  /** Vault owner without active trial/subscription — block invites and member edits. */
  ownerTrustedCircleReadOnly?: boolean
}

type SendInvitation = (data: CreateInvitationRequest) => Promise<Invitation>

export function useTrustedCircleActions({
  openSectionsModalState,
  setSectionsModalMember,
  closeSectionsModal,
  ownerTrustedCircleReadOnly = false,
}: UseTrustedCircleActionsParams) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const inviteMemberMutation = useInviteMember()
  const acceptInvitationMutation = useAcceptInvitation()
  const declineInvitationMutation = useDeclineInvitation()
  const cancelInvitationMutation = useCancelInvitation()
  const removeMemberMutation = useRemoveMember()
  const updateMemberMutation = useUpdateMember()
  const { publicKeyB64, privateKeyB64, pqPublicKeyB64, pqPrivateKeyB64 } = useKeyMaterial()

  const sendInvitation: SendInvitation = async (data) => {
    if (ownerTrustedCircleReadOnly) {
      toast.error(t('trustedCircle.readOnly.cannotInvite'))
      throw new ApiRequestsBlockedError()
    }
    try {
      return await inviteMemberMutation.mutateAsync(data)
    } catch (err) {
      if (err instanceof ApiError && err.isSubscriptionRequired) {
        toast.error(t('trustedCircle.readOnly.cannotInvite'))
      } else if (err instanceof ApiError && err.isLimitReached) {
        const msg = err.apiMessage || 'Trusted circle limit reached.'
        toast.error(`${msg} Upgrade your plan at Billing to invite more members.`)
      } else if (err instanceof ApiRequestsBlockedError) {
        toast.error(t('trustedCircle.readOnly.cannotInvite'))
      }
      throw err
    }
  }

  const openSectionsModal = async (memberId: string) => {
    openSectionsModalState()

    try {
      const member = await queryClient.fetchQuery({
        queryKey: [...trustedCircleKeys.members(), 'member', memberId],
        queryFn: () => trustedCircleApi.getMember(memberId),
        staleTime: MEMBER_DETAILS_STALE_TIME_MS,
      })

      setSectionsModalMember(member)
    } catch {
      toast.error('Failed to load member')
      closeSectionsModal()
    }
  }

  const saveSections = async (memberId: string, allowedSectionTypes: string[]) => {
    try {
      await updateMemberMutation.mutateAsync({ memberId, data: { allowedSectionTypes } })
    } catch (err) {
      if (err instanceof ApiError && err.isLimitReached) {
        toast.error(
          `${err.apiMessage ?? 'Section limit reached.'} Upgrade your plan at Billing to grant more sections.`,
        )
      }
      throw err
    }
  }

  const removeMember = async (memberId: string) => {
    const cachedMembersData = queryClient.getQueryData<TrustedCircleMember[] | { members?: TrustedCircleMember[] }>(
      trustedCircleKeys.members(),
    )
    const cachedMembers = Array.isArray(cachedMembersData)
      ? cachedMembersData
      : (cachedMembersData?.members ?? [])
    const cachedMember = cachedMembers.find((member) => member.id === memberId) ?? null
    const memberToRemove = cachedMember ?? await trustedCircleApi.getMember(memberId).catch(() => null)
    const removedMemberUserId = memberToRemove?.memberId

    try {
      await removeMemberMutation.mutateAsync(memberId)
      toast.success('Member removed from trusted circle')

      if (!removedMemberUserId) {
        toast.info('Rotation skipped: could not resolve removed member identity.')
        return true
      }
      if (!publicKeyB64 || !privateKeyB64) {
        toast.info('Rotation skipped: unlock your vault keys to rotate encryption.')
        return true
      }

      void rotateVaultDataAfterMemberRemoval({
        removedMemberUserId,
        actorPublicKeyB64: publicKeyB64,
        actorPrivateKeyB64: privateKeyB64,
        actorPqPublicKeyB64: pqPublicKeyB64,
        actorPqPrivateKeyB64: pqPrivateKeyB64,
      }).then((result) => {
        if (result.attemptedVaults === 0) {
          return
        }
        if (result.failedVaults.length === 0) {
          toast.success('Security rotation completed for your vault encryption.')
          return
        }
        toast.error(
          `Member removed, but encryption rotation failed for ${result.failedVaults.length} vault(s).`,
        )
      })
      return true
    } catch {
      toast.error('Failed to remove member')
      return false
    }
  }

  const cancelInvite = async (invitationId: string) => {
    try {
      await cancelInvitationMutation.mutateAsync(invitationId)
      toast.success('Invitation cancelled')
    } catch {
      toast.error('Failed to cancel invitation')
    }
  }

  const acceptInvite = async (invitationId: string) => {
    try {
      await acceptInvitationMutation.mutateAsync(invitationId)
      toast.success('Invitation accepted!')
    } catch {
      toast.error('Failed to accept invitation')
    }
  }

  const declineInvite = async (invitationId: string) => {
    try {
      await declineInvitationMutation.mutateAsync(invitationId)
      toast.success('Invitation declined')
    } catch {
      toast.error('Failed to decline invitation')
    }
  }

  return {
    sendInvitation,
    openSectionsModal,
    saveSections,
    removeMember,
    isRemovingMember: removeMemberMutation.isPending,
    cancelInvite,
    acceptInvite,
    declineInvite,
  }
}
