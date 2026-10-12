import type { ReactNode } from 'react'
import { Plus, X, Mail, Clock, ChevronDown, ChevronUp, CircleHelp, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/constants/routes'
import { Button, Card } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_ICONS, ROLE_COLORS, ROLE_HELP_DETAILS } from './role-config'
import type { ExtendedUserRole } from './role-config'
import type { TrustedCircleMember, Invitation } from '../../api'
import { useRoleQuadrant } from '../../hooks/use-role-quadrant'

type RoleQuadrantPresentation = 'default' | 'keyPersonAccess'

type AccessTiming = 'now' | 'in_end'

function KeyPersonListIdentity({
  name,
  accessTiming,
  status,
}: {
  name: string
  accessTiming?: AccessTiming
  status?: ReactNode
}) {
  const { t } = useTranslation()
  const accessTimingLabel =
    accessTiming === 'now'
      ? t('trustedCircle.inviteForm.accessNow')
      : accessTiming === 'in_end'
        ? t('trustedCircle.inviteForm.accessInEnd')
        : null

  return (
    <div className="min-w-0">
      <p className="truncate typo-body-sm-strong text-slate-900 dark:text-slate-100">{name}</p>
      {accessTimingLabel ? (
        <p
          className={cn(
            'truncate typo-caption',
            accessTiming === 'now'
              ? 'text-slate-400 dark:text-slate-500'
              : 'text-slate-600 dark:text-slate-400',
          )}
        >
          {accessTimingLabel}
        </p>
      ) : null}
      {status}
    </div>
  )
}

type RoleQuadrantProps = {
  roleType: ExtendedUserRole
  members: TrustedCircleMember[]
  invitations: Invitation[]
  maxSeats?: number
  totalMembers?: number
  maxMembers?: number
  showPlanLimits?: boolean
  inviteDisabled?: boolean
  readOnly?: boolean
  presentation?: RoleQuadrantPresentation
  onInvite: (role: ExtendedUserRole) => void
  onRemoveMember: (id: string, name: string) => void
  onCancelInvite: (id: string) => void
  onOpenSections: (id: string) => void
}

export function RoleQuadrant({
  roleType,
  members,
  invitations,
  maxSeats = 4,
  totalMembers,
  maxMembers,
  showPlanLimits = false,
  inviteDisabled = false,
  readOnly = false,
  presentation = 'default',
  onInvite,
  onRemoveMember,
  onCancelInvite,
  onOpenSections,
}: RoleQuadrantProps) {
  const { t } = useTranslation()
  const isKeyPersonAccess = presentation === 'keyPersonAccess'
  const {
    expanded,
    hiddenCount,
    isHelpOpen,
    showExpand,
    usedSeats,
    visibleItems,
    helpPopoverRef,
    toggleExpanded,
    toggleHelp,
  } = useRoleQuadrant({
    roleType,
    members,
    invitations,
    totalMembers,
    maxMembers,
  })
  const hasItems = usedSeats > 0
  const seatLimit = showPlanLimits && typeof maxSeats === 'number' ? maxSeats : undefined
  const canInvite =
    seatLimit != null && usedSeats < seatLimit && !inviteDisabled && !readOnly
  const atPlanLimit =
    showPlanLimits &&
    !readOnly &&
    !canInvite &&
    (inviteDisabled || (seatLimit != null && usedSeats >= seatLimit))

  const helpPopover = (
    <div className="relative" ref={helpPopoverRef}>
      <button
        type="button"
        onClick={toggleHelp}
        className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-ep-surface-panel"
        aria-label={t('trustedCircle.keyPersonAccess.helpAria', { role: ROLE_LABELS[roleType] })}
        title={t('trustedCircle.keyPersonAccess.helpAria', { role: ROLE_LABELS[roleType] })}
        aria-expanded={isHelpOpen}
        aria-haspopup="dialog"
      >
        <CircleHelp className="h-5 w-5 text-slate-500 dark:text-slate-400" />
      </button>
      {isHelpOpen ? (
        <div
          role="dialog"
          aria-label={t('trustedCircle.keyPersonAccess.helpAria', { role: ROLE_LABELS[roleType] })}
          className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-ep-primary-soft bg-white p-3 shadow-xl dark:border-ep-primary-dark dark:bg-slate-900 sm:w-80"
        >
          <p className="typo-caption-emphasis text-ep-primary-dark dark:text-ep-primary-soft">
            {ROLE_HELP_DETAILS[roleType].title}
          </p>
          <p className="mt-1 typo-caption text-ep-primary-dark dark:text-ep-primary-muted">
            {ROLE_HELP_DETAILS[roleType].description}
          </p>
          <ul className="mt-2 space-y-1">
            {ROLE_HELP_DETAILS[roleType].bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-2 typo-caption text-ep-primary-dark dark:text-ep-primary-muted"
              >
                <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ep-primary-accent dark:bg-ep-primary" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          {ROLE_HELP_DETAILS[roleType].note ? (
            <p className="mt-2 typo-caption-strong text-ep-primary-dark dark:text-ep-primary-soft">
              {ROLE_HELP_DETAILS[roleType].note}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )

  const memberList = (
    <>
      {visibleItems.map((item) => {
        if (item.type === 'member') {
          const memberName = item.member.member?.name || item.member.member?.email || 'Unknown'
          const memberEmail = item.member.member?.email || ''
          const statusLabel =
            item.member.status === 'active'
              ? t('trustedCircle.keyPersonAccess.status.active')
              : item.member.status
          const memberStatusLine = (
            <p
              className={cn(
                'shrink-0 typo-caption',
                item.member.status === 'active'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {statusLabel}
            </p>
          )
          const memberIdentity = isKeyPersonAccess ? (
            <KeyPersonListIdentity name={memberName} accessTiming={item.member.accessTiming} />
          ) : (
            <div className="min-w-0">
              <p className="truncate typo-body-sm-strong text-slate-900 dark:text-slate-100">{memberName}</p>
              {memberStatusLine}
            </div>
          )
          const memberAvatar = (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ep-primary to-ep-primary-accent text-white typo-caption-emphasis">
              {item.member.member?.name?.charAt(0)?.toUpperCase() ||
                item.member.member?.email?.charAt(0)?.toUpperCase() ||
                '?'}
            </div>
          )
          return (
            <div
              key={item.id}
              title={memberEmail || undefined}
              className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-ep-primary-dark/50"
            >
              {readOnly ? (
                <div className="-m-2 flex min-w-0 flex-1 items-center gap-3 p-2 text-left">
                  {memberAvatar}
                  {memberIdentity}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenSections(item.member.id)}
                  className="-m-2 flex min-w-0 flex-1 items-center gap-3 rounded p-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50"
                >
                  {memberAvatar}
                  {memberIdentity}
                </button>
              )}
              <div className="flex shrink-0 items-center gap-2">
                {isKeyPersonAccess ? memberStatusLine : null}
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveMember(item.member.id, memberName)
                    }}
                    className="shrink-0 p-1 text-slate-400 transition-colors hover:text-red-500 dark:hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          )
        }

        if (item.type === 'pending') {
          const pendingName = item.invitation.inviteeName || item.invitation.inviteeEmail
          const pendingStatusLine = (
            <p className="flex items-center gap-1 typo-caption text-[#92400e]">
              <Clock className="h-3 w-3 shrink-0 text-[#92400e]" />
              {t('trustedCircle.keyPersonAccess.status.pending')}
            </p>
          )
          const pendingIdentity = isKeyPersonAccess ? (
            <KeyPersonListIdentity
              name={pendingName}
              accessTiming={item.invitation.accessTiming}
            />
          ) : (
            <div className="min-w-0">
              <p className="truncate typo-body-sm-strong text-slate-900 dark:text-slate-100">{pendingName}</p>
              {pendingStatusLine}
            </div>
          )
          return (
            <div
              key={item.id}
              title={item.invitation.inviteeEmail || undefined}
              className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-900/20"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-800/50 dark:text-amber-400">
                  <Mail className="h-4 w-4" />
                </div>
                {pendingIdentity}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isKeyPersonAccess ? pendingStatusLine : null}
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => onCancelInvite(item.invitation.id)}
                    className="shrink-0 p-1 text-slate-400 transition-colors hover:text-red-500 dark:hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          )
        }

        return null
      })}
      {showExpand ? (
        <button
          type="button"
          onClick={toggleExpanded}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 typo-body-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-ep-primary dark:text-slate-400 dark:hover:bg-ep-primary-dark/50 dark:hover:text-ep-primary-accent"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              {t('trustedCircle.keyPersonAccess.showLess')}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              {t('trustedCircle.keyPersonAccess.showMore', { count: hiddenCount })}
            </>
          )}
        </button>
      ) : null}
    </>
  )

  if (isKeyPersonAccess) {
    return (
      <Card className="flex h-full flex-col border border-slate-200/90 shadow-sm dark:border-slate-700">
        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ep-primary-softer dark:bg-ep-primary-dark/40">
                <User className="h-5 w-5 text-ep-primary-accent dark:text-ep-primary-muted" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="typo-body-base-strong text-slate-950 dark:text-slate-50">
                  {ROLE_LABELS[roleType]}
                  {seatLimit != null ? (
                    <span className="ml-2 typo-body-sm text-slate-500 dark:text-slate-400">
                      {t('trustedCircle.keyPersonAccess.seatCount', {
                        used: usedSeats,
                        max: seatLimit,
                      })}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 typo-caption text-slate-500 dark:text-slate-400">
                  {t('trustedCircle.keyPersonAccess.cardSubtitle')}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!readOnly ? helpPopover : null}
              {canInvite ? (
                <button
                  type="button"
                  onClick={() => onInvite(roleType)}
                  className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-ep-surface-panel"
                  aria-label={t('trustedCircle.keyPersonAccess.inviteAria')}
                  title={t('trustedCircle.keyPersonAccess.inviteAria')}
                >
                  <Plus className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </button>
              ) : null}
            </div>
          </div>

          <p className="mt-4 typo-body-sm text-slate-600 dark:text-slate-400">
            {t('trustedCircle.keyPersonAccess.accessTimingHint')}
          </p>

          <div className="mt-5 h-56 shrink-0 overflow-hidden">
            {!hasItems && canInvite ? (
              <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center dark:border-slate-600 dark:bg-ep-primary-dark/30">
                <p className="typo-body-sm text-slate-500 dark:text-slate-400">
                  {t('trustedCircle.keyPersonAccess.emptyMessage')}
                </p>
                <Button type="button" variant="primary" className="mt-5" onClick={() => onInvite(roleType)}>
                  {t('trustedCircle.keyPersonAccess.emptyCta')}
                </Button>
              </div>
            ) : null}
            {!hasItems && !canInvite && readOnly ? (
              <p className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center typo-body-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                {t('trustedCircle.readOnly.emptyRole', { role: ROLE_LABELS[roleType] })}
              </p>
            ) : null}
            {!hasItems && atPlanLimit ? (
              <p className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-amber-300 bg-amber-50/80 px-6 py-10 text-center dark:border-amber-800 dark:bg-amber-950/20">
                <span className="typo-body-sm text-amber-900 dark:text-amber-100">
                  {t('trustedCircle.keyPersonAccess.atLimit')}{' '}
                  <Link to={ROUTES.SETTINGS_BILLING_UPGRADE} className="typo-emphasis underline underline-offset-2">
                    {t('trustedCircle.keyPersonAccess.upgradeLink')}
                  </Link>
                </span>
              </p>
            ) : null}
            {hasItems ? (
              <div className="h-full space-y-2 overflow-y-auto pr-0.5">{memberList}</div>
            ) : null}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={`border-2 ${ROLE_COLORS[roleType].includes('border-') ? '' : 'border-slate-200 dark:border-slate-700'}`}
    >
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${ROLE_COLORS[roleType]}`}>{ROLE_ICONS[roleType]}</div>
            <div>
              <p className="typo-heading-mini text-slate-900 dark:text-slate-100">{ROLE_LABELS[roleType]}</p>
              <p className="typo-caption text-slate-500 dark:text-slate-400">
                {usedSeats} {usedSeats === 1 ? 'person' : 'people'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {helpPopover}
            {canInvite && hasItems ? (
              <button
                type="button"
                onClick={() => onInvite(roleType)}
                className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-ep-surface-panel"
                aria-label={`Invite ${ROLE_LABELS[roleType]}`}
                title={`Invite ${ROLE_LABELS[roleType]}`}
              >
                <Plus className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </button>
            ) : null}
          </div>
        </div>

        <p className="mb-4 typo-caption text-slate-500 dark:text-slate-400">{ROLE_DESCRIPTIONS[roleType]}</p>

        <div className="space-y-2 text-center">
          {!hasItems && canInvite ? (
            <>
              <p className="mb-4 typo-caption text-slate-500 dark:text-slate-400">
                No {ROLE_LABELS[roleType]} added yet.
              </p>
              <Button type="button" variant="primary" onClick={() => onInvite(roleType)}>
                {t('trustedCircle.emptyState.addFirstRole', {
                  role: ROLE_LABELS[roleType].toLowerCase(),
                })}
              </Button>
            </>
          ) : null}
          {!hasItems && !canInvite && readOnly ? (
            <p className="mb-4 typo-caption text-slate-500 dark:text-slate-400">
              {t('trustedCircle.readOnly.emptyRole', {
                role: ROLE_LABELS[roleType],
              })}
            </p>
          ) : null}
          {hasItems ? memberList : null}
        </div>
      </div>
    </Card>
  )
}
