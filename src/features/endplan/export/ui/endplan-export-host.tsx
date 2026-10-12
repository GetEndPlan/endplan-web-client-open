import { useEndplanExportSessionGuards } from '../hooks/use-endplan-export-session'
import { ExportProgressToast } from './export-progress-toast'

export function EndplanExportHost() {
  useEndplanExportSessionGuards()
  return <ExportProgressToast />
}
