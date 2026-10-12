import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../../lib/cn'

const linkBase = 'ep-link'

export type TextLinkVariant = 'emphasis' | 'bodyStrong' | 'caption'

const variantClasses: Record<TextLinkVariant, string> = {
  emphasis: `typo-emphasis-strong ${linkBase}`,
  bodyStrong: `typo-body-sm-strong ${linkBase}`,
  caption: `typo-caption ${linkBase}`,
}

export type TextLinkProps = LinkProps & {
  variant?: TextLinkVariant
}

export function TextLink({ variant = 'emphasis', className, ...props }: TextLinkProps) {
  return <Link className={cn(variantClasses[variant], className)} {...props} />
}

export type TextLinkButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: TextLinkVariant
  children: ReactNode
}

export function TextLinkButton({
  variant = 'emphasis',
  className,
  type = 'button',
  children,
  ...props
}: TextLinkButtonProps) {
  return (
    <button type={type} className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </button>
  )
}
