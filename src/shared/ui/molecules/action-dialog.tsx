import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Card } from '../organisms/card'
import { ModalOverlay } from './modal-overlay'

export type ActionDialogTone = 'default' | 'danger'

type ActionDialogFrameProps = {
  title: string
  subtitle?: string
  description: ReactNode
  children: ReactNode
  onClose: () => void
  icon: ReactNode
  tone?: ActionDialogTone
  maxWidthClassName?: string
  showCloseButton?: boolean
  closeButtonLabel?: string
  isCloseDisabled?: boolean
}

const toneStyles: Record<
  ActionDialogTone,
  {
    card: string
    header: string
    icon: string
    title: string
    subtitle: string
    description: string
  }
> = {
  default: {
    card: 'border-ep-border-card bg-ep-surface',
    header: 'border-b border-ep-border-card bg-ep-surface',
    icon: 'bg-ep-primary-softer text-ep-primary dark:bg-ep-primary/15 dark:text-ep-primary-muted',
    title: 'text-ep-body',
    subtitle: 'text-ep-body/50',
    description: 'text-ep-body/80',
  },
  danger: {
    card: 'border-red-100 bg-ep-surface dark:border-red-900/60',
    header: 'border-b border-red-100 bg-red-50/80 dark:border-red-900/60 dark:bg-ep-surface',
    icon: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
    title: 'text-ep-body',
    subtitle: 'text-ep-body/50',
    description: 'text-ep-body/80',
  },
}

export function ActionDialogFrame({
  title,
  subtitle,
  description,
  children,
  onClose,
  icon,
  tone = 'default',
  maxWidthClassName = 'max-w-md',
  showCloseButton = false,
  closeButtonLabel,
  isCloseDisabled = false,
}: ActionDialogFrameProps) {
  const styles = toneStyles[tone]

  return (
    <ModalOverlay onBackdropClick={isCloseDisabled ? undefined : onClose}>
      <Card
        className={cn(
          'w-full overflow-hidden rounded-[20px] p-0 shadow-2xl shadow-slate-950/15 dark:shadow-black/35',
          maxWidthClassName,
          styles.card,
        )}
      >
        <div
          className={cn(
            'flex items-start justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5',
            styles.header,
          )}
        >
          <div className="flex min-w-0 flex-1 gap-3">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
                styles.icon,
              )}
            >
              {icon}
            </div>
            <div className="min-w-0 space-y-1.5">
              <h3 className={cn('typo-heading-card', styles.title)}>{title}</h3>
              {subtitle ? <p className={cn('typo-body-sm', styles.subtitle)}>{subtitle}</p> : null}
            </div>
          </div>

          {showCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              disabled={isCloseDisabled}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ep-body/50 transition hover:bg-ep-surface-subtle hover:text-ep-body disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={closeButtonLabel}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="space-y-5 px-4 py-5 sm:px-5 sm:py-5">
          <div className={cn('typo-body-sm max-w-xl', styles.description)}>{description}</div>
          {children}
        </div>
      </Card>
    </ModalOverlay>
  )
}
