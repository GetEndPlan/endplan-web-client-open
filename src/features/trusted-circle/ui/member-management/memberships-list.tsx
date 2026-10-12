import { Card } from '@/shared/ui'
import { ROLE_COLORS, ROLE_LABELS } from '../shared/role-config'
import type { ExtendedUserRole } from '../shared/role-config'
import type { TrustedCircleMember } from '../../api'

type MembershipsListProps = {
    memberships: TrustedCircleMember[]
}

export function MembershipsList({ memberships }: MembershipsListProps) {
    if (memberships.length === 0) return null

    return (
        <Card>
            <Card.Header
                title="Circles I'm Part Of"
                subtitle="EndPlans I have access to as a trusted member"
            />
            <Card.Body>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {memberships.map((membership) => (
                        <div key={membership.id} className="py-4 first:pt-0 last:pb-0">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-ep-primary to-ep-primary-accent rounded-full flex items-center justify-center text-white typo-emphasis-strong">
                                        {membership.member?.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="typo-emphasis text-gray-900 dark:text-gray-100">
                                            {membership.member?.name || 'Unknown'}'s EndPlan
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded typo-caption-strong ${ROLE_COLORS[membership.role as ExtendedUserRole] || 'bg-gray-100 text-gray-600'}`}>
                                                {ROLE_LABELS[membership.role as ExtendedUserRole] || membership.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card.Body>
        </Card>
    )
}
