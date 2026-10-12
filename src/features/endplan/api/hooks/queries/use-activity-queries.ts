import { useQuery } from '@tanstack/react-query'

import { isVisibleRecentActivityItem } from '../../../model/activity-display'
import { activityApi } from '../../clients/activity-api'
import { vaultKeys } from '../../keys/vault-query-keys'

export function useRecentActivity(options?: { limit?: number; offset?: number; enabled?: boolean }) {
  const limit = options?.limit ?? 10
  const offset = options?.offset ?? 0

  return useQuery({
    queryKey: vaultKeys.activity(limit, offset),
    queryFn: () => activityApi.list({ limit, offset }),
    enabled: options?.enabled ?? true,
    select: (data) => ({
      ...data,
      activity: data.activity.filter(isVisibleRecentActivityItem),
    }),
  })
}
