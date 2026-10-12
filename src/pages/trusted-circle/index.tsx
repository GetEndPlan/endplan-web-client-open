import { useTranslation } from 'react-i18next'
import { XCircle } from 'lucide-react'
import { Spinner, ActionDialogFrame, Button } from '@/shared/ui'
import { SubscriptionAccessBanner } from '@/features/billing'
import {
  TrustedCircleModals,
  ReceivedInvitationsCard,
  MembershipsList,
  TrustedCircleRolesGrid,
  KeyPersonAccessHeader,
  HowInviteWorksCard,
  useTrustedCirclePage,
} from '@/features/trusted-circle'
import { useKeyPersonPageGate } from '@/features/trusted-circle/hooks/use-key-person-page-gate'
import { KeyPersonStartOwnEndplanGateModal } from '@/features/trusted-circle/ui/key-person/key-person-start-own-endplan-gate-modal'

export function TrustedCirclePage() {
  const {
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
    isLoading,
    showInviteForm,
    selectedRole,
    showSectionsModal,
    memberForSectionsModal,
    memberPendingRemoval,
    invitePendingCancel,
    openInviteForm,
    closeInviteForm,
    closeSectionsModal,
    closeRemoveMemberConfirm,
    sendInvitation,
    openSectionsModal,
    saveSections,
    requestRemoveMember,
    confirmRemoveMember,
    requestCancelInvite,
    closeCancelInviteConfirm,
    confirmCancelInvite,
    isRemovingMember,
    acceptInvite,
    declineInvite,
  } = useTrustedCirclePage()
  const { t } = useTranslation()
  const gate = useKeyPersonPageGate()
  const wrap = gate.wrapIfSuppressed

  if (!user) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-8 lg:pt-0">
      {gate.requiresGate ? (
        <KeyPersonStartOwnEndplanGateModal
          isOpen={gate.showGateModal}
          onStartOwnEndplan={gate.onStartOwnEndplan}
          onContinueFree={gate.onContinueFree}
        />
      ) : null}

      <KeyPersonAccessHeader />

      {ownerTrustedCircleReadOnly ? (
        <SubscriptionAccessBanner message={t('trustedCircle.readOnly.banner')} />
      ) : null}

      <ReceivedInvitationsCard
        invitations={receivedInvitations}
        onAccept={wrap(acceptInvite)}
        onDecline={wrap(declineInvite)}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
        <div className="flex min-h-0 flex-col lg:col-span-2">
          <TrustedCircleRolesGrid
            members={members}
            invitations={sentInvitations}
            maxMembers={maxMembers}
            keyPersonCount={keyPersonCount}
            showPlanLimits={showPlanLimits}
            inviteDisabled={atLimit}
            readOnly={ownerTrustedCircleReadOnly}
            isLoading={isLoading}
            onInvite={wrap(openInviteForm)}
            onRemoveMember={wrap(requestRemoveMember)}
            onCancelInvite={wrap(requestCancelInvite)}
            onOpenSections={wrap(openSectionsModal)}
          />
        </div>
        <div className="flex min-h-0">
          <HowInviteWorksCard />
        </div>
      </div>

      <MembershipsList memberships={memberships} />

      <TrustedCircleModals
        showInviteForm={showInviteForm}
        selectedRole={selectedRole}
        showSectionsModal={showSectionsModal}
        memberForSectionsModal={memberForSectionsModal}
        memberPendingRemoval={memberPendingRemoval}
        isRemovingMember={isRemovingMember}
        onCloseInvite={closeInviteForm}
        onSendInvitation={sendInvitation}
        onCloseSections={closeSectionsModal}
        onSaveSections={saveSections}
        onCloseRemoveMember={closeRemoveMemberConfirm}
        onConfirmRemoveMember={confirmRemoveMember}
      />

      {invitePendingCancel != null && (
        <ActionDialogFrame
          title={t('trustedCircle.cancelInvite.title', { defaultValue: 'Cancel Invitation' })}
          description={t('trustedCircle.cancelInvite.description', {
            defaultValue:
              'Are you sure you want to cancel this invitation? The recipient will no longer be able to accept it.',
          })}
          icon={<XCircle className="h-5 w-5" />}
          tone="danger"
          onClose={closeCancelInviteConfirm}
        >
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={closeCancelInviteConfirm}>
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button onClick={() => void confirmCancelInvite()}>
              {t('trustedCircle.cancelInvite.confirm', { defaultValue: 'Cancel Invitation' })}
            </Button>
          </div>
        </ActionDialogFrame>
      )}
    </div>
  )
}
