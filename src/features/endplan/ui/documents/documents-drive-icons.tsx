import { cn } from '@/shared/lib'
import docIcon from '@/assets/iconpack/Icon file/Doc.svg'
import fileIcon from '@/assets/iconpack/Icon file/File.svg'
import imageIcon from '@/assets/iconpack/Icon file/Image.svg'
import pdfIcon from '@/assets/iconpack/Icon file/PDF.svg'
import pptIcon from '@/assets/iconpack/Icon file/PPT.svg'
import xlsIcon from '@/assets/iconpack/Icon file/XLS.svg'

/** SVG icons aligned with Design Document Page UI (documents.css / App.tsx). */

export function DriveFolderIconGrid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={cn('size-16 shrink-0', className)} aria-hidden>
      <path
        d="M12 20h16l4 4h20c2 0 4 2 4 4v24c0 2-2 4-4 4H12c-2 0-4-2-4-4V24c0-2 2-4 4-4z"
        fill="#FDB022"
        stroke="#DA8B04"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function DriveFolderIconList({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path d="M3 5h5l1.5 1.5h7.5c.6 0 1 .4 1 1v8c0 .6-.4 1-1 1H3c-.6 0-1-.4-1-1V6c0-.6.4-1 1-1z" fill="#FDB022" />
    </svg>
  )
}

function fileExtension(fileName: string): string {
  const base = fileName.trim().split(/[/\\]/).pop() ?? fileName
  const dot = base.lastIndexOf('.')
  if (dot <= 0 || dot === base.length - 1) return ''
  return base.slice(dot + 1).toLowerCase()
}

function normalizeMimeType(mimeType: string | null | undefined): string {
  return (mimeType ?? '').toLowerCase().split(';')[0].trim()
}

/** Maps an uploaded file to the matching Icon file pack asset. */
function resolveDriveFileTypeIconSrc(
  fileName: string,
  mimeType?: string | null,
): string {
  const ext = fileExtension(fileName)
  const mime = normalizeMimeType(mimeType)

  if (ext === 'pdf' || mime === 'application/pdf') {
    return pdfIcon
  }

  if (
    ext === 'doc' ||
    ext === 'docx' ||
    ext === 'odt' ||
    ext === 'rtf' ||
    ext === 'txt' ||
    mime === 'application/msword' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/vnd.oasis.opendocument.text' ||
    mime === 'application/rtf' ||
    mime === 'text/plain'
  ) {
    return docIcon
  }

  if (
    ext === 'xls' ||
    ext === 'xlsx' ||
    ext === 'csv' ||
    ext === 'ods' ||
    mime === 'application/vnd.ms-excel' ||
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime === 'application/vnd.oasis.opendocument.spreadsheet' ||
    mime === 'text/csv' ||
    mime === 'application/csv'
  ) {
    return xlsIcon
  }

  if (
    ext === 'ppt' ||
    ext === 'pptx' ||
    ext === 'odp' ||
    mime === 'application/vnd.ms-powerpoint' ||
    mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mime === 'application/vnd.oasis.opendocument.presentation'
  ) {
    return pptIcon
  }

  if (
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'heic', 'tif', 'tiff'].includes(ext) ||
    mime.startsWith('image/')
  ) {
    return imageIcon
  }

  return fileIcon
}

type DriveFileTypeIconProps = {
  fileName: string
  mimeType?: string | null
  className?: string
}

export function DriveFileIconList({ fileName, mimeType, className }: DriveFileTypeIconProps) {
  return (
    <img
      src={resolveDriveFileTypeIconSrc(fileName, mimeType)}
      alt=""
      aria-hidden
      className={cn('size-5 shrink-0 object-contain', className)}
    />
  )
}

/** Grid: matches `.card-preview` (64×64) in Design Document Page UI. */
export function DriveFileCardPreview({ fileName, mimeType }: DriveFileTypeIconProps) {
  return (
    <div className="mb-3 flex h-16 w-16 shrink-0 items-center justify-center">
      <img
        src={resolveDriveFileTypeIconSrc(fileName, mimeType)}
        alt=""
        aria-hidden
        className="size-16 object-contain"
      />
    </div>
  )
}
