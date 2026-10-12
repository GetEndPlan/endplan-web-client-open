import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { PageTitle } from '../atoms/page-title'

type PageHeaderAlign = 'left' | 'center'

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  withBottomRule?: boolean
  tone?: 'slate' | 'gray'
  /** Title + description alignment. */
  align?: PageHeaderAlign
  /** Merged onto the description paragraph (e.g. muted subtitle `text-slate-500`). */
  descriptionClassName?: string
  className?: string
}

const descriptionTone: Record<'slate' | 'gray', string> = {
  slate: 'text-slate-600 dark:text-slate-400',
  gray: 'text-gray-600 dark:text-gray-400',
}

export function PageHeader({
  title,
  description,
  withBottomRule = false,
  tone = 'slate',
  align = 'left',
  descriptionClassName,
  className,
}: PageHeaderProps) {
  const titleAlign = align === 'center' ? 'center' : 'left'
  return (
    <header className={cn(description ? 'space-y-2' : undefined, align === 'center' && 'text-center', className)}>
      <PageTitle as="h1" align={titleAlign} withBottomRule={withBottomRule} tone={tone}>
        {title}
      </PageTitle>
      {description ? (
        <p className={cn('typo-body-sm', descriptionTone[tone], descriptionClassName)}>{description}</p>
      ) : null}
    </header>
  )
}
