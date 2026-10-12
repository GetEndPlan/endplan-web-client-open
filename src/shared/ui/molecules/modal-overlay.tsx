import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

/** Frosted modal backdrop: light tint + very subtle backdrop blur. */
export const DEFAULT_MODAL_BACKDROP_CLASSNAME =
  'bg-black/20 backdrop-blur-[1px] backdrop-saturate-150 dark:bg-black/35'

/** Stronger dim for onboarding so dashboard content does not compete with the modal. */
export const ONBOARDING_MODAL_BACKDROP_CLASSNAME =
  'bg-black/55 backdrop-blur-[2px] backdrop-saturate-150 dark:bg-black/70'

type ModalOverlayProps = {
  children: ReactNode
  onBackdropClick?: () => void
  backdropClassName?: string
  containerClassName?: string
  lockScroll?: boolean
}

export function ModalOverlay({
  children,
  onBackdropClick,
  backdropClassName,
  containerClassName,
  lockScroll = true,
}: ModalOverlayProps) {
  useEffect(() => {
    if (!lockScroll) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [lockScroll])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className={cn('fixed inset-0 z-[70] flex items-center justify-center p-4', containerClassName)}>
      <div
        className={cn('absolute inset-0', backdropClassName ?? DEFAULT_MODAL_BACKDROP_CLASSNAME)}
        onClick={onBackdropClick}
      />
      <div className="relative z-10 w-full flex justify-center">{children}</div>
    </div>,
    document.body
  )
}
