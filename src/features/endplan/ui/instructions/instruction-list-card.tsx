import { Check, FileText, ListOrdered } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import {
  instructionListPreviewSnippet,
  type InstructionItem,
} from '../../model/instructions'
import { formatInstructionRelativeUpdatedLabel } from '../../model/instructions-form-state'
import { DocumentsActionMenu } from '../documents/documents-action-menu'

type InstructionListCardProps = {
  instruction: InstructionItem
  onOpen: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function InstructionListCard({
  instruction,
  onOpen,
  onEdit,
  onDelete,
  className,
}: InstructionListCardProps) {
  const { t } = useTranslation()
  const previewText = instructionListPreviewSnippet(instruction)
  const isWrittenNote = instruction.instructionType === 'written_note'
  const showMenu = Boolean(onEdit || onDelete)

  const menuItems = [
    onEdit
      ? {
          key: 'edit',
          label: t('vault.instructions.cardEdit'),
          onSelect: onEdit,
        }
      : null,
    onDelete
      ? {
          key: 'delete',
          label: t('vault.instructions.cardDelete'),
          onSelect: onDelete,
          variant: 'danger' as const,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item != null)

  return (
    <article
      role="button"
      tabIndex={0}
      className={cn(
        'flex cursor-pointer flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 outline-none transition hover:border-ep-primary/40 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ep-primary dark:border-slate-700 dark:bg-ep-surface-panel dark:hover:border-ep-primary-accent',
        className,
      )}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              'inline-flex size-9 shrink-0 items-center justify-center rounded-xl',
              isWrittenNote
                ? 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300'
                : 'bg-ep-primary-softer text-ep-primary dark:bg-ep-primary-darker/50 dark:text-ep-primary-soft',
            )}
            aria-hidden
          >
            {isWrittenNote ? (
              <FileText className="size-4" strokeWidth={1.75} />
            ) : (
              <ListOrdered className="size-4" strokeWidth={1.75} />
            )}
          </span>
          <span
            className={cn(
              'typo-caption-emphasis rounded-full px-2.5 py-1 uppercase tracking-wide',
              isWrittenNote
                ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
                : 'bg-ep-primary-softer text-ep-primary-dark dark:bg-ep-primary-darker/60 dark:text-ep-primary-softer',
            )}
          >
            {isWrittenNote
              ? t('vault.instructions.type.written')
              : t('vault.instructions.type.stepByStep')}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
            title={t('vault.instructions.cardReadyLabel')}
            aria-label={t('vault.instructions.cardReadyLabel')}
          >
            <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
          </span>
          {showMenu ? (
            <div
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <DocumentsActionMenu
                label={t('vault.instructions.cardMenuLabel')}
                items={menuItems}
                tone="drive"
                triggerClassName="size-8 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="typo-heading-subcard text-ep-body dark:text-white">{instruction.title}</h3>
        <p className="mt-2 line-clamp-3 typo-body-sm text-slate-500 dark:text-slate-400">
          {previewText || t('vault.instructions.listNoPreview')}
        </p>
      </div>

      <div className="flex items-center justify-end border-t border-slate-100 pt-3 dark:border-ep-border-card">
        <span className="typo-caption text-slate-400 dark:text-slate-500">
          {formatInstructionRelativeUpdatedLabel(instruction.updatedAt, t)}
        </span>
      </div>
    </article>
  )
}
