import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/shared/lib/cn'

type AssetWrappingTextCellProps = {
  value: string
  className?: string
  autoFocus?: boolean
  placeholder?: string
  onChange: (value: string) => void
}

function autosizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

/** Single-line-looking cell that wraps long content and grows with the value. */
export function AssetWrappingTextCell({
  value,
  className,
  autoFocus,
  placeholder,
  onChange,
}: AssetWrappingTextCellProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    autosizeTextarea(textareaRef.current)
  }, [value])

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      value={value}
      autoFocus={autoFocus}
      placeholder={placeholder}
      onInput={(event) => autosizeTextarea(event.currentTarget)}
      onChange={(event) => {
        onChange(event.currentTarget.value)
        autosizeTextarea(event.currentTarget)
      }}
      className={cn('break-words whitespace-pre-wrap', className)}
    />
  )
}
