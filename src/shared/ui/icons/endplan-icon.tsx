import { cn } from '@/shared/lib/cn'
import {
  resolveEndPlanIconSrc,
  type EndPlanIconName,
  type EndPlanIconSize,
  type EndPlanIconTone,
} from './endplan-icon-sources'

const SIZE_CLASS: Record<EndPlanIconSize, string> = {
  24: 'size-6',
  32: 'size-8',
}

export type EndPlanIconProps = {
  name: EndPlanIconName
  size?: EndPlanIconSize
  tone?: EndPlanIconTone
  className?: string
}

export function EndPlanIcon({ name, size = 24, tone = 'purple', className }: EndPlanIconProps) {
  return (
    <img
      src={resolveEndPlanIconSrc(name, size, tone)}
      alt=""
      aria-hidden
      className={cn('shrink-0 object-contain', SIZE_CLASS[size], className)}
    />
  )
}
