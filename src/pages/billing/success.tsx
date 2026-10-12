import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/constants/routes'
import { useSubscription } from '@/features/billing'
import { getLatestKeyPersonMembership } from '@/features/endplan'
import {
  KEY_PERSON_START_OWN_ENDPLAN_PROMPT_KEY,
  trustedCircleKeys,
  useMemberships,
  userPromptStateApi,
} from '@/features/trusted-circle/api'
import { Card, Button, PageHeader } from '@/shared/ui'

export function BillingSuccessPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { refetch: refetchSubscription } = useSubscription()
  const { data: memberships = [], isFetched: membershipsFetched } = useMemberships()
  const keyPersonPromptMarkedRef = useRef(false)

  useEffect(() => {
    void (async () => {
      const { data: sub } = await refetchSubscription()
      if (!membershipsFetched || keyPersonPromptMarkedRef.current) return
      if (!sub?.hasActiveSubscription) return
      if (!getLatestKeyPersonMembership(memberships)) return

      keyPersonPromptMarkedRef.current = true
      try {
        await userPromptStateApi.markStarted(KEY_PERSON_START_OWN_ENDPLAN_PROMPT_KEY)
        await queryClient.invalidateQueries({
          queryKey: trustedCircleKeys.promptState(KEY_PERSON_START_OWN_ENDPLAN_PROMPT_KEY),
        })
      } catch {
        keyPersonPromptMarkedRef.current = false
      }
    })()
  }, [memberships, membershipsFetched, queryClient, refetchSubscription])

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          <PageHeader
            align="center"
            tone="gray"
            title={t('billing.success.title')}
            description={t('billing.success.subtitle')}
          />

          <div className="mt-8 space-y-3">
            <Button className="w-full" onClick={() => navigate(ROUTES.DASHBOARD)}>
              {t('billing.success.primary')}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => navigate(ROUTES.SETTINGS_BILLING)}
            >
              {t('billing.success.secondary')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
