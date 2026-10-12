const WINDOWS_RESERVED = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
])

const MAX_SEGMENT_LENGTH = 120

function splitNameAndExtension(name: string): { stem: string; extension: string } {
  const dotIndex = name.lastIndexOf('.')
  if (dotIndex <= 0 || dotIndex === name.length - 1) {
    return { stem: name, extension: '' }
  }
  return { stem: name.slice(0, dotIndex), extension: name.slice(dotIndex) }
}

function replaceUnsafeZipChars(raw: string): string {
  let sanitized = ''
  for (const char of raw.normalize('NFC')) {
    const code = char.codePointAt(0) ?? 0
    if (code < 32 || '<>:"/\\|?*'.includes(char)) {
      sanitized += ' '
      continue
    }
    sanitized += char
  }
  return sanitized
}

export function sanitizeZipSegment(raw: string, fallback: string): string {
  let name = replaceUnsafeZipChars(raw)
  name = name.replace(/\s+/g, ' ').trim()
  name = name.replace(/[. ]+$/g, '').trim()
  if (!name || /^\.+$/.test(name)) {
    name = fallback
  }

  const { stem } = splitNameAndExtension(name)
  if (WINDOWS_RESERVED.has(stem.toUpperCase())) {
    name = `_${name}`
  }

  if (name.length > MAX_SEGMENT_LENGTH) {
    const split = splitNameAndExtension(name)
    const maxStem = Math.max(24, MAX_SEGMENT_LENGTH - split.extension.length)
    name = `${split.stem.slice(0, maxStem)}${split.extension}`
  }

  return name || fallback
}

export function joinZipPath(parts: readonly string[]): string {
  return parts.filter((part) => part.length > 0).join('/')
}

export function uniqueZipPath(desired: string, used: Set<string>): string {
  const isDirectory = desired.endsWith('/')
  const normalized = isDirectory ? desired.replace(/\/+$/, '') : desired
  const candidate = isDirectory ? `${normalized}/` : normalized
  if (!used.has(candidate)) {
    used.add(candidate)
    return candidate
  }

  const lastSlash = normalized.lastIndexOf('/')
  const directory = lastSlash >= 0 ? normalized.slice(0, lastSlash + 1) : ''
  const baseName = lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized
  const { stem, extension } = splitNameAndExtension(baseName)

  let index = 2
  while (true) {
    const nextName = `${directory}${stem} (${index})${extension}`
    const nextPath = isDirectory ? `${nextName}/` : nextName
    if (!used.has(nextPath)) {
      used.add(nextPath)
      return nextPath
    }
    index += 1
  }
}
