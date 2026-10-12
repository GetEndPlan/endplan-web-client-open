import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type PageTitleTone = 'slate' | 'gray'
type PageTitleAlign = 'left' | 'center' | 'responsive'

export type PageTitleElement = 'h1' | 'h2' | 'p' | 'span'

export type PageTitleProps = {
  as?: PageTitleElement
  children: ReactNode
  align?: PageTitleAlign
  withBottomRule?: boolean
  tone?: PageTitleTone
  className?: string
  id?: string
}

const toneClasses: Record<PageTitleTone, string> = {
  slate: 'text-slate-900 dark:text-slate-100',
  gray: 'text-gray-900 dark:text-gray-100',
}

const alignClasses: Record<PageTitleAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  responsive: 'text-center lg:text-left',
}

export function PageTitle({
  as: Comp = 'h1',
  children,
  align = 'left',
  withBottomRule = false,
  tone = 'slate',
  className,
  id,
}: PageTitleProps) {
  return (
    <Comp
      id={id}
      className={cn(
        'typo-heading-page-static',
        toneClasses[tone],
        withBottomRule && 'border-b border-slate-200 dark:border-slate-700 pb-2',
        alignClasses[align],
        className,
      )}
    >
      {children}
    </Comp>
  )
}
