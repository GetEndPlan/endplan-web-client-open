import { useTranslation } from 'react-i18next'
import { toast } from '@/shared/ui'
import { useTrustedCircleData } from './use-trusted-circle-data'
import { useTrustedCircleModalState } from './use-trusted-circle-modal-state'
import { useTrustedCircleActions } from './use-trusted-circle-actions'

export function useTrustedCirclePage() {
  const { t } = useTranslation()
  const data = useTrustedCircleData()
  const modalState = useTrustedCircleModalState()
  const actions = useTrustedCircleActions({
    openSectionsModalState: modalState.openSectionsModalState,
    setSectionsModalMember: modalState.setSectionsModalMember,
    closeSectionsModal: modalState.closeSectionsModal,
    ownerTrustedCircleReadOnly: data.ownerTrustedCircleReadOnly,
  })

  const openInviteForm: typeof modalState.openInviteForm = (role) => {
    if (data.ownerTrustedCircleReadOnly) {
      toast.error(t('trustedCircle.readOnly.cannotInvite'))
      return
    }
    if (role === 'recipient' && !data.hasKeyPerson) {
      toast.error(t('trustedCircle.inviteForm.keyPersonRequired'))
      return
    }

    modalState.openInviteForm(role)
  }

  const requestRemoveMember = (memberId: string, memberName: string) => {
    modalState.openRemoveMemberConfirm(memberId, memberName)
  }

  const confirmRemoveMember = async () => {
    if (!modalState.memberPendingRemoval) {
      return
    }

    const removed = await actions.removeMember(modalState.memberPendingRemoval.id)
    if (removed) {
      modalState.closeRemoveMemberConfirm()
    }
  }

  const confirmCancelInvite = async () => {
    if (!modalState.invitePendingCancel) return
    await actions.cancelInvite(modalState.invitePendingCancel)
    modalState.closeCancelInviteConfirm()
  }

  return {
    ...data,
    showInviteForm: modalState.showInviteForm,
    selectedRole: modalState.selectedRole,
    showSectionsModal: modalState.showSectionsModal,
    memberForSectionsModal: modalState.memberForSectionsModal,
    memberPendingRemoval: modalState.memberPendingRemoval,
    invitePendingCancel: modalState.invitePendingCancel,
    openInviteForm,
    closeInviteForm: modalState.closeInviteForm,
    closeSectionsModal: modalState.closeSectionsModal,
    closeRemoveMemberConfirm: modalState.closeRemoveMemberConfirm,
    requestRemoveMember,
    confirmRemoveMember,
    requestCancelInvite: modalState.requestCancelInvite,
    closeCancelInviteConfirm: modalState.closeCancelInviteConfirm,
    confirmCancelInvite,
    ...actions,
  }
}
