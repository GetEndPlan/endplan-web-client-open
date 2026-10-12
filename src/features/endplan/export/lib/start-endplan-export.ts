import type { VaultResponse } from '../../api/clients/vault-api'
import { useEndplanExportStore } from '../model/export-job-store'
import type { EndplanExportStopReason } from '../model/export-job-types'
import { isAbortError } from './export-errors'
import { runEndplanExport } from './run-endplan-export'

let activeAbort: AbortController | null = null
let runGeneration = 0

export type StartEndplanExportInput = {
  vault: Pick<VaultResponse, 'id' | 'ownerId' | 'wrappedDek'>
  publicKeyB64: string
  privateKeyB64: string
  pqPrivateKeyB64?: string | null
  ownerName: string
}

export function cancelEndplanExport(reason: EndplanExportStopReason = 'user'): void {
  if (!activeAbort) {
    if (useEndplanExportStore.getState().status === 'running') {
      useEndplanExportStore.getState().setCancelled(reason)
    }
    return
  }
  activeAbort.abort(reason)
}

export async function startEndplanExport(input: StartEndplanExportInput): Promise<void> {
  if (useEndplanExportStore.getState().status === 'running') return

  activeAbort?.abort('user')
  const abort = new AbortController()
  activeAbort = abort
  const generation = ++runGeneration
  useEndplanExportStore.getState().beginRun()

  try {
    await runEndplanExport({
      ...input,
      signal: abort.signal,
      onProgress: (progress) => {
        if (generation !== runGeneration) return
        useEndplanExportStore.getState().setProgress(progress)
      },
    })
    if (generation !== runGeneration) return
    if (abort.signal.aborted) {
      useEndplanExportStore.getState().setCancelled(abort.signal.reason === 'locked' ? 'locked' : 'user')
      return
    }
    useEndplanExportStore.getState().setDone()
  } catch (error) {
    if (generation !== runGeneration) return
    if (abort.signal.aborted || isAbortError(error)) {
      useEndplanExportStore.getState().setCancelled(abort.signal.reason === 'locked' ? 'locked' : 'user')
      return
    }
    useEndplanExportStore.getState().setError()
  } finally {
    if (activeAbort === abort) {
      activeAbort = null
    }
  }
}
