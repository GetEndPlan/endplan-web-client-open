import { useMemo } from 'react'
import { resolveActiveAppVariant } from '../config/app-variant-runtime'
import { type AppVariantConfig } from '../config/app-variant'

export function useAppVariant(): AppVariantConfig {
  return useMemo(() => resolveActiveAppVariant(), [])
}
