import { useMemo } from 'react'
import {
  matchPath,
  useLocation,
  type Location,
} from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { INSTRUCTION_NEW_ID, ROUTES, sharedEndplanPath } from '@/app/constants/routes'
import type { BillingUpgradeModalLocationState } from '@/features/billing'

type BreadcrumbItem = {
  label: string
  href?: string
}

const KNOWN_SECTION_TYPES = new Set(['assets', 'documents', 'instructions', 'contacts'])

function getSectionLabel(sectionType: string | undefined, t: (key: string) => string) {
  if (!sectionType || !KNOWN_SECTION_TYPES.has(sectionType)) {
    return null
  }

  return t(`nav.${sectionType}`)
}

function resolveBreadcrumbs(pathname: string, t: (key: string) => string): BreadcrumbItem[] {
  const settingsBillingUpgradeMatch = matchPath(
    { path: ROUTES.SETTINGS_BILLING_UPGRADE, end: true },
    pathname,
  )
  if (settingsBillingUpgradeMatch) {
    return [
      { label: t('nav.settings'), href: ROUTES.SETTINGS },
      { label: t('nav.billing'), href: ROUTES.SETTINGS_BILLING },
      { label: t('settings.billing.upgradeNow') },
    ]
  }

  const settingsBillingMatch = matchPath({ path: ROUTES.SETTINGS_BILLING, end: true }, pathname)
  if (settingsBillingMatch) {
    return [
      { label: t('nav.settings'), href: ROUTES.SETTINGS },
      { label: t('nav.billing') },
    ]
  }

  const settingsDataPrivacyMatch = matchPath(
    { path: ROUTES.SETTINGS_DATA_PRIVACY, end: true },
    pathname,
  )
  if (settingsDataPrivacyMatch) {
    return [
      { label: t('nav.settings'), href: ROUTES.SETTINGS },
      { label: t('nav.dataPrivacy') },
    ]
  }

  const settingsMatch = matchPath({ path: ROUTES.SETTINGS, end: true }, pathname)
  if (settingsMatch) {
    return [
      { label: t('nav.settings'), href: ROUTES.SETTINGS },
      { label: t('nav.profile') },
    ]
  }

  const billingSuccessMatch = matchPath({ path: ROUTES.BILLING_SUCCESS, end: true }, pathname)
  if (billingSuccessMatch) {
    return [
      { label: t('nav.billing'), href: ROUTES.BILLING },
      { label: t('billing.success.title') },
    ]
  }

  const billingCancelMatch = matchPath({ path: ROUTES.BILLING_CANCEL, end: true }, pathname)
  if (billingCancelMatch) {
    return [
      { label: t('nav.billing'), href: ROUTES.BILLING },
      { label: t('billing.cancelPage.title') },
    ]
  }

  const billingMatch = matchPath({ path: ROUTES.BILLING, end: true }, pathname)
  if (billingMatch) {
    return [{ label: t('nav.billing') }]
  }

  const createEndPlanMatch = matchPath({ path: ROUTES.CREATE_ENDPLAN, end: true }, pathname)
  if (createEndPlanMatch) {
    return [
      { label: t('nav.dashboard'), href: ROUTES.DASHBOARD },
      { label: t('endplan.create.title') },
    ]
  }

  const editEndPlanMatch = matchPath({ path: ROUTES.EDIT_ENDPLAN, end: true }, pathname)
  if (editEndPlanMatch) {
    return [
      { label: t('nav.dashboard'), href: ROUTES.DASHBOARD },
      { label: t('endplan.edit.title') },
    ]
  }

  const configureTransferProcessMatch = matchPath(
    { path: ROUTES.CONFIGURE_TRANSFER_PROCESS, end: true },
    pathname,
  )
  if (configureTransferProcessMatch) {
    return [{ label: t('nav.configureTransferProcess') }]
  }

  const trustedCircleMatch = matchPath({ path: ROUTES.TRUSTED_CIRCLE, end: true }, pathname)
  if (trustedCircleMatch) {
    return [{ label: t('nav.trustedCircle') }]
  }

  const sharedEndplanSectionMatch = matchPath(
    { path: ROUTES.SHARED_ENDPLAN_SECTION, end: true },
    pathname,
  )
  if (sharedEndplanSectionMatch) {
    const sectionLabel = getSectionLabel(sharedEndplanSectionMatch.params.sectionType, t)
    const vaultId = sharedEndplanSectionMatch.params.id ?? ''

    return [
      { label: t('nav.sharedWithMe'), href: ROUTES.SHARED_WITH_ME },
      { label: t('sharedVault.breadcrumb'), href: sharedEndplanPath(vaultId) },
      { label: sectionLabel ?? t('sharedVault.sectionsTitle') },
    ]
  }

  const sharedEndplanMatch = matchPath({ path: ROUTES.SHARED_ENDPLAN, end: true }, pathname)
  if (sharedEndplanMatch) {
    return [
      { label: t('nav.sharedWithMe'), href: ROUTES.SHARED_WITH_ME },
      { label: t('sharedVault.breadcrumb') },
    ]
  }

  const sharedWithMeMatch = matchPath({ path: ROUTES.SHARED_WITH_ME, end: true }, pathname)
  if (sharedWithMeMatch) {
    return [{ label: t('nav.sharedWithMe') }]
  }

  const endplanSectionMatch = matchPath({ path: ROUTES.ENDPLAN_SECTION, end: true }, pathname)
  if (endplanSectionMatch) {
    const sectionLabel = getSectionLabel(endplanSectionMatch.params.sectionType, t)

    return [
      { label: t('nav.vaultSections') },
      { label: sectionLabel ?? t('nav.dashboard') },
    ]
  }

  const endplanSectionItemEditMatch = matchPath(
    { path: ROUTES.ENDPLAN_SECTION_ITEM_EDIT, end: true },
    pathname,
  )
  if (endplanSectionItemEditMatch) {
    const sectionLabel = getSectionLabel(endplanSectionItemEditMatch.params.sectionType, t)
    const sectionType = endplanSectionItemEditMatch.params.sectionType ?? ''
    const isNewInstructionComposer = endplanSectionItemEditMatch.params.instructionId === INSTRUCTION_NEW_ID
    return [
      { label: t('nav.vaultSections') },
      { label: sectionLabel ?? t('nav.dashboard'), href: `/endplan/${sectionType}` },
      {
        label: isNewInstructionComposer
          ? t('vault.instructions.breadcrumbCreate')
          : t('common.edit'),
      },
    ]
  }

  const endplanSectionItemMatch = matchPath({ path: ROUTES.ENDPLAN_SECTION_ITEM, end: true }, pathname)
  if (endplanSectionItemMatch) {
    const sectionLabel = getSectionLabel(endplanSectionItemMatch.params.sectionType, t)
    const sectionType = endplanSectionItemMatch.params.sectionType ?? ''
    const isNewInstructionChooser = endplanSectionItemMatch.params.instructionId === INSTRUCTION_NEW_ID
    return [
      { label: t('nav.vaultSections') },
      { label: sectionLabel ?? t('nav.dashboard'), href: `/endplan/${sectionType}` },
      {
        label: isNewInstructionChooser
          ? t('vault.instructions.breadcrumbChooseType')
          : t('common.preview'),
      },
    ]
  }

  const dashboardMatch = matchPath({ path: ROUTES.DASHBOARD, end: true }, pathname)
  if (dashboardMatch) {
    return [
      { label: t('nav.home'), href: ROUTES.DASHBOARD },
      { label: t('nav.dashboard') },
    ]
  }

  return []
}

export function useTopbarBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation()
  const { t } = useTranslation()
  const locationState = location.state as BillingUpgradeModalLocationState | null
  const effectiveLocation: Location = locationState?.backgroundLocation ?? location

  return useMemo(
    () => resolveBreadcrumbs(effectiveLocation.pathname, t),
    [effectiveLocation.pathname, t],
  )
}
