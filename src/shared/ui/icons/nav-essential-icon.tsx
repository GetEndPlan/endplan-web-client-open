import { EssentialIcon } from './essential-icon'
import type { EssentialIconName, EssentialIconTone } from './essential-icon-sources'
import { selectTheme, useThemeStore } from '@/shared/lib'

type NavEssentialIconProps = {
  name: EssentialIconName
  active?: boolean
}

export function NavEssentialIcon({ name, active = false }: NavEssentialIconProps) {
  const theme = useThemeStore(selectTheme)
  const tone: EssentialIconTone = active ? 'purple' : theme === 'dark' ? 'white' : 'black'

  return <EssentialIcon name={name} size={20} tone={tone} />
}
