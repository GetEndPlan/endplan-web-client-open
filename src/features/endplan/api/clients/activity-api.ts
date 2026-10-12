import { api } from '@/shared/api'

export type ActivityLogItem = {
  id: string
  action: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export type ActivityListResponse = {
  activity: ActivityLogItem[]
  hasMore: boolean
  limit: number
  offset: number
}

export const activityApi = {
  async list(params?: { limit?: number; offset?: number }): Promise<ActivityListResponse> {
    const limit = params?.limit ?? 10
    const offset = params?.offset ?? 0
    const query = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    })

    return api.get<ActivityListResponse>(`/api/v1/activity?${query.toString()}`)
  },
}
