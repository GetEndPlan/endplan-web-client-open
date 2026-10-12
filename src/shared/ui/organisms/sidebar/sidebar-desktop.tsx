
import { type ReactNode } from 'react'

type SidebarDesktopProps = {
    children: ReactNode
    isCollapsed?: boolean
    onMouseEnter?: () => void
    onMouseLeave?: () => void
}

export function SidebarDesktop({
    children,
    isCollapsed = false,
    onMouseEnter,
    onMouseLeave
}: SidebarDesktopProps) {
    return (
        <div
            id="app-sidebar-desktop"
            className={`
                relative hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 lg:overflow-hidden bg-ep-surface
                after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:z-10 after:w-px after:bg-ep-border-subtle after:content-['']
                transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[width]
                ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
            `}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {children}
        </div>
    )
}
