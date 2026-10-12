import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { PageTitle } from '../atoms/page-title'

type AuthFormHeaderAlign = 'center' | 'responsive'

type AuthFormHeaderProps = {
  title: ReactNode
  subtitle?: ReactNode
  align?: AuthFormHeaderAlign
  className?: string
}

const wrapAlign: Record<AuthFormHeaderAlign, string> = {
  center: 'text-center',
  responsive: 'text-center lg:text-left',
}

const titleAlign = {
  center: 'center' as const,
  responsive: 'responsive' as const,
}

export function AuthFormHeader({ title, subtitle, align = 'responsive', className }: AuthFormHeaderProps) {
  return (
    <div className={cn(wrapAlign[align], className)}>
      <PageTitle align={titleAlign[align]}>{title}</PageTitle>
      {subtitle ? (
        <p className="mt-2 typo-body-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
      ) : null}
    </div>
  )
}
