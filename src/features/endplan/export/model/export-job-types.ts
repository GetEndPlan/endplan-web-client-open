export type EndplanExportStatus = 'idle' | 'running' | 'done' | 'error' | 'cancelled'

export type EndplanExportStage =
  | 'preparing'
  | 'overview'
  | 'assets'
  | 'policies'
  | 'contacts'
  | 'instructions'
  | 'documents'
  | 'attachments'
  | 'packaging'

export type EndplanExportStopReason = 'user' | 'locked'

export type EndplanExportProgress = {
  stage: EndplanExportStage
  completedUnits: number
  totalUnits: number
  itemIndex?: number
  itemCount?: number
}

export function endplanExportPercent(progress: EndplanExportProgress | null): number {
  if (!progress || progress.totalUnits <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((progress.completedUnits / progress.totalUnits) * 100)))
}
