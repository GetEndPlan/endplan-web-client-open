import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal, MoreVertical } from 'lucide-react'
import { cn } from '@/shared/lib'

export type DocumentsActionMenuItem = {
  key: string
  label: string
  onSelect: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

type DocumentsActionMenuProps = {
  label: string
  items: DocumentsActionMenuItem[]
  className?: string
  menuClassName?: string
  triggerClassName?: string
  align?: 'left' | 'right'
  /** Matches Design Document Page UI: vertical dots, neutral menu (upload-dropdown style). */
  tone?: 'default' | 'drive'
  /**
   * `below` (default): open under the trigger.
   * `right`: open to the trailing side of the trigger (LTR: menu starts at trigger’s right edge + gap) — for grid card overflow buttons.
   */
  menuPlacement?: 'below' | 'right'
}

export function DocumentsActionMenu({
  label,
  items,
  className,
  menuClassName,
  triggerClassName,
  align = 'right',
  tone = 'default',
  menuPlacement = 'below',
}: DocumentsActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{
    top: number
    left: number
    placement: 'top' | 'bottom'
  } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const updateMenuPosition = (useMeasuredSize = false) => {
      const button = buttonRef.current
      if (!button) return

      const viewportPadding = 8
      const gap = 8
      const rect = button.getBoundingClientRect()
      const width = useMeasuredSize
        ? Math.max(180, menuRef.current?.offsetWidth ?? 180)
        : 180
      const measuredHeight = useMeasuredSize ? menuRef.current?.offsetHeight : undefined
      const height = Math.min(
        measuredHeight ?? Math.max(120, items.length * 42 + 8),
        window.innerHeight - viewportPadding * 2,
      )

      let left: number
      let top: number
      let placement: 'top' | 'bottom'

      if (menuPlacement === 'right') {
        let rawLeft = rect.right + gap
        if (rawLeft + width > window.innerWidth - viewportPadding) {
          rawLeft = rect.left - width - gap
        }
        left = Math.max(
          viewportPadding,
          Math.min(rawLeft, window.innerWidth - width - viewportPadding),
        )

        top = rect.top
        if (top + height > window.innerHeight - viewportPadding) {
          top = Math.max(viewportPadding, window.innerHeight - viewportPadding - height)
        }
        top = Math.max(viewportPadding, Math.min(top, window.innerHeight - height - viewportPadding))
        placement = 'bottom'
      } else {
        const rawLeft = align === 'right' ? rect.right - width : rect.left
        left = Math.max(
          viewportPadding,
          Math.min(rawLeft, window.innerWidth - width - viewportPadding),
        )

        const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
        const spaceAbove = rect.top - viewportPadding
        placement =
          spaceBelow < height && spaceAbove > spaceBelow ? 'top' : 'bottom'
        const rawTop = placement === 'top' ? rect.top - gap - height : rect.bottom + gap
        top = Math.max(
          viewportPadding,
          Math.min(rawTop, window.innerHeight - height - viewportPadding),
        )
      }

      setMenuPosition((current) => {
        if (
          current &&
          current.top === top &&
          current.left === left &&
          current.placement === placement
        ) {
          return current
        }
        return { top, left, placement }
      })
    }

    const repositionMenu = () => {
      updateMenuPosition(true)
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      setIsOpen(false)
      setMenuPosition(null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setMenuPosition(null)
      }
    }

    window.addEventListener('resize', repositionMenu)
    window.addEventListener('scroll', repositionMenu, true)
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    const rafID = window.requestAnimationFrame(() => {
      updateMenuPosition(true)
    })

    return () => {
      window.cancelAnimationFrame(rafID)
      window.removeEventListener('resize', repositionMenu)
      window.removeEventListener('scroll', repositionMenu, true)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [align, isOpen, items.length, menuPlacement])

  if (items.length === 0) return null

  return (
    <div ref={containerRef} className={cn('relative shrink-0', className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((current) => {
            const next = !current
            if (!next) {
              setMenuPosition(null)
            }
            return next
          })
        }}
        className={cn(
          tone === 'drive'
            ? 'inline-flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-500 dark:hover:bg-ep-primary-dark/50 dark:hover:text-slate-100'
            : 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ep-primary-soft bg-white text-ep-primary-accent transition hover:border-ep-primary-muted hover:bg-ep-primary-softer hover:text-ep-primary-accent dark:border-ep-primary/30 dark:bg-ep-surface-subtle dark:text-ep-primary-muted dark:hover:bg-ep-primary-dark/50 dark:hover:text-ep-primary-muted',
          triggerClassName,
        )}
      >
        {tone === 'drive' ? (
          <MoreVertical className="h-4 w-4" strokeWidth={2} />
        ) : (
          <MoreHorizontal className="h-4 w-4" />
        )}
      </button>

      {isOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className={cn(
                tone === 'drive'
                  ? 'fixed z-[80] min-w-[180px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-ep-border-card dark:bg-ep-surface-subtle'
                  : 'fixed z-[80] min-w-[180px] rounded-xl border border-ep-primary-soft bg-white p-1 shadow-lg shadow-slate-900/10 dark:border-ep-border-card dark:bg-ep-surface-subtle dark:shadow-black/30',
                menuPosition?.placement === 'top' ? 'origin-bottom-right' : 'origin-top-right',
                !menuPosition ? 'pointer-events-none opacity-0' : '',
                menuClassName,
              )}
              style={{
                top: menuPosition?.top ?? 0,
                left: menuPosition?.left ?? 0,
              }}
            >
              {items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setIsOpen(false)
                    setMenuPosition(null)
                    item.onSelect()
                  }}
                  className={cn(
                    'typo-body-sm-strong flex w-full items-center rounded-md px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60',
                    tone === 'drive'
                      ? item.variant === 'danger'
                        ? 'text-rose-600 hover:bg-gray-50 dark:text-rose-300 dark:hover:bg-ep-primary-dark/50'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-ep-primary-dark/50'
                      : item.variant === 'danger'
                        ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30'
                        : 'text-slate-700 hover:bg-ep-primary-softer hover:text-ep-primary-accent dark:text-slate-200 dark:hover:bg-ep-primary-dark/50 dark:hover:text-ep-primary-muted',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
