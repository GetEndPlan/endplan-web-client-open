const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const HTML_ESCAPE_PATTERN = /[&<>"']/g

/**
 * Escapes untrusted HTML input into inert text-safe HTML.
 * This deliberately does not allow any raw markup.
 */
export function sanitizeUntrustedHtml(input: string): string {
  return input.replace(HTML_ESCAPE_PATTERN, (char) => HTML_ESCAPE_MAP[char] ?? char)
}
