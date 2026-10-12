/** Redact invite tokens and invitee PII from paths/query strings before analytics ingest. */
export function scrubAnalyticsUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl, typeof window !== 'undefined' ? window.location.origin : 'https://app.invalid')
    if (/^\/invite\//i.test(url.pathname)) {
      url.pathname = '/invite/:token'
    }
    for (const key of ['invite', 'token', 'email', 'name']) {
      if (url.searchParams.has(key)) {
        url.searchParams.set(key, 'redacted')
      }
    }
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/:invalid-url'
  }
}
