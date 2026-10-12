import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Card, Button } from '@/shared/ui'

type DashboardCreateStateProps = {
  onCreate: () => void
}

export function DashboardCreateState({ onCreate }: DashboardCreateStateProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <div className="text-center py-12 px-4">
        <div className="mx-auto w-16 h-16 bg-ep-primary-softer dark:bg-ep-primary-dark/50 rounded-full flex items-center justify-center mb-6">
          <Plus className="w-8 h-8 text-ep-primary dark:text-ep-primary-accent" />
        </div>
        <h3 className="typo-heading-section text-gray-900 dark:text-gray-100 mb-2">
          {t('dashboard.create.title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          {t('dashboard.create.description')}
        </p>
        <Button size="lg" onClick={onCreate}>
          {t('dashboard.create.button')}
        </Button>
        <p className="mt-4 typo-body-sm text-gray-500 dark:text-gray-400">
          {t('dashboard.create.encrypted')}
        </p>
      </div>
    </Card>
  )
}
