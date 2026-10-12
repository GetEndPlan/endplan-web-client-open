import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/shared/ui'

type SharedWithMeHeaderProps = {
  showSubtitle?: boolean
}

export function SharedWithMeHeader({ showSubtitle = true }: SharedWithMeHeaderProps) {
  const { t } = useTranslation()

  return (
    <PageHeader
      title={t('dashboard.sharedWithMe.title')}
      description={showSubtitle ? t('dashboard.sharedWithMe.pageSubtitle') : undefined}
    />
  )
}
