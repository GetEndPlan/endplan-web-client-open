const PHONE_ALLOWED_CHARS = /^[+]?[0-9\s().-]+$/
const MIN_PHONE_DIGITS = 8
const MAX_PHONE_DIGITS = 15

function digitCount(value: string): number {
  return value.replace(/\D/g, '').length
}

/** Empty is valid (optional). Otherwise require 8–15 digits and phone characters only. */
export function isValidOptionalPhoneNumber(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length === 0) return true
  if (!PHONE_ALLOWED_CHARS.test(trimmed)) return false
  if (trimmed.startsWith('+') && trimmed.length === 1) return false

  const digits = digitCount(trimmed)
  return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS
}
