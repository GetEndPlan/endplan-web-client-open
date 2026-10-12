import { useTranslation } from 'react-i18next'
import { InviteMemberModal } from '../invites/invite-member-modal'
import { MemberSectionsModal } from '../member-management/member-sections-modal'
import { TrustedCircleRemoveMemberModal } from '../member-management/trusted-circle-remove-member-modal'
import type { ExtendedUserRole } from './role-config'
import type { CreateInvitationRequest, Invitation, TrustedCircleMember } from '../../api'

type TrustedCircleModalsProps = {
  showInviteForm: boolean
  selectedRole: ExtendedUserRole | null
  showSectionsModal: boolean
  memberForSectionsModal: TrustedCircleMember | null
  memberPendingRemoval: { id: string; name: string } | null
  sectionsGranted?: string[]
  sectionItemsGrantedMax?: number
  isRemovingMember: boolean
  onCloseInvite: () => void
  onSendInvitation: (data: CreateInvitationRequest) => Promise<Invitation>
  onCloseSections: () => void
  onSaveSections: (memberId: string, allowedSectionTypes: string[]) => Promise<void>
  onCloseRemoveMember: () => void
  onConfirmRemoveMember: () => void
}

export function TrustedCircleModals({
  showInviteForm,
  selectedRole,
  showSectionsModal,
  memberForSectionsModal,
  memberPendingRemoval,
  sectionsGranted,
  sectionItemsGrantedMax,
  isRemovingMember,
  onCloseInvite,
  onSendInvitation,
  onCloseSections,
  onSaveSections,
  onCloseRemoveMember,
  onConfirmRemoveMember,
}: TrustedCircleModalsProps) {
  const { t } = useTranslation()

  return (
    <>
      {showInviteForm && selectedRole && (
        <InviteMemberModal
          role={selectedRole}
          onClose={onCloseInvite}
          onSend={onSendInvitation}
          t={t}
          sectionsGranted={sectionsGranted}
          sectionItemsGrantedMax={sectionItemsGrantedMax}
        />
      )}

      {showSectionsModal && memberForSectionsModal && (
        <MemberSectionsModal
          member={memberForSectionsModal}
          onClose={onCloseSections}
          onSave={onSaveSections}
          t={t}
          sectionsGranted={sectionsGranted}
          sectionItemsGrantedMax={sectionItemsGrantedMax}
        />
      )}

      <TrustedCircleRemoveMemberModal
        isOpen={memberPendingRemoval != null}
        memberName={memberPendingRemoval?.name ?? null}
        isRemoving={isRemovingMember}
        onClose={onCloseRemoveMember}
        onConfirm={() => void onConfirmRemoveMember()}
      />
    </>
  )
}
