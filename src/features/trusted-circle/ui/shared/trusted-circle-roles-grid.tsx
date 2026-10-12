import { RoleQuadrant } from './role-quadrant'
import type { ExtendedUserRole } from './role-config'
import type { Invitation, TrustedCircleMember } from '../../api'

/** Recipient quadrant hidden until product re-enables multi-role trusted circle UI. */
const VISIBLE_ROLE_TYPES: ExtendedUserRole[] = ['key_person']

type TrustedCircleRolesGridProps = {
  members: TrustedCircleMember[]
  invitations: Invitation[]
  maxMembers: number
  keyPersonCount: number
  showPlanLimits: boolean
  inviteDisabled: boolean
  readOnly?: boolean
  isLoading: boolean
  onInvite: (role: ExtendedUserRole) => void
  onRemoveMember: (id: string, name: string) => void
  onCancelInvite: (id: string) => void
  onOpenSections: (id: string) => void
}

export function TrustedCircleRolesGrid({
  members,
  invitations,
  maxMembers,
  keyPersonCount,
  showPlanLimits,
  inviteDisabled,
  readOnly = false,
  isLoading,
  onInvite,
  onRemoveMember,
  onCancelInvite,
  onOpenSections,
}: TrustedCircleRolesGridProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {isLoading ? (
        <p className="typo-body-sm text-slate-500 dark:text-slate-400">Loading trusted circle…</p>
      ) : null}

      <div className="grid h-full min-h-0 flex-1 grid-cols-1">
        {VISIBLE_ROLE_TYPES.map((roleType) => (
          <RoleQuadrant
            key={roleType}
            roleType={roleType}
            members={members}
            invitations={invitations}
            maxSeats={showPlanLimits ? maxMembers : undefined}
            totalMembers={showPlanLimits ? keyPersonCount : undefined}
            maxMembers={showPlanLimits ? maxMembers : undefined}
            showPlanLimits={showPlanLimits}
            inviteDisabled={inviteDisabled}
            readOnly={readOnly}
            presentation="keyPersonAccess"
            onInvite={onInvite}
            onRemoveMember={onRemoveMember}
            onCancelInvite={onCancelInvite}
            onOpenSections={onOpenSections}
          />
        ))}
      </div>
    </div>
  )
}
