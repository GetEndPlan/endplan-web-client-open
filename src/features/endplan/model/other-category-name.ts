/** Next unique display name for the dedicated "Other …" custom category. */
export function nextOtherCategoryName(
  existingNames: readonly string[],
  baseName: string,
): string {
  const normalizedBase = baseName.trim()
  if (!normalizedBase) return 'Other'
  const taken = new Set(
    existingNames.map((name) => name.trim().toLowerCase()).filter(Boolean),
  )
  if (!taken.has(normalizedBase.toLowerCase())) return normalizedBase
  let suffix = 2
  while (taken.has(`${normalizedBase} ${suffix}`.toLowerCase())) {
    suffix += 1
  }
  return `${normalizedBase} ${suffix}`
}
