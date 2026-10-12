import type { ContactItem } from '../../model/contacts'
import type { InstructionItem, InstructionsSectionPayload } from '../../model/instructions'
import type { AssetSectionPayloadV2 } from '../../model/asset-table-model'

export type InstructionsTxtCopy = {
  untitledInstruction: string
  untitledAsset: string
  untitledContact: string
  untitledDocument: string
  writtenNoteType: string
  stepByStepType: string
  relatedHeading: string
  relatedContact: string
  relatedDocument: string
  relatedAssets: string
}

function assetRowLabel(payload: AssetSectionPayloadV2, assetId: string, fallback: string): string {
  for (const category of payload.categories) {
    const row = category.rows.find((item) => item.id === assetId)
    if (!row) continue
    const fromFields = row.values.asset_name?.trim() || row.values.name?.trim()
    if (fromFields) return fromFields
    return fallback
  }
  return fallback
}

function formatInstruction(args: {
  instruction: InstructionItem
  index: number
  copy: InstructionsTxtCopy
  contactsById: Record<string, Pick<ContactItem, 'fullName'>>
  documentNamesById: Record<string, string>
  assetsPayload: AssetSectionPayloadV2
}): string {
  const title = args.instruction.title.trim() || args.copy.untitledInstruction
  const typeLabel =
    args.instruction.instructionType === 'step_by_step' ? args.copy.stepByStepType : args.copy.writtenNoteType
  const lines = [`${args.index}. ${title}`, typeLabel, '']

  if (args.instruction.instructionType === 'step_by_step') {
    args.instruction.steps.forEach((step, stepIndex) => {
      const stepTitle = step.title.trim()
      const stepText = step.text.trim()
      lines.push(`${stepIndex + 1}. ${stepTitle || stepText}`)
      if (stepTitle && stepText) {
        lines.push(`   ${stepText}`)
      }
      lines.push('')
    })
  } else if (args.instruction.noteBody.trim()) {
    lines.push(args.instruction.noteBody.trim(), '')
  }

  const related: string[] = []
  if (args.instruction.linkedContactId) {
    const contactName =
      args.contactsById[args.instruction.linkedContactId]?.fullName.trim() || args.copy.untitledContact
    related.push(`${args.copy.relatedContact}: ${contactName}`)
  }
  if (args.instruction.attachedDocumentId) {
    const documentName =
      args.documentNamesById[args.instruction.attachedDocumentId] || args.copy.untitledDocument
    related.push(`${args.copy.relatedDocument}: ${documentName}`)
  }
  if (args.instruction.linkedAssetIds.length > 0) {
    const labels = args.instruction.linkedAssetIds.map((assetId) =>
      assetRowLabel(args.assetsPayload, assetId, args.copy.untitledAsset),
    )
    related.push(`${args.copy.relatedAssets}: ${labels.join(', ')}`)
  }
  if (related.length > 0) {
    lines.push(args.copy.relatedHeading)
    for (const line of related) {
      lines.push(`- ${line}`)
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}

export function buildInstructionsTxt(args: {
  payload: InstructionsSectionPayload
  copy: InstructionsTxtCopy
  contactsById: Record<string, Pick<ContactItem, 'fullName'>>
  documentNamesById: Record<string, string>
  assetsPayload: AssetSectionPayloadV2
}): string {
  if (args.payload.items.length === 0) {
    return ''
  }

  return args.payload.items
    .map((instruction, index) =>
      formatInstruction({
        instruction,
        index: index + 1,
        copy: args.copy,
        contactsById: args.contactsById,
        documentNamesById: args.documentNamesById,
        assetsPayload: args.assetsPayload,
      }),
    )
    .join('\n\n---\n\n')
    .concat('\n')
}
