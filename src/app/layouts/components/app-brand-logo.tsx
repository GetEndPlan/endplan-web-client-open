import {
  sysLogoIconDark,
  sysLogoIconLight,
  sysLogoTaglineDark,
  sysLogoTaglineLight,
  sysLogoWordmarkDark,
  sysLogoWordmarkLight,
} from '@/assets/logos'
import { useAppVariant } from '@/app/hooks/use-app-variant'
import { EndPlanLogo } from '@/shared/ui'
import { cn } from '@/shared/lib/cn'
import { useTranslation } from 'react-i18next'

type AppBrandLogoProps = {
  /** `lockup` renders the taller sys logo that includes the wordmark and tagline. */
  variant?: 'full' | 'icon' | 'lockup'
  className?: string
}

const SYS_WORDMARK_CLASS = 'h-10 w-auto max-w-[14rem] object-contain object-left'
const SYS_ICON_CLASS = 'h-10 w-10 object-contain'
const SYS_LOCKUP_CLASS = 'h-44 max-h-[22vh] w-auto object-contain'
const DEFAULT_LOCKUP_CLASS = 'h-10 w-auto max-w-[14rem] object-contain object-left'

export function AppBrandLogo({ variant = 'full', className }: AppBrandLogoProps) {
  const { t } = useTranslation()
  const appVariant = useAppVariant()

  if (appVariant.id === 'default') {
    return (
      <EndPlanLogo
        variant={variant === 'icon' ? 'icon' : 'full'}
        alt={t('common.appName')}
        className={cn(variant === 'lockup' && DEFAULT_LOCKUP_CLASS, className)}
      />
    )
  }

  const logoAlt = t('shell.sysDemo.logoAlt')

  if (variant === 'icon') {
    return (
      <>
        <img
          src={sysLogoIconLight}
          alt={logoAlt}
          className={cn(SYS_ICON_CLASS, 'dark:hidden', className)}
        />
        <img
          src={sysLogoIconDark}
          alt={logoAlt}
          className={cn(SYS_ICON_CLASS, 'hidden dark:block', className)}
        />
      </>
    )
  }

  if (variant === 'lockup') {
    return (
      <>
        <img
          src={sysLogoTaglineLight}
          alt={logoAlt}
          className={cn(SYS_LOCKUP_CLASS, 'dark:hidden', className)}
        />
        <img
          src={sysLogoTaglineDark}
          alt={logoAlt}
          className={cn(SYS_LOCKUP_CLASS, 'hidden dark:block', className)}
        />
      </>
    )
  }

  return (
    <>
      <img
        src={sysLogoWordmarkLight}
        alt={logoAlt}
        className={cn(SYS_WORDMARK_CLASS, 'dark:hidden', className)}
      />
      <img
        src={sysLogoWordmarkDark}
        alt={logoAlt}
        className={cn(SYS_WORDMARK_CLASS, 'hidden dark:block', className)}
      />
    </>
  )
}
