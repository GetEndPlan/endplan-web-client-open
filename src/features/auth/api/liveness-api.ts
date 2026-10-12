import { api } from '@/shared/api/client'

export type LivenessResponse = {
  inactivityPeriodDays?: number | null
  reminderIntervalMinutes?: number | null
  lastActiveAt?: string | null
  lastReminderAt?: string | null
  releaseTriggerAt?: string | null
}

export const ALLOWED_PERIODS = [14, 30, 60] as const
export const RECOMMENDED_PERIOD = 30

/** Reminder interval options in minutes: 15, 30, 60, 1440 (1d), 10080 (7d), 20160 (14d), 43200 (30d) */
export const ALLOWED_REMINDER_INTERVAL_MINUTES = [15, 30, 60, 1440, 10080, 20160, 43200] as const

/** Minutes per day for filtering valid reminder options (reminder must be < inactivity window) */
export const MINUTES_PER_DAY = 1440

export function getReminderIntervalLabelKey(minutes: number): string {
  switch (minutes) {
    case 15: return 'liveness.reminder15Min'
    case 30: return 'liveness.reminder30Min'
    case 60: return 'liveness.reminder60Min'
    case 1440: return 'liveness.reminder1Day'
    case 10080: return 'liveness.reminder7Days'
    case 20160: return 'liveness.reminder14Days'
    case 43200: return 'liveness.reminder30Days'
    default: return 'liveness.reminderNever'
  }
}

/** Reminder options valid for the given inactivity period (minutes). Option must be < periodMinutes. */
export function getValidReminderOptionsForPeriod(inactivityPeriodDays: number | null): readonly number[] {
  if (inactivityPeriodDays == null) return ALLOWED_REMINDER_INTERVAL_MINUTES
  const periodMinutes = inactivityPeriodDays * MINUTES_PER_DAY
  return ALLOWED_REMINDER_INTERVAL_MINUTES.filter((m) => m < periodMinutes)
}

export type UpdateLivenessParams = {
  inactivityPeriodDays: number | null
  reminderIntervalMinutes: number | null
}

export const livenessApi = {
  async getLiveness(): Promise<LivenessResponse> {
    const res = await api.get<LivenessResponse>('/api/v1/user/liveness')
    return res ?? {}
  },

  async updateLiveness(params: UpdateLivenessParams): Promise<LivenessResponse> {
    const body: Record<string, number | null> = {
      inactivityPeriodDays: params.inactivityPeriodDays,
      reminderIntervalMinutes: params.reminderIntervalMinutes,
    }
    return api.patch<LivenessResponse>('/api/v1/user/liveness', body)
  },
}
