const roleLabels: Record<string, string> = {
  key_person: 'Key Person',
  recipient: 'Recipient',
  advisor: 'Advisor',
}

const roleDescriptions: Record<string, string> = {
  key_person: 'You have full access to this EndPlan as a Key Person.',
  recipient: 'You have access to specific sections of this EndPlan.',
  advisor: 'You have read-only access to this EndPlan as an Advisor.',
}

const defaultRoleDescription = 'You have been granted access to this EndPlan.'

export function getSharedVaultRoleLabel(role: string): string {
  return roleLabels[role] || role
}

export function getSharedVaultRoleDescription(role: string): string {
  return roleDescriptions[role] || defaultRoleDescription
}
