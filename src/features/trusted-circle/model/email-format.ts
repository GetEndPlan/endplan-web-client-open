/** Local-part @ domain with a dot — stronger than checking for `@` only. */
const INVITE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidInviteEmail(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length > 0 && INVITE_EMAIL_PATTERN.test(trimmed)
}

export function inviteEmailFieldError(
  value: string,
  messages: { required: string; invalid: string },
  emptyIsRequired: boolean,
): string | null {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return emptyIsRequired ? messages.required : null
  }
  if (!isValidInviteEmail(value)) {
    return messages.invalid
  }
  return null
}

