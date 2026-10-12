import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supportedLanguages, type SupportedLanguage } from '../../lib/i18n'

type LanguageSwitcherProps = {
  compact?: boolean
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = supportedLanguages.find(
    (lang) => lang.code === i18n.language
  ) || supportedLanguages[0]

  const handleLanguageChange = (langCode: SupportedLanguage) => {
    i18n.changeLanguage(langCode)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center rounded-lg border border-slate-200 bg-white typo-body-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-ep-surface-panel dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100 ${compact ? 'h-8 gap-1.5 px-2.5' : 'h-9 gap-1.5 px-3'}`}
        aria-label={t('language.select')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="typo-symbol leading-none">{currentLang.flag}</span>
        {compact ? (
          <span className="max-w-20 truncate typo-caption-strong">{currentLang.name}</span>
        ) : (
          <span className="hidden sm:inline">{currentLang.code.toUpperCase()}</span>
        )}
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-1 w-40 isolate overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-ep-border dark:bg-ep-surface-subtle"
          role="listbox"
          aria-label={t('language.select')}
        >
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 typo-body-sm text-left transition-colors ${lang.code === i18n.language
                  ? 'bg-ep-primary-softer text-ep-primary-accent dark:bg-ep-primary dark:text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-ep-surface-subtle dark:text-slate-300 dark:hover:bg-ep-surface-highlight'
                }`}
              role="option"
              aria-selected={lang.code === i18n.language}
            >
              <span className="typo-symbol leading-none">{lang.flag}</span>
              <span>{lang.name}</span>
              {lang.code === i18n.language && (
                <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
