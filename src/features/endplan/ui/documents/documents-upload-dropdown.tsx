import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'

type DocumentsUploadDropdownProps = {
  disabled: boolean
  isUploading: boolean
  onUploadFiles: () => void
  className?: string
}

/**
 * Upload control matching Design Document Page UI: `.upload-dropdown-container` +
 * `.upload-dropdown { right: 0 }` so the panel aligns to the trigger’s right edge.
 * Single action: upload files (no folder upload).
 */
export function DocumentsUploadDropdown({
  disabled,
  isUploading,
  onUploadFiles,
  className,
}: DocumentsUploadDropdownProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (event: globalThis.MouseEvent) => {
      const el = containerRef.current
      if (el && !el.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  return (
    <div
      ref={containerRef}
      className={cn('relative shrink-0', className)}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((current) => !current)
        }}
        className="typo-body-sm-strong inline-flex items-center gap-1.5 rounded-[7px] bg-ep-primary px-4 py-2.5 text-white transition hover:bg-ep-primary-accent disabled:cursor-not-allowed disabled:opacity-50 dark:bg-ep-primary dark:hover:bg-ep-primary"
      >
        <Upload className="h-[18px] w-[18px] shrink-0" aria-hidden />
        {isUploading ? t('vault.documentsManager.uploading') : t('vault.documentsManager.driveUpload')}
        <ChevronDown className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+4px)] z-[1000] min-w-[180px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-ep-border-card dark:bg-ep-surface-subtle"
          role="menu"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            className="typo-body-sm-strong flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-ep-primary-dark/50"
            onClick={() => {
              setOpen(false)
              onUploadFiles()
            }}
          >
            <Upload className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
            {t('vault.documentsManager.driveUploadFiles')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
