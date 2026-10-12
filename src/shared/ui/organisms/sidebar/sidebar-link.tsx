import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { NavLinkLeaf } from './sidebar.types'

type SidebarLinkProps = {
  item: NavLinkLeaf
  onNavigate?: () => void
  isCollapsed?: boolean
  /** Indented row for nested items (e.g. shared vault sections). */
  nested?: boolean
}

export function SidebarLink({ item, onNavigate, isCollapsed = false, nested = false }: SidebarLinkProps) {
  const location = useLocation()

  const pathActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(`${href}/`)
  }

  const active = pathActive(item.href)
  const hasNavHint = Boolean(item.navHint)
  const collapsedTitle =
    isCollapsed && item.navHint ? `${item.label} — ${item.navHint}` : isCollapsed ? item.label : undefined

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      data-tour={item.dataTour}
      title={collapsedTitle}
      aria-label={hasNavHint && !isCollapsed ? `${item.label}. ${item.navHint}` : item.label}
      aria-current={active ? 'page' : undefined}
      className={`
                group flex overflow-hidden rounded-lg typo-nav-link typo-emphasis transition-[padding,background-color,color] duration-200 ease-out
                ${hasNavHint ? 'min-h-[2.75rem] items-start py-1.5' : 'h-9 items-center'}
                ${isCollapsed ? 'pl-4 pr-0' : nested ? 'pl-3 pr-2' : 'px-2'}
                ${active
        ? 'bg-ep-primary/10 text-ep-primary-nav dark:bg-ep-primary/20'
        : 'text-ep-body/80 hover:bg-ep-surface-subtle dark:text-white'
      }
            `}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center ${hasNavHint ? 'mt-0.5' : ''} ${active ? 'text-ep-primary dark:text-ep-primary-soft' : 'text-ep-body/40 dark:text-white/40'}`}
      >
        {item.icon}
      </span>
      <span
        className={`
                    min-w-0 overflow-hidden transition-[max-width,opacity,margin] duration-200 ease-out
                    ${isCollapsed ? 'ml-0 max-w-0 opacity-0' : 'ml-2 max-w-[220px] flex-1 opacity-100'}
                `}
        aria-hidden={isCollapsed}
      >
        <span className="block truncate whitespace-nowrap">{item.label}</span>
        {item.navHint ? (
          <span className="mt-0.5 block truncate typo-caption text-ep-body/50 dark:text-white/60 whitespace-nowrap">
            {item.navHint}
          </span>
        ) : null}
      </span>
      <span
        className={`
                    ml-1 flex items-center gap-1 overflow-hidden transition-[max-width,opacity] duration-200 ease-out
                    ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[64px] opacity-100'}
                `}
        aria-hidden={isCollapsed}
      >
        <span
          className={`
                        bg-ep-primary-softer text-ep-primary typo-badge rounded-full whitespace-nowrap px-2 py-0.5 dark:bg-ep-primary/20 dark:text-ep-primary-soft
                        transition-opacity duration-150 ease-out
                        ${item.badge ? 'opacity-100' : 'opacity-0'}
                    `}
          aria-hidden={!item.badge}
        >
          {item.badge ?? ''}
        </span>
        <ChevronRight
          className={`w-3.5 h-3.5 shrink-0 text-ep-primary/60 transition-opacity duration-150 ease-out ${active ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden={!active}
        />
      </span>
    </Link>
  )
}
