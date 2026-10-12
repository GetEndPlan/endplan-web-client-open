import { cn } from '@/shared/lib/cn'
import {
  resolveEssentialIconSrc,
  type EssentialIconName,
  type EssentialIconSize,
  type EssentialIconTone,
} from './essential-icon-sources'

const SIZE_CLASS: Record<EssentialIconSize, string> = {
  16: 'size-4',
  20: 'size-5',
  24: 'size-6',
}

export type EssentialIconProps = {
  name: EssentialIconName
  size?: EssentialIconSize
  tone?: EssentialIconTone
  className?: string
}

export function EssentialIcon({ name, size = 20, tone = 'black', className }: EssentialIconProps) {
  const src = resolveEssentialIconSrc(name, size, tone)
  if (!src) return null

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className={cn('shrink-0 object-contain', SIZE_CLASS[size], className)}
    />
  )
}
