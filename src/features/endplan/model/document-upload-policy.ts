export const ALLOWED_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.csv',
  '.xls',
  '.xlsx',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.txt',
  '.rtf',
  '.odt',
  '.ods',
  '.odp',
] as const

const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
] as const

const MIME_SET = new Set<string>(ALLOWED_DOCUMENT_MIME_TYPES)
const EXTENSION_SET = new Set<string>(ALLOWED_DOCUMENT_EXTENSIONS)

const MIME_BY_EXTENSION: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.csv': 'text/csv',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.rtf': 'application/rtf',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
}

function normalizeMimeType(mimeType: string | null | undefined): string {
  return (mimeType ?? '')
    .toLowerCase()
    .split(';')[0]
    .trim()
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex < 0) return ''
  return fileName.slice(dotIndex).toLowerCase()
}

export function resolveAllowedDocumentMimeType(file: Pick<File, 'name' | 'type'>): string | null {
  const normalizedMime = normalizeMimeType(file.type)
  if (MIME_SET.has(normalizedMime)) {
    return normalizedMime
  }

  const extension = getExtension(file.name)
  if (extension && EXTENSION_SET.has(extension)) {
    return MIME_BY_EXTENSION[extension] ?? null
  }

  return null
}

export function isAllowedDocumentFile(file: Pick<File, 'name' | 'type'>): boolean {
  return resolveAllowedDocumentMimeType(file) !== null
}

export const DOCUMENT_FILE_INPUT_ACCEPT = Array.from(
  new Set<string>([...ALLOWED_DOCUMENT_EXTENSIONS, ...ALLOWED_DOCUMENT_MIME_TYPES]),
).join(',')

/** Uppercase extensions for upload guidance, e.g. "PDF, CSV, XLS". */
export function formatAllowedDocumentTypeLabels(): string {
  return ALLOWED_DOCUMENT_EXTENSIONS.map((ext) => ext.slice(1).toUpperCase()).join(', ')
}

