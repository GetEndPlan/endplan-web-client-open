import {
  iconGradient,
  logoDarkDesktop,
  logoDarkMobile,
  logoLightDesktop,
  logoLightMobile,
} from '@/assets/logos'
import { cn } from '@/shared/lib/cn'

type EndPlanLogoProps = {
  variant?: 'full' | 'icon'
  className?: string
  alt?: string
}

const WORDMARK_CLASS = 'h-7 w-auto object-contain'
const ICON_CLASS = 'h-7 w-7 object-contain'

export function EndPlanLogo({ variant = 'full', className, alt = 'EndPlan' }: EndPlanLogoProps) {
  if (variant === 'icon') {
    return <img src={iconGradient} alt={alt} className={cn(ICON_CLASS, className)} />
  }

  return (
    <>
      <img src={logoLightMobile} alt={alt} className={cn(WORDMARK_CLASS, 'max-lg:block lg:hidden dark:hidden', className)} />
      <img src={logoLightDesktop} alt={alt} className={cn(WORDMARK_CLASS, 'hidden lg:block dark:hidden', className)} />
      <img src={logoDarkMobile} alt={alt} className={cn(WORDMARK_CLASS, 'hidden max-lg:dark:block', className)} />
      <img src={logoDarkDesktop} alt={alt} className={cn(WORDMARK_CLASS, 'hidden dark:lg:block', className)} />
    </>
  )
}
