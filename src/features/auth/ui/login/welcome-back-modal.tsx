import { useTranslation } from 'react-i18next'
import { Button, ModalOverlay, PageTitle } from '@/shared/ui'

type WelcomeBackModalProps = {
  isOpen: boolean
  onClose: () => void
  activityDays?: number
}

export function WelcomeBackModal({ isOpen, onClose, activityDays = 90 }: WelcomeBackModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <ModalOverlay onBackdropClick={onClose}>
      <div className="relative bg-ep-surface rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center animate-fade-in-up border border-ep-border-card">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
          <svg 
            className="w-10 h-10 text-green-500 dark:text-green-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={3}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>

        {/* Title */}
        <PageTitle as="h2" align="center" className="mb-4">
          {t('auth.welcomeBack.title')}
        </PageTitle>

        {/* Message */}
        <p className="text-slate-600 dark:text-slate-400 mb-2">
          {t('auth.welcomeBack.message')}
        </p>
        <p className="typo-heading-section text-slate-900 dark:text-slate-100 mb-2">
          {t('auth.welcomeBack.days', { days: activityDays })}
        </p>
        <p className="typo-body-sm text-slate-500 dark:text-slate-400 mb-8">
          {t('auth.welcomeBack.settingsNote')}
        </p>

        {/* Continue Button */}
        <Button 
          onClick={onClose}
          fullWidth
        >
          {t('auth.welcomeBack.continue')}
        </Button>
      </div>
    </ModalOverlay>
  )
}
