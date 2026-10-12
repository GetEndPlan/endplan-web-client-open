import { cn } from '@/shared/lib/cn'

type RecoveryPhraseWordGridProps = {
  words: string[]
  className?: string
}

/** 3×4 numbered grid matching the security-setup recovery layout. */
export function RecoveryPhraseWordGrid({ words, className }: RecoveryPhraseWordGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2 sm:grid-cols-4',
        className,
      )}
    >
      {words.map((word, index) => (
        <div
          key={`${index}-${word}`}
          className="flex items-center gap-2 rounded-lg bg-slate-800/90 px-2.5 py-2 dark:bg-slate-950/80"
        >
          <span className="typo-caption-strong shrink-0 text-ep-primary-accent tabular-nums">{index + 1}</span>
          <span className="min-w-0 truncate typo-body-sm text-slate-100">{word}</span>
        </div>
      ))}
    </div>
  )
}
