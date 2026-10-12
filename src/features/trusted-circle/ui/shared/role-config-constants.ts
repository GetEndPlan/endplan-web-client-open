import type { UserRole } from '../../api'

export type ExtendedUserRole = UserRole | 'trustee'

export const ROLE_LABELS: Record<ExtendedUserRole, string> = {
  key_person: 'Key Person',
  recipient: 'Recipient',
  advisor: 'Advisor',
  trustee: 'Trustee',
}

export const ROLE_DESCRIPTIONS: Record<ExtendedUserRole, string> = {
  key_person: 'Full access to your EndPlan when the time comes. They execute your wishes.',
  recipient: 'Receives full EndPlan access after release and key-person approval.',
  advisor: 'Time-limited read-only access to help you plan.',
  trustee: 'Verifies your liveness status. No content access.',
}

export type RoleHelpContent = {
  title: string
  description: string
  bullets: string[]
  note?: string
}

export const ROLE_HELP_DETAILS: Record<ExtendedUserRole, RoleHelpContent> = {
  key_person: {
    title: 'What does a Key Person do?',
    description: 'A Key Person is your main trusted executor when your EndPlan is released.',
    bullets: [
      'They receive broad access and are expected to carry out your instructions.',
      'They may coordinate with recipients and advisors during the release process.',
      'Pick someone reliable, available, and aligned with your wishes.',
    ],
    note: 'You can remove or replace this role anytime.',
  },
  recipient: {
    title: 'What does a Recipient do?',
    description: 'A Recipient receives EndPlan access after release and key-person approval.',
    bullets: [
      'Recipients get full visibility into EndPlan sections once access is released.',
      'Use this role for family members or beneficiaries who should receive your plan.',
      'Recipients do not have liveness-verification responsibilities.',
    ],
    note: 'A Key Person must exist before adding Recipients.',
  },
  advisor: {
    title: 'What does an Advisor do?',
    description: 'An Advisor has guidance-focused, limited access to help with planning.',
    bullets: [
      'Best for legal, financial, or professional guidance.',
      'Use time-limited access where appropriate.',
      'Advisors are not intended to replace your Key Person.',
    ],
  },
  trustee: {
    title: 'What does a Trustee do?',
    description: 'A Trustee helps verify liveness and process readiness, not content access.',
    bullets: [
      'Trustees help with workflow integrity and verification steps.',
      'They do not need direct access to your EndPlan content.',
      'Choose a neutral and dependable person for this role.',
    ],
  },
}

export const ROLE_COLORS: Record<ExtendedUserRole, string> = {
  key_person: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  recipient: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  advisor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  trustee: 'bg-ep-primary-softer dark:bg-ep-primary-dark/30 text-ep-primary dark:text-ep-primary-accent border-ep-primary-soft dark:border-ep-primary-dark',
}

import { SECTION_ID, type SectionType } from '@/features/endplan/model/vault-section-types'

/** Default section access options when product entitlements do not specify a list */
export const VAULT_SECTION_TYPES: SectionType[] = [
  SECTION_ID.ASSETS,
  SECTION_ID.DOCUMENTS,
  SECTION_ID.INSTRUCTIONS,
  SECTION_ID.CONTACTS,
  SECTION_ID.POLICIES,
]
