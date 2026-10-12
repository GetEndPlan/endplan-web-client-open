import { setPdfWorkerSrc } from 'omni-doc-viewer'

// Served as .js so nginx mime.types maps application/javascript (not octet-stream for .mjs).
setPdfWorkerSrc('/assets/pdf.worker.min.js')
