import { Providers } from './providers'
import { AppRoutes } from './routes'
import { CookieConsentBanner, ToastContainer } from '@/shared/ui'

export function App() {
  return (
    <Providers>
      <AppRoutes />
      <CookieConsentBanner />
      <ToastContainer />
    </Providers>
  )
}
