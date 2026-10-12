import { lazy, Suspense, type ReactNode } from 'react'
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
  type Location,
} from 'react-router-dom'
import { useAuthUser } from '@/features/auth/session'
import type { BillingUpgradeModalLocationState } from '@/features/billing'
import { ErrorBoundary, Spinner } from '@/shared/ui'
import { ProtectedRoute } from './protected-route'
import { MainLayout } from '../layouts/main-layout'
import {
  ROUTES,
  endplanSectionPath,
  sharedEndplanPath,
  sharedEndplanSectionPath,
} from '../constants/routes'

const LoginPage = lazy(async () => {
  const module = await import('@/pages/login')
  return { default: module.LoginPage }
})

const SignupPage = lazy(async () => {
  const module = await import('@/pages/signup')
  return { default: module.SignupPage }
})

const VerifyEmailPage = lazy(async () => {
  const module = await import('@/pages/verify-email')
  return { default: module.VerifyEmailPage }
})

const ForgotPasswordPage = lazy(async () => {
  const module = await import('@/pages/forgot-password')
  return { default: module.ForgotPasswordPage }
})

const InvitePage = lazy(async () => {
  const module = await import('@/pages/invite')
  return { default: module.InvitePage }
})

const DashboardPage = lazy(async () => {
  const module = await import('@/pages/dashboard')
  return { default: module.DashboardPage }
})

const CreateEndPlanPage = lazy(async () => {
  const module = await import('@/pages/create-endplan')
  return { default: module.CreateEndPlanPage }
})

const EditEndPlanPage = lazy(async () => {
  const module = await import('@/pages/edit-endplan')
  return { default: module.EditEndPlanPage }
})

const TrustedCirclePage = lazy(async () => {
  const module = await import('@/pages/trusted-circle')
  return { default: module.TrustedCirclePage }
})

const SharedWithMePage = lazy(async () => {
  const module = await import('@/pages/shared-with-me')
  return { default: module.SharedWithMePage }
})

const SharedVaultPage = lazy(async () => {
  const module = await import('@/pages/shared-vault')
  return { default: module.SharedVaultPage }
})

const SettingsPage = lazy(async () => {
  const module = await import('@/pages/settings')
  return { default: module.SettingsPage }
})

const SettingsDataPrivacyPage = lazy(async () => {
  const module = await import('@/pages/settings')
  return { default: module.SettingsDataPrivacyPage }
})

const SettingsBillingPage = lazy(async () => {
  const module = await import('@/pages/settings')
  return { default: module.SettingsBillingPage }
})

const SettingsBillingUpgradePage = lazy(async () => {
  const module = await import('@/pages/settings')
  return { default: module.SettingsBillingUpgradePage }
})

const SettingsBillingUpgradeModalPage = lazy(async () => {
  const module = await import('@/pages/settings')
  return { default: module.SettingsBillingUpgradeModalPage }
})

const ConfigureTransferProcessPage = lazy(async () => {
  const module = await import('@/pages/configure-transfer-process')
  return { default: module.ConfigureTransferProcessPage }
})

const BillingPage = lazy(async () => {
  const module = await import('@/pages/billing')
  return { default: module.BillingPage }
})

const BillingSuccessPage = lazy(async () => {
  const module = await import('@/pages/billing/success')
  return { default: module.BillingSuccessPage }
})

const BillingCancelPage = lazy(async () => {
  const module = await import('@/pages/billing/cancel')
  return { default: module.BillingCancelPage }
})

const VaultSectionPage = lazy(async () => {
  const module = await import('@/pages/vault')
  return { default: module.VaultSectionPage }
})

function LegacyVaultSectionRedirect() {
  const { sectionType } = useParams<{ sectionType: string }>()
  return <Navigate to={sectionType ? endplanSectionPath(sectionType) : ROUTES.DASHBOARD} replace />
}

function LegacySharedVaultRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={id ? sharedEndplanPath(id) : ROUTES.SHARED_WITH_ME} replace />
}

function LegacySharedVaultSectionRedirect() {
  const { id, sectionType } = useParams<{ id: string; sectionType: string }>()
  return (
    <Navigate
      to={id && sectionType ? sharedEndplanSectionPath(id, sectionType) : ROUTES.SHARED_WITH_ME}
      replace
    />
  )
}

function RouteSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

export function AppRoutes() {
  const { isAuthenticated, user } = useAuthUser()
  const location = useLocation()
  const state = location.state as BillingUpgradeModalLocationState | null
  const backgroundLocation = state?.backgroundLocation as Location | undefined

  // Determine where to redirect based on auth and verification status
  const getDefaultRoute = () => {
    if (!isAuthenticated) return ROUTES.LOGIN
    if (!user?.emailVerified) return ROUTES.VERIFY_EMAIL
    return ROUTES.DASHBOARD
  }

  return (
    <>
      <Routes location={backgroundLocation ?? location}>
        <Route
          path={ROUTES.ROOT}
          element={<Navigate to={getDefaultRoute()} replace />}
        />
        
        {/* Auth routes - no MainLayout wrapper */}
        <Route path={ROUTES.LOGIN} element={<RouteSuspense><LoginPage /></RouteSuspense>} />
        <Route path={ROUTES.SIGNUP} element={<RouteSuspense><SignupPage /></RouteSuspense>} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<RouteSuspense><VerifyEmailPage /></RouteSuspense>} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<RouteSuspense><ForgotPasswordPage /></RouteSuspense>} />
        <Route path={ROUTES.INVITE} element={<RouteSuspense><InvitePage /></RouteSuspense>} />

        {/* Protected routes - single mounted layout branch */}
        <Route
          element={
            <ProtectedRoute requireVerified>
              <MainLayout>
                <ErrorBoundary>
                  <Outlet />
                </ErrorBoundary>
              </MainLayout>
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.DASHBOARD} element={<RouteSuspense><DashboardPage /></RouteSuspense>} />
          <Route path={ROUTES.CREATE_ENDPLAN} element={<RouteSuspense><CreateEndPlanPage /></RouteSuspense>} />
          <Route path={ROUTES.EDIT_ENDPLAN} element={<RouteSuspense><EditEndPlanPage /></RouteSuspense>} />
          <Route path={ROUTES.TRUSTED_CIRCLE} element={<RouteSuspense><TrustedCirclePage /></RouteSuspense>} />
          <Route path={ROUTES.SHARED_WITH_ME} element={<RouteSuspense><SharedWithMePage /></RouteSuspense>} />
          <Route path={ROUTES.SHARED_ENDPLAN_SECTION} element={<RouteSuspense><SharedVaultPage /></RouteSuspense>} />
          <Route path={ROUTES.SHARED_ENDPLAN} element={<RouteSuspense><SharedVaultPage /></RouteSuspense>} />
          <Route path="/shared-vault/:id/:sectionType" element={<LegacySharedVaultSectionRedirect />} />
          <Route path="/shared-vault/:id" element={<LegacySharedVaultRedirect />} />
          <Route path={ROUTES.SETTINGS} element={<RouteSuspense><SettingsPage /></RouteSuspense>} />
          <Route
            path={ROUTES.SETTINGS_DATA_PRIVACY}
            element={<RouteSuspense><SettingsDataPrivacyPage /></RouteSuspense>}
          />
          <Route path={ROUTES.SETTINGS_BILLING} element={<RouteSuspense><SettingsBillingPage /></RouteSuspense>} />
          <Route path={ROUTES.SETTINGS_BILLING_UPGRADE} element={<RouteSuspense><SettingsBillingUpgradePage /></RouteSuspense>} />
          <Route path={ROUTES.CONFIGURE_TRANSFER_PROCESS} element={<RouteSuspense><ConfigureTransferProcessPage /></RouteSuspense>} />
          <Route path={ROUTES.BILLING} element={<RouteSuspense><BillingPage /></RouteSuspense>} />
          <Route path={ROUTES.BILLING_SUCCESS} element={<RouteSuspense><BillingSuccessPage /></RouteSuspense>} />
          <Route path={ROUTES.BILLING_CANCEL} element={<RouteSuspense><BillingCancelPage /></RouteSuspense>} />
          <Route path={ROUTES.ENDPLAN_SECTION_ITEM_EDIT} element={<RouteSuspense><VaultSectionPage /></RouteSuspense>} />
          <Route path={ROUTES.ENDPLAN_SECTION_ITEM} element={<RouteSuspense><VaultSectionPage /></RouteSuspense>} />
          <Route path={ROUTES.ENDPLAN_SECTION} element={<RouteSuspense><VaultSectionPage /></RouteSuspense>} />
          <Route path="/vault/:sectionType" element={<LegacyVaultSectionRedirect />} />
        </Route>
        
        <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
      </Routes>

      {backgroundLocation ? (
        <Routes>
          <Route
            path={ROUTES.SETTINGS_BILLING_UPGRADE}
            element={
              <ProtectedRoute requireVerified>
                <RouteSuspense>
                  <SettingsBillingUpgradeModalPage />
                </RouteSuspense>
              </ProtectedRoute>
            }
          />
        </Routes>
      ) : null}
    </>
  )
}
