/** RFC 4648 base64 alphabet (same as `btoa` / standard PEM-style encoding). */
const BASE64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/**
 * Encode bytes as base64 without building an intermediate full-length binary string
 * (avoids an extra ~1× heap copy vs `String.fromCharCode` + `btoa` for large blobs).
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  const len = bytes.length
  let out = ''
  let i = 0
  for (; i + 2 < len; i += 3) {
    const a = bytes[i]!
    const b = bytes[i + 1]!
    const c = bytes[i + 2]!
    const triplet = (a << 16) | (b << 8) | c
    out +=
      BASE64[(triplet >> 18) & 63] +
      BASE64[(triplet >> 12) & 63] +
      BASE64[(triplet >> 6) & 63] +
      BASE64[triplet & 63]
  }
  const rem = len - i
  if (rem === 1) {
    const triplet = bytes[i]! << 16
    out += BASE64[(triplet >> 18) & 63] + BASE64[(triplet >> 12) & 63] + '=='
  } else if (rem === 2) {
    const triplet = (bytes[i]! << 16) | (bytes[i + 1]! << 8)
    out += BASE64[(triplet >> 18) & 63] + BASE64[(triplet >> 12) & 63] + BASE64[(triplet >> 6) & 63] + '='
  }
  return out
}

/**
 * Fetches a blob from a URL and returns its body as UTF-8 text.
 * Used for vault blob (JSON envelope) when API returns blobUrl (S3 backend).
 */
export async function fetchBlobAsText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch blob: ${res.status} ${res.statusText}`)
  }
  return res.text()
}

/**
 * Fetches a blob from a URL and returns its body as base64.
 * Used for section blob (binary ciphertext) when API returns blobUrl (S3 backend).
 */
export async function fetchBlobAsBase64(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch blob: ${res.status} ${res.statusText}`)
  }
  const buf = await res.arrayBuffer()
  return uint8ArrayToBase64(new Uint8Array(buf))
}
