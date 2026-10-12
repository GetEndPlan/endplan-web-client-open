import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type CardProps = {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-ep-border-card bg-ep-surface shadow-sm transition-colors',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

type CardHeaderProps = {
  title: string
  subtitle?: string
  action?: ReactNode
}

Card.Header = function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <h2 className="typo-heading-section text-ep-body">{title}</h2>
        {subtitle && <p className="typo-body-sm text-ep-body/60">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

Card.Body = function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mt-4', className)}>{children}</div>
}

Card.Footer = function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mt-6 typo-body-sm text-ep-body/60', className)}>{children}</div>
}
