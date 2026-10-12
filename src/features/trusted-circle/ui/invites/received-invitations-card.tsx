import { Card, Button } from '@/shared/ui'
import { ROLE_LABELS } from '../shared/role-config'
import type { ExtendedUserRole } from '../shared/role-config'
import type { Invitation } from '../../api'

type ReceivedInvitationsCardProps = {
  invitations: Invitation[]
  onAccept: (id: string) => void
  onDecline: (id: string) => void
}

export function ReceivedInvitationsCard({
  invitations,
  onAccept,
  onDecline,
}: ReceivedInvitationsCardProps) {
  if (invitations.length === 0) return null

  return (
    <Card className="bg-ep-primary-softer dark:bg-ep-primary-dark/20 border-ep-primary-soft dark:border-ep-primary-dark">
      <div className="p-4">
        <h3 className="typo-body-sm-emphasis text-ep-primary-dark dark:text-ep-primary-softer mb-3">
          You have {invitations.length} pending invitation{invitations.length > 1 ? 's' : ''}
        </h3>
        <div className="space-y-2">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-ep-surface-panel rounded-lg"
            >
              <div>
                <p className="typo-body-sm-strong text-slate-900 dark:text-slate-100">
                  {invitation.inviter?.name || 'Someone'} invited you as{' '}
                  {ROLE_LABELS[invitation.role as ExtendedUserRole] || invitation.role}
                </p>
                <p className="typo-caption text-slate-500 dark:text-slate-400">{invitation.inviter?.email}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onDecline(invitation.id)}
                >
                  Decline
                </Button>
                <Button size="sm" onClick={() => onAccept(invitation.id)}>
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
