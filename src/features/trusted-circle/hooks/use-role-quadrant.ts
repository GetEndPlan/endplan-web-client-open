import { useEffect, useRef, useState } from 'react'
import { countOccupiedRoleSeats } from '@/features/endplan/model/plan-quota-guards'
import type { Invitation, TrustedCircleMember } from '../api/index'
import type { ExtendedUserRole } from '../ui/shared/role-config'

function isOpenRoleInvitation(invitation: Invitation, roleType: ExtendedUserRole): boolean {
  return (
    invitation.role === roleType &&
    (invitation.status === 'pending' || invitation.status === 'pending_release')
  )
}

function isOccupiedRoleMember(member: TrustedCircleMember, roleType: ExtendedUserRole): boolean {
  return member.role === roleType && member.status !== 'revoked'
}

const INITIAL_VISIBLE = 4

type UseRoleQuadrantParams = {
  roleType: ExtendedUserRole
  members: TrustedCircleMember[]
  invitations: Invitation[]
  totalMembers?: number
  maxMembers?: number
}

type MemberItem = {
  type: 'member'
  id: string
  member: TrustedCircleMember
}

type PendingItem = {
  type: 'pending'
  id: string
  invitation: Invitation
}

export type RoleQuadrantItem = MemberItem | PendingItem

export function useRoleQuadrant({
  roleType,
  members,
  invitations,
  totalMembers,
  maxMembers,
}: UseRoleQuadrantParams) {
  const [expanded, setExpanded] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const helpPopoverRef = useRef<HTMLDivElement>(null)

  const roleMembers = members.filter((member) => isOccupiedRoleMember(member, roleType))
  const rolePending = invitations.filter((invitation) => isOpenRoleInvitation(invitation, roleType))

  const usedSeats = countOccupiedRoleSeats({
    role: roleType,
    members,
    sentInvitations: invitations,
  })
  const showPlanLimit =
    typeof totalMembers === 'number' && typeof maxMembers === 'number'

  const allItems: RoleQuadrantItem[] = [
    ...roleMembers.map((member) => ({ type: 'member' as const, id: member.id, member })),
    ...rolePending.map((invitation) => ({
      type: 'pending' as const,
      id: invitation.id,
      invitation,
    })),
  ]

  const totalItems = allItems.length
  const showExpand = totalItems > INITIAL_VISIBLE
  const visibleCount = expanded
    ? totalItems
    : Math.min(INITIAL_VISIBLE, totalItems)
  const visibleItems = allItems.slice(0, visibleCount)
  const hiddenCount = totalItems - visibleCount

  useEffect(() => {
    if (!isHelpOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        helpPopoverRef.current &&
        !helpPopoverRef.current.contains(event.target as Node)
      ) {
        setIsHelpOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsHelpOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isHelpOpen])

  return {
    expanded,
    hiddenCount,
    isHelpOpen,
    showExpand,
    showPlanLimit,
    usedSeats,
    visibleItems,
    helpPopoverRef,
    toggleExpanded: () => setExpanded((prev) => !prev),
    toggleHelp: () => setIsHelpOpen((prev) => !prev),
  }
}
