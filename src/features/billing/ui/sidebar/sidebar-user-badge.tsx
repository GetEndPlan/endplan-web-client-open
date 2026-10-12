import { useSidebarUserBadge } from '../../hooks/use-sidebar-user-badge'

type SidebarUserBadgeProps = {
  enabled?: boolean
  isCollapsed: boolean
}

export function SidebarUserBadge({ enabled = true, isCollapsed }: SidebarUserBadgeProps) {
  const badge = useSidebarUserBadge({ enabled })

  if (!badge) {
    return null
  }

  const { displayName, initials } = badge
  const tooltip = displayName

  const avatar = (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ep-primary typo-body-sm-strong text-white"
      aria-hidden
    >
      {initials}
    </div>
  )

  if (isCollapsed) {
    return (
      <div
        className="shrink-0 border-t border-ep-border-subtle px-2 py-3"
        title={tooltip}
        aria-label={tooltip}
      >
        <div className="flex justify-center">{avatar}</div>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-ep-border-subtle px-3 py-3">
      <div className="flex min-w-0 items-center gap-3" title={tooltip}>
        {avatar}
        <div className="min-w-0 flex-1">
          <p className="truncate typo-body-sm-strong text-ep-body">{displayName}</p>
        </div>
      </div>
    </div>
  )
}
