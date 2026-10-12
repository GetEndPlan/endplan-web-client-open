import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/shared/api'
import { toast } from '@/shared/ui'
import { RECOMMENDED_PERIOD } from '../api/liveness-api'
import { useLiveness, useUpdateLiveness } from '../api/hooks/user-hooks'

type UseLivenessSettingsOptions = {
  readOnly?: boolean
}

export function useLivenessSettings(options: UseLivenessSettingsOptions = {}) {
  const { readOnly = false } = options
  const { t } = useTranslation()
  const { data: liveness, isLoading } = useLiveness()
  const updateLiveness = useUpdateLiveness()

  const [userSelectedDays, setUserSelectedDays] = useState<number | null>(null)

  const configuredDays = liveness?.inactivityPeriodDays ?? null
  const selectedDays = userSelectedDays ?? configuredDays ?? RECOMMENDED_PERIOD

  const handleQuickSelect = (days: number) => {
    setUserSelectedDays(days)
  }

  const handleCompleteSetup = async (): Promise<boolean> => {
    if (readOnly) {
      return false
    }
    if (selectedDays == null) {
      toast.error(t('liveness.selectRequired'))
      return false
    }
    try {
      await updateLiveness.mutateAsync({
        inactivityPeriodDays: selectedDays,
        reminderIntervalMinutes: null,
      })
      setUserSelectedDays(null)
      toast.success(t('liveness.saveSuccess'))
      return true
    } catch (err) {
      if (err instanceof ApiError && err.isSubscriptionRequired) {
        toast.error(t('liveness.transferPage.readOnly.cannotSave'))
      } else {
        toast.error(t('liveness.saveError'))
      }
      return false
    }
  }

  const clearUserSelection = () => {
    setUserSelectedDays(null)
  }

  return {
    liveness,
    selectedDays,
    isLoading,
    isSaving: updateLiveness.isPending,
    handleQuickSelect,
    handleCompleteSetup,
    clearUserSelection,
  }
}
