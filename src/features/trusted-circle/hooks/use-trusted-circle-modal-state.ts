import { useState } from 'react'
import type { ExtendedUserRole } from '../ui/shared/role-config'
import type { TrustedCircleMember } from '../api/index'

type MemberPendingRemoval = {
  id: string
  name: string
}

export function useTrustedCircleModalState() {
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [selectedRole, setSelectedRole] = useState<ExtendedUserRole | null>(null)
  const [showSectionsModal, setShowSectionsModal] = useState(false)
  const [memberForSectionsModal, setMemberForSectionsModal] = useState<TrustedCircleMember | null>(null)
  const [memberPendingRemoval, setMemberPendingRemoval] = useState<MemberPendingRemoval | null>(null)
  const [invitePendingCancel, setInvitePendingCancel] = useState<string | null>(null)

  const openInviteForm = (role: ExtendedUserRole) => {
    setSelectedRole(role)
    setShowInviteForm(true)
  }

  const closeInviteForm = () => {
    setShowInviteForm(false)
  }

  const openSectionsModalState = () => {
    setShowSectionsModal(true)
  }

  const setSectionsModalMember = (member: TrustedCircleMember | null) => {
    setMemberForSectionsModal(member)
  }

  const closeSectionsModal = () => {
    setShowSectionsModal(false)
    setMemberForSectionsModal(null)
  }

  const openRemoveMemberConfirm = (memberId: string, memberName: string) => {
    setMemberPendingRemoval({ id: memberId, name: memberName })
  }

  const closeRemoveMemberConfirm = () => {
    setMemberPendingRemoval(null)
  }

  return {
    showInviteForm,
    selectedRole,
    showSectionsModal,
    memberForSectionsModal,
    memberPendingRemoval,
    invitePendingCancel,
    openInviteForm,
    closeInviteForm,
    openSectionsModalState,
    setSectionsModalMember,
    closeSectionsModal,
    openRemoveMemberConfirm,
    closeRemoveMemberConfirm,
    requestCancelInvite: setInvitePendingCancel,
    closeCancelInviteConfirm: () => setInvitePendingCancel(null),
  }
}
