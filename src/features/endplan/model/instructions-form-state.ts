import type { InstructionItem, InstructionStep, InstructionType } from './instructions'

export type InstructionFormState = {
  id?: string
  title: string
  instructionType: InstructionType
  noteBody: string
  steps: InstructionStep[]
  linkedAssetIds: string[]
  attachedDocumentId: string | null
  linkedContactId: string | null
}

export function blankInstructionFormState(): InstructionFormState {
  return {
    title: '',
    instructionType: 'written_note',
    noteBody: '',
    steps: [{ id: crypto.randomUUID(), title: '', text: '' }],
    linkedAssetIds: [],
    attachedDocumentId: null,
    linkedContactId: null,
  }
}

export function instructionItemToFormState(item: InstructionItem): InstructionFormState {
  return {
    id: item.id,
    title: item.title,
    instructionType: item.instructionType,
    noteBody: item.noteBody,
    steps:
      item.steps.length > 0
        ? item.steps.map((s) => ({
            ...s,
            title: s.title ?? '',
            text: s.text ?? '',
          }))
        : [{ id: crypto.randomUUID(), title: '', text: '' }],
    linkedAssetIds: item.linkedAssetIds,
    attachedDocumentId: item.attachedDocumentId,
    linkedContactId: item.linkedContactId,
  }
}

/** Short date label for instruction cards (locale-aware). */
export function formatInstructionUpdatedLabel(updatedAt: string): string {
  const parsed = new Date(updatedAt)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

type InstructionRelativeTimeTranslator = (
  key: string,
  options?: Record<string, unknown>,
) => string

/**
 * Relative “updated” label for instruction list cards
 * (just now / minutes / hours / days, then absolute date).
 */
export function formatInstructionRelativeUpdatedLabel(
  updatedAt: string,
  t: InstructionRelativeTimeTranslator,
  nowMs: number = Date.now(),
): string {
  const parsed = new Date(updatedAt)
  if (Number.isNaN(parsed.getTime())) return ''

  const diffMs = Math.max(0, nowMs - parsed.getTime())
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) {
    return t('vault.instructions.relative.justNow')
  }
  if (minutes < 60) {
    return t('vault.instructions.relative.minutesAgo', { count: minutes })
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return t('vault.instructions.relative.hoursAgo', { count: hours })
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return t('vault.instructions.relative.daysAgo', { count: days })
  }

  return formatInstructionUpdatedLabel(updatedAt)
}
