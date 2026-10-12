import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/constants/routes'
import { Card, Button, PageHeader } from '@/shared/ui'

export function BillingCancelPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <PageHeader
            align="center"
            tone="gray"
            title={t('billing.cancelPage.title')}
            description={t('billing.cancelPage.subtitle')}
          />

          <div className="mt-8 space-y-3">
            <Button className="w-full" onClick={() => navigate(ROUTES.SETTINGS_BILLING)}>
              {t('billing.cancelPage.primary')}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => navigate(ROUTES.DASHBOARD)}
            >
              {t('billing.cancelPage.secondary')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
