/**
 * Application route paths.
 */
export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  INVITE: '/invite/:token',
  DASHBOARD: '/dashboard',
  CREATE_ENDPLAN: '/create-endplan',
  EDIT_ENDPLAN: '/edit-endplan',
  TRUSTED_CIRCLE: '/trusted-circle',
  SHARED_WITH_ME: '/shared-with-me',
  SHARED_ENDPLAN: '/shared-endplan/:id',
  SHARED_ENDPLAN_SECTION: '/shared-endplan/:id/:sectionType',
  SETTINGS: '/settings',
  SETTINGS_DATA_PRIVACY: '/settings/data-privacy',
  SETTINGS_BILLING: '/settings/billing',
  SETTINGS_BILLING_UPGRADE: '/settings/billing/upgrade',
  CONFIGURE_TRANSFER_PROCESS: '/configure-transfer-process',
  BILLING: '/billing',
  BILLING_SUCCESS: '/billing/success',
  BILLING_CANCEL: '/billing/cancel',
  ENDPLAN_SECTION: '/endplan/:sectionType',
  ENDPLAN_SECTION_ITEM: '/endplan/:sectionType/:instructionId',
  ENDPLAN_SECTION_ITEM_EDIT: '/endplan/:sectionType/:instructionId/edit',
} as const

export function endplanSectionPath(sectionType: string): string {
  return `/endplan/${sectionType}`
}

/** URL segment for “create instruction” flow (not a persisted instruction id). */
export const INSTRUCTION_NEW_ID = 'new' as const

export function endplanInstructionNewPath(): string {
  return `/endplan/instructions/${INSTRUCTION_NEW_ID}`
}

export function endplanInstructionNewEditPath(): string {
  return `/endplan/instructions/${INSTRUCTION_NEW_ID}/edit`
}

export function endplanInstructionPreviewPath(instructionId: string): string {
  return `/endplan/instructions/${instructionId}`
}

export function endplanInstructionEditPath(instructionId: string): string {
  return `/endplan/instructions/${instructionId}/edit`
}

export function invitePath(token: string): string {
  return `/invite/${token}`
}

export function sharedEndplanPath(id: string): string {
  return `/shared-endplan/${id}`
}

export function sharedEndplanSectionPath(id: string, sectionType: string): string {
  return `/shared-endplan/${id}/${sectionType}`
}
