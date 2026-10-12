export type ErasureKind = 'endplan_data' | 'full_account'

export type ErasureStatus =
  | 'scheduled'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'failed'

export type ErasureRequest = {
  id: string
  userId: string
  kind: ErasureKind
  status: ErasureStatus
  scheduledExecuteAt: string
  gracePeriodDays: number
  attemptCount: number
  createdAt: string
  updatedAt: string
  confirmedAt?: string
  cancelledAt?: string
  cancellationReason?: string
  lastError?: string
  completedAt?: string
  notifiedOwnersAt?: string
}

export type ErasureListResponse = {
  requests: ErasureRequest[]
}

export type ErasureScheduleResponse = {
  request: ErasureRequest
  scheduledExecuteAt: string
  gracePeriodDays: number
  confirmationEmailTo: string
}
