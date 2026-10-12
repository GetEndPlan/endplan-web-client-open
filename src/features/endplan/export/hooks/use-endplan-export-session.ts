import { useEffect } from 'react'
import { useKeysStore } from '@/features/keys'
import { cancelEndplanExport } from '../lib/start-endplan-export'
import { useEndplanExportStore } from '../model/export-job-store'

export function useEndplanExportSessionGuards(): void {
  const status = useEndplanExportStore((state) => state.status)

  useEffect(() => {
    return useKeysStore.subscribe((state, previous) => {
      if (!state.privateKeyB64 && previous.privateKeyB64) {
        cancelEndplanExport('locked')
      }
    })
  }, [])

  useEffect(() => {
    if (status !== 'running') return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [status])
}
