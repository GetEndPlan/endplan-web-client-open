import { create } from 'zustand'
import type {
  EndplanExportProgress,
  EndplanExportStatus,
  EndplanExportStopReason,
} from './export-job-types'

type EndplanExportState = {
  status: EndplanExportStatus
  progress: EndplanExportProgress | null
  stopReason: EndplanExportStopReason | null
  toastHidden: boolean
}

type EndplanExportActions = {
  beginRun: () => void
  setProgress: (progress: EndplanExportProgress) => void
  setDone: () => void
  setError: () => void
  setCancelled: (reason: EndplanExportStopReason) => void
  hideToast: () => void
  showToast: () => void
}

const initialState: EndplanExportState = {
  status: 'idle',
  progress: null,
  stopReason: null,
  toastHidden: false,
}

export const useEndplanExportStore = create<EndplanExportState & EndplanExportActions>((set) => ({
  ...initialState,
  beginRun: () =>
    set({
      status: 'running',
      progress: {
        stage: 'preparing',
        completedUnits: 0,
        totalUnits: 1,
      },
      stopReason: null,
      toastHidden: false,
    }),
  setProgress: (progress) => set({ progress, status: 'running' }),
  setDone: () => set({ status: 'done', toastHidden: false }),
  setError: () => set({ status: 'error', toastHidden: false }),
  setCancelled: (reason) => set({ status: 'cancelled', stopReason: reason, toastHidden: false }),
  hideToast: () => set({ toastHidden: true }),
  showToast: () => set({ toastHidden: false }),
}))
