import dashboard16Black from '@/assets/iconpack/Essential/Black/16/Dashboard.svg'
import myEndPlan16Black from '@/assets/iconpack/Essential/Black/16/My EndPlan.svg'
import notification16Black from '@/assets/iconpack/Essential/Black/16/Notification.svg'
import settings16Black from '@/assets/iconpack/Essential/Black/16/Settings.svg'
import shareWithYou16Black from '@/assets/iconpack/Essential/Black/16/Share with you.svg'
import transferProcess16Black from '@/assets/iconpack/Essential/Black/16/Transfer Process.svg'
import trustCircle16Black from '@/assets/iconpack/Essential/Black/16/Trust Circle.svg'
import dark16Black from '@/assets/iconpack/Essential/Black/16/Dark.svg'
import light16Black from '@/assets/iconpack/Essential/Black/16/Light.svg'
import dark16Grey from '@/assets/iconpack/Essential/Grey/16/Dark.svg'
import light16Grey from '@/assets/iconpack/Essential/Grey/16/Light.svg'

import dashboard20Black from '@/assets/iconpack/Essential/Black/20/Dashboard.svg'
import myEndPlan20Black from '@/assets/iconpack/Essential/Black/20/My EndPlan.svg'
import settings20Black from '@/assets/iconpack/Essential/Black/20/Settings.svg'
import shareWithYou20Black from '@/assets/iconpack/Essential/Black/20/Share with you.svg'
import transferProcess20Black from '@/assets/iconpack/Essential/Black/20/Transfer Process.svg'
import trustCircle20Black from '@/assets/iconpack/Essential/Black/20/Trust Circle.svg'

import dashboard20Purple from '@/assets/iconpack/Essential/Purple/20/Dashboard.svg'
import myEndPlan20Purple from '@/assets/iconpack/Essential/Purple/20/My EndPlan.svg'
import settings20Purple from '@/assets/iconpack/Essential/Purple/20/Settings.svg'
import shareWithYou20Purple from '@/assets/iconpack/Essential/Purple/20/Share with you.svg'
import transferProcess20Purple from '@/assets/iconpack/Essential/Purple/20/Transfer Process.svg'
import trustCircle20Purple from '@/assets/iconpack/Essential/Purple/20/Trust Circle.svg'
import light16Purple from '@/assets/iconpack/Essential/Purple/16/Light.svg'

import shareWithYou24White from '@/assets/iconpack/Essential/White/24/Share with you.svg'
import shareWithYou24Purple from '@/assets/iconpack/Essential/Purple/24/Share with you.svg'

import dashboard20White from '@/assets/iconpack/Essential/White/20/Dashboard.svg'
import myEndPlan20White from '@/assets/iconpack/Essential/White/20/My EndPlan.svg'
import notification20White from '@/assets/iconpack/Essential/White/20/Notification.svg'
import settings20White from '@/assets/iconpack/Essential/White/20/Settings.svg'
import shareWithYou20White from '@/assets/iconpack/Essential/White/20/Share with you.svg'
import transferProcess20White from '@/assets/iconpack/Essential/White/20/Transfer Process.svg'
import trustCircle20White from '@/assets/iconpack/Essential/White/20/Trust Circle.svg'
import dark16White from '@/assets/iconpack/Essential/White/16/Dark.svg'
import light16White from '@/assets/iconpack/Essential/White/16/Light.svg'

export type EssentialIconName =
  | 'dashboard'
  | 'trust-circle'
  | 'transfer-process'
  | 'my-endplan'
  | 'share-with-you'
  | 'settings'
  | 'notification'
  | 'light'
  | 'dark'

export type EssentialIconSize = 16 | 20 | 24
export type EssentialIconTone = 'black' | 'purple' | 'white' | 'grey'

type IconKey = `${EssentialIconName}-${EssentialIconSize}-${EssentialIconTone}`

export const ESSENTIAL_ICON_SOURCES: Partial<Record<IconKey, string>> = {
  'dashboard-16-black': dashboard16Black,
  'dashboard-20-black': dashboard20Black,
  'dashboard-20-purple': dashboard20Purple,
  'dashboard-20-white': dashboard20White,
  'trust-circle-16-black': trustCircle16Black,
  'trust-circle-20-black': trustCircle20Black,
  'trust-circle-20-purple': trustCircle20Purple,
  'trust-circle-20-white': trustCircle20White,
  'transfer-process-16-black': transferProcess16Black,
  'transfer-process-20-black': transferProcess20Black,
  'transfer-process-20-purple': transferProcess20Purple,
  'transfer-process-20-white': transferProcess20White,
  'my-endplan-16-black': myEndPlan16Black,
  'my-endplan-20-black': myEndPlan20Black,
  'my-endplan-20-purple': myEndPlan20Purple,
  'my-endplan-20-white': myEndPlan20White,
  'share-with-you-16-black': shareWithYou16Black,
  'share-with-you-20-black': shareWithYou20Black,
  'share-with-you-20-purple': shareWithYou20Purple,
  'share-with-you-20-white': shareWithYou20White,
  'share-with-you-24-white': shareWithYou24White,
  'share-with-you-24-purple': shareWithYou24Purple,
  'settings-16-black': settings16Black,
  'settings-20-black': settings20Black,
  'settings-20-purple': settings20Purple,
  'settings-20-white': settings20White,
  'notification-16-black': notification16Black,
  'notification-20-white': notification20White,
  'light-16-black': light16Black,
  'light-16-purple': light16Purple,
  'light-16-white': light16White,
  'light-16-grey': light16Grey,
  'dark-16-black': dark16Black,
  'dark-16-white': dark16White,
  'dark-16-grey': dark16Grey,
}

export function resolveEssentialIconSrc(
  name: EssentialIconName,
  size: EssentialIconSize,
  tone: EssentialIconTone,
): string | undefined {
  const key = `${name}-${size}-${tone}` as IconKey
  return ESSENTIAL_ICON_SOURCES[key]
}
