export type InstructionType = 'written_note' | 'step_by_step'

export type InstructionStep = {
  id: string
  /** Short label for the step (shown in list / collapsed editor). */
  title: string
  text: string
}

export type InstructionItem = {
  id: string
  title: string
  instructionType: InstructionType
  noteBody: string
  steps: InstructionStep[]
  linkedAssetIds: string[]
  attachedDocumentId: string | null
  linkedContactId: string | null
  updatedAt: string
  createdAt: string
}

export type InstructionsSectionPayload = {
  schemaVersion: number
  items: InstructionItem[]
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export function normalizeInstructionsPayload(value: unknown): InstructionsSectionPayload {
  const base: InstructionsSectionPayload = { schemaVersion: 1, items: [] }
  if (!value || typeof value !== 'object') return base
  const maybeItems = (value as { items?: unknown }).items
  if (!Array.isArray(maybeItems)) return base

  return {
    schemaVersion: 1,
    items: maybeItems
      .map((item): InstructionItem | null => {
        if (!item || typeof item !== 'object') return null
        const record = item as Record<string, unknown>
        const instructionType: InstructionType =
          record.instructionType === 'step_by_step' ? 'step_by_step' : 'written_note'
        const rawSteps = Array.isArray(record.steps) ? record.steps : []
        const steps = rawSteps
          .map((step): InstructionStep | null => {
            if (!step || typeof step !== 'object') return null
            const s = step as Record<string, unknown>
            const title = asString(s.title).trim()
            const text = asString(s.text).trim()
            if (!title && !text) return null
            return {
              id: asString(s.id) || crypto.randomUUID(),
              title,
              text: asString(s.text),
            }
          })
          .filter((step): step is InstructionStep => step != null)

        return {
          id: asString(record.id) || crypto.randomUUID(),
          title: asString(record.title),
          instructionType,
          noteBody: asString(record.noteBody),
          steps,
          linkedAssetIds: asStringArray(record.linkedAssetIds),
          attachedDocumentId: asString(record.attachedDocumentId) || null,
          linkedContactId: asString(record.linkedContactId) || null,
          updatedAt: asString(record.updatedAt) || new Date().toISOString(),
          createdAt: asString(record.createdAt) || new Date().toISOString(),
        }
      })
      .filter((item): item is InstructionItem => item != null),
  }
}

export function emptyInstructionsPayload(): InstructionsSectionPayload {
  return { schemaVersion: 1, items: [] }
}

export function instructionListPreviewSnippet(instruction: InstructionItem): string {
  const raw =
    instruction.instructionType === 'written_note'
      ? instruction.noteBody.trim()
      : instruction.steps
          .map((s) => [s.title.trim(), s.text.trim()].filter(Boolean).join(' ').trim())
          .filter(Boolean)
          .join(' ')
  return raw.replace(/\s+/g, ' ').trim()
}

export function instructionLinkedAttachmentCount(instruction: InstructionItem): number {
  let n = 0
  if (instruction.attachedDocumentId) n += 1
  if (instruction.linkedAssetIds.length > 0) n += 1
  if (instruction.linkedContactId) n += 1
  return n
}

/** Title, else first line of body — for collapsed step rows (caller supplies “untitled” when empty). */
export function instructionStepCollapsedSummary(step: InstructionStep): string {
  const title = step.title.trim()
  if (title) return title
  return step.text.trim().split('\n')[0]?.trim() ?? ''
}
