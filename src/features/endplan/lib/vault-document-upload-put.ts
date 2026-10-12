/**
 * Presigned PUT (e.g. S3) with upload progress. Prefer over fetch() when UI needs byte-level progress.
 */
export function putBlobWithUploadProgress(
  url: string,
  body: Blob,
  contentType: string,
  onProgress: (loaded: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType)

    xhr.upload.onprogress = (event) => {
      const total = event.lengthComputable ? event.total : body.size
      if (total > 0) {
        onProgress(event.loaded, total)
      } else if (event.loaded > 0) {
        onProgress(event.loaded, body.size)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed (${xhr.status})`))
      }
    }

    xhr.onerror = () => {
      reject(new Error('Upload failed (network)'))
    }

    xhr.send(body)
  })
}

/** Map per-file milestone `t ∈ [0,1]` into overall batch percent. `fileIndex` is 0-based. */
export function batchUploadOverallPercent(fileIndex: number, totalFiles: number, tWithinFile: number): number {
  const n = Math.max(1, totalFiles)
  const clampedT = Math.min(1, Math.max(0, tWithinFile))
  return Math.min(100, ((fileIndex + clampedT) / n) * 100)
}
