import type { EndPlanIconName } from '@/shared/ui'

/**
 * Written-note instruction templates shown above the instructions list.
 * Placeholders in square brackets are meant for the user to replace.
 */
export type InstructionTemplateId =
  | 'funeral_wishes'
  | 'executor'
  | 'power_of_attorney'
  | 'incapacitation'
  | 'pay_and_cancel'
  | 'crypto_access'

export type InstructionTemplate = {
  id: InstructionTemplateId
  icon: EndPlanIconName
}

export const INSTRUCTION_TEMPLATES: readonly InstructionTemplate[] = [
  { id: 'funeral_wishes', icon: 'funeral-wishes' },
  { id: 'executor', icon: 'executor' },
  { id: 'power_of_attorney', icon: 'power-of-attorney' },
  { id: 'incapacitation', icon: 'incapacitation' },
  { id: 'pay_and_cancel', icon: 'pay-and-cancel' },
  { id: 'crypto_access', icon: 'crypto-access' },
] as const

export type InstructionTemplateDraft = {
  title: string
  noteBody: string
}
