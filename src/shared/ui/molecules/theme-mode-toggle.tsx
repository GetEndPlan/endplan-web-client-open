import { useTranslation } from 'react-i18next'
import { selectTheme, useThemeStore } from '../../lib'
import { EssentialIcon } from '../icons'

/** Figma topbar theme switcher — light: active Light pill + muted moon; dark: muted sun + active Dark pill. */
export function ThemeModeToggle() {
  const { t } = useTranslation()
  const theme = useThemeStore(selectTheme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-2.5 rounded-ep-pill bg-ep-surface-subtle py-0.5 pl-0.5 pr-4 dark:bg-ep-primary/10"
      aria-label={isDark ? t('theme.light') : t('theme.dark')}
    >
      {isDark ? (
        <span className="inline-flex items-center px-2 py-1.5" aria-hidden>
          <EssentialIcon name="light" size={16} tone="grey" />
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-ep-pill bg-ep-surface px-3 py-1.5 font-ep text-ep-caption text-ep-primary-accent">
          <EssentialIcon name="light" size={16} tone="purple" />
          <span>{t('theme.light')}</span>
        </span>
      )}

      {isDark ? (
        <span className="inline-flex items-center gap-1 rounded-ep-pill bg-ep-surface px-3 py-1.5 font-ep text-ep-caption text-ep-body">
          <EssentialIcon name="dark" size={16} tone="white" />
          <span>{t('theme.dark')}</span>
        </span>
      ) : (
        <span className="inline-flex items-center py-1.5 pr-0.5" aria-hidden>
          <EssentialIcon name="dark" size={16} tone="black" className="opacity-40" />
        </span>
      )}
    </button>
  )
}
