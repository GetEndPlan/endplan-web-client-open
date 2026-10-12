import { X } from 'lucide-react'
import { DEFAULT_MODAL_BACKDROP_CLASSNAME } from '@/shared/ui'

type SidebarMobileProps = {
    isOpen: boolean
    onClose: () => void
    closeAriaLabel?: string
    children: React.ReactNode
}

export function SidebarMobile({
    isOpen,
    onClose,
    closeAriaLabel = 'Close drawer',
    children
}: SidebarMobileProps) {
    return (
        <>
            {isOpen && (
                <div
                    className={`lg:hidden fixed inset-0 z-[60] ${DEFAULT_MODAL_BACKDROP_CLASSNAME}`}
                    onClick={onClose}
                />
            )}

            <div
                id="app-sidebar-mobile"
                className={`
          lg:hidden fixed inset-y-0 left-0 z-[70] w-72 bg-ep-surface transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-ep-body/50 hover:text-ep-body dark:text-white/60 dark:hover:text-white"
                    aria-label={closeAriaLabel}
                >
                    <X className="w-5 h-5" />
                </button>
                {children}
            </div>
        </>
    )
}
