import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import { applyAppVariantDocumentChrome } from './app/config/app-variant'
import {
  resolveActiveAppVariant,
  syncAppVariantOverrideFromUrl,
} from './app/config/app-variant-runtime'
import './index.css'
// Initialize i18n
import './shared/lib/i18n'
import './shared/lib/pdf-worker'
import { initPlausibleAnalytics } from './shared/lib/plausible-analytics'
import { installTrustedTypesPolicy } from './shared/lib/trusted-types'

installTrustedTypesPolicy()
initPlausibleAnalytics()
syncAppVariantOverrideFromUrl()
applyAppVariantDocumentChrome(resolveActiveAppVariant().id)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
