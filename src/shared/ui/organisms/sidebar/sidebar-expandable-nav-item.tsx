import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { NavLinkLeaf } from './sidebar.types'
import { SidebarLink } from './sidebar-link'

type SidebarExpandableNavItemProps = {
  item: NavLinkLeaf
  children: NavLinkLeaf[]
  expanded: boolean
  onToggleExpand: () => void
  onNavigate?: () => void
  isCollapsed?: boolean
  expandSubNavTitle?: string
  collapseSubNavTitle?: string
  /** Extra rows under the parent (e.g. nested expandable vaults). */
  subnavFooter?: ReactNode
  /** When true, parent row shows active although `children` may be empty. */
  subnavActive?: boolean
}

export function SidebarExpandableNavItem({
  item,
  children,
  expanded,
  onToggleExpand,
  onNavigate,
  isCollapsed = false,
  expandSubNavTitle,
  collapseSubNavTitle,
  subnavFooter,
  subnavActive = false,
}: SidebarExpandableNavItemProps) {
  const { t } = useTranslation()
  const location = useLocation()

  const pathActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`)

  if (isCollapsed) {
    return <SidebarLink item={item} onNavigate={onNavigate} isCollapsed />
  }

  const parentLinkActive = pathActive(item.href)
  const childActive = children.some((c) => pathActive(c.href))
  const rowActive = parentLinkActive || childActive || subnavActive

  const rowChrome = cn(
    'flex w-full min-h-9 items-center gap-1 rounded-lg px-2 typo-nav-link typo-emphasis transition-colors',
    rowActive ? 'text-ep-primary-nav' : 'text-ep-body/80 dark:text-white',
  )

  const chevron = (
    <ChevronDown
      className={cn(
        'h-4 w-4 shrink-0 text-ep-body/40 transition-transform duration-200 dark:text-white/40',
        expanded ? 'rotate-0' : '-rotate-90',
      )}
      strokeWidth={2}
      aria-hidden
    />
  )

  return (
    <div className="space-y-0.5">
      <div
        className={cn(
          'overflow-hidden rounded-lg transition-colors',
          rowActive ? 'bg-ep-primary/10 dark:bg-ep-primary/20' : 'hover:bg-ep-surface-subtle',
        )}
      >
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          aria-controls={`${item.id}-subnav`}
          aria-labelledby={`${item.id}-label`}
          title={
            expanded
              ? (collapseSubNavTitle ??
                t('nav.sharedVault.collapseSubNav', { defaultValue: 'Hide shared sections' }))
              : (expandSubNavTitle ??
                t('nav.sharedVault.expandSubNav', { defaultValue: 'Show shared sections' }))
          }
          className={cn(rowChrome, 'text-left')}
        >
          <span
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center',
              rowActive ? 'text-ep-primary dark:text-ep-primary-soft' : 'text-ep-body/40 dark:text-white/40',
            )}
          >
            {item.icon}
          </span>
          <span id={`${item.id}-label`} className="ml-2 min-w-0 flex-1 truncate">
            {item.label}
          </span>
          {chevron}
        </button>
      </div>
      {expanded && (children.length > 0 || subnavFooter) ? (
        <div
          id={`${item.id}-subnav`}
          className="ml-2 space-y-0.5 border-l border-ep-border-subtle py-0.5 pl-2 dark:border-ep-border"
          role="group"
        >
          {children.map((child) => (
            <SidebarLink key={child.id} item={child} nested onNavigate={onNavigate} isCollapsed={false} />
          ))}
          {subnavFooter}
        </div>
      ) : null}
    </div>
  )
}
