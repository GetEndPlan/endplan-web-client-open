/**
 * Opens the browser print dialog so the user can save as PDF ("Save as PDF").
 * Uses a hidden iframe (no new tab) and prints as soon as the document is ready.
 * Does not upload the phrase anywhere.
 */
export function printRecoveryPhraseSheet(options: {
  title: string
  subtitle: string
  words: string[]
  footerNote: string
}): boolean {
  const html = buildRecoveryPhrasePrintHtml(options)

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden'
  document.body.appendChild(iframe)

  const contentWindow = iframe.contentWindow
  if (!contentWindow) {
    iframe.remove()
    return openPrintWindow(html)
  }

  const doc = contentWindow.document
  doc.open()
  doc.write(html)
  doc.close()

  let didPrint = false
  const triggerPrint = () => {
    if (didPrint) return
    didPrint = true
    try {
      contentWindow.focus()
      contentWindow.print()
    } catch {
      // ignore
    }
  }

  const removeIframe = () => {
    iframe.remove()
  }

  contentWindow.addEventListener('afterprint', removeIframe, { once: true })
  setTimeout(removeIframe, 60_000)

  if (doc.readyState === 'complete') {
    triggerPrint()
  } else {
    contentWindow.addEventListener('load', triggerPrint, { once: true })
  }

  // Fallback when `load` does not fire after `document.write` (seen in some browsers).
  setTimeout(() => {
    if (!didPrint) triggerPrint()
  }, 50)

  return true
}

/** Fallback when iframe printing is unavailable. */
function openPrintWindow(html: string): boolean {
  const win = window.open('about:blank', '_blank')
  if (!win) return false

  try {
    win.opener = null
  } catch {
    // ignore
  }

  win.document.open()
  win.document.write(html)
  win.document.close()

  let didPrint = false
  const triggerPrint = () => {
    if (didPrint) return
    didPrint = true
    try {
      win.focus()
      win.print()
    } catch {
      // ignore
    }
  }

  if (win.document.readyState === 'complete') {
    triggerPrint()
  } else {
    win.addEventListener('load', triggerPrint, { once: true })
  }
  setTimeout(() => {
    if (!didPrint) triggerPrint()
  }, 50)

  return true
}

function buildRecoveryPhrasePrintHtml(options: {
  title: string
  subtitle: string
  words: string[]
  footerNote: string
}): string {
  const { title, subtitle, words, footerNote } = options
  const phrasePlain = escapeHtml(words.join(' '))

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; }
  h1 { font-size: 22px; margin: 0 0 8px; }
  p.sub { color: #475569; margin: 0 0 24px; max-width: 560px; }
  .phrase {
    margin: 0 0 24px;
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 15px;
    line-height: 1.6;
    word-break: break-word;
    user-select: all;
    -webkit-user-select: all;
  }
  .footer { margin-top: 28px; font-size: 12px; color: #b45309; max-width: 560px; }
  @media print { body { padding: 0; } }
</style></head><body>
  <h1>${escapeHtml(title)}</h1>
  <p class="sub">${escapeHtml(subtitle)}</p>
  <p class="phrase">${phrasePlain}</p>
  <p class="footer">${escapeHtml(footerNote)}</p>
</body></html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
