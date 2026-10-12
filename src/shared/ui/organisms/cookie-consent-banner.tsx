import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../atoms/Button'

const COOKIE_CONSENT_STORAGE_KEY = 'endplan-cookie-consent'
type CookieConsentChoice = 'accepted' | 'ignored'

function readCookieConsent(): CookieConsentChoice | null {
  if (typeof window === 'undefined') return null

  const value = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
  if (value === 'accepted' || value === 'ignored') {
    return value
  }

  return null
}

export function CookieConsentBanner() {
  const { t } = useTranslation()
  const [choice, setChoice] = useState<CookieConsentChoice | null>(() => readCookieConsent())

  const saveChoice = (nextChoice: CookieConsentChoice) => {
    setChoice(nextChoice)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, nextChoice)
    }
  }

  if (choice) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-14 z-[60] flex justify-center px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-auto w-full max-w-4xl rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-ep-border-card dark:bg-ep-surface-subtle">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="typo-body-sm text-ep-body dark:text-white/90">{t('cookies.message')}</p>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => saveChoice('ignored')}>
              {t('cookies.ignore')}
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={() => saveChoice('accepted')}>
              {t('cookies.accept')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
