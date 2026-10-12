import type { TFunction } from 'i18next'
import type { Config, DriveStep, Driver, PopoverDOM } from 'driver.js'

/** Primary nav is rendered twice (mobile drawer + desktop rail); `querySelector` would hit the wrong one. */
const NAV_TOUR_TARGETS = ['nav-dashboard', 'nav-trusted-circle', 'nav-transfer-process'] as const

function getVisibleSidebarRoot(): HTMLElement | null {
  const desktop = document.getElementById('app-sidebar-desktop')
  if (desktop != null && window.getComputedStyle(desktop).display !== 'none') {
    return desktop
  }
  return document.getElementById('app-sidebar-mobile')
}

function resolveSidebarNavTourElement(
  dataTour: (typeof NAV_TOUR_TARGETS)[number],
): HTMLElement | null {
  const root = getVisibleSidebarRoot()
  return root?.querySelector<HTMLElement>(`[data-tour="${dataTour}"]`) ?? null
}

/** Exported for the hook pre-check (must match step resolution). */
export function areDashboardNavTourTargetsReady(): boolean {
  for (const key of NAV_TOUR_TARGETS) {
    if (resolveSidebarNavTourElement(key) == null) {
      return false
    }
  }
  return document.querySelector('[data-tour="dashboard-vault-section-grid"]') != null
}

/**
 * Driver puts nav buttons in `footerButtons`. We wrap them with Skip in `.ep-driver-tour-actions`.
 */
function layoutTourPopoverFooter(popover: PopoverDOM, skipLabel: string, onSkip: () => void): void {
  if (popover.footer.querySelector('.ep-driver-tour-actions')) {
    return
  }

  const skip = document.createElement('button')
  skip.type = 'button'
  skip.dataset.epDashboardNavTourSkip = ''
  skip.className = 'ep-driver-tour-skip'
  skip.textContent = skipLabel
  skip.addEventListener('click', () => {
    onSkip()
  })

  const actionsRow = document.createElement('div')
  actionsRow.className = 'ep-driver-tour-actions'
  actionsRow.appendChild(skip)
  actionsRow.appendChild(popover.footerButtons)
  popover.footer.appendChild(actionsRow)
}

export type RunDashboardNavTourOptions = {
  t: TFunction
  /** When false, onDestroyed will not persist settled state (e.g. React strict-mode cleanup). */
  shouldPersistSettledRef: { current: boolean }
  onSettled: () => void
}

/** Sidebar steps use `side: 'right'`; larger offset keeps the card off the rail. */
const POPOVER_OFFSET_SIDEBAR_STEPS = 32
const POPOVER_OFFSET_MAIN_STEP = 14
const SIDEBAR_STEP_COUNT = 3

function tourOverlayForTheme(): { overlayColor: string; overlayOpacity: number } {
  const dark = document.documentElement.classList.contains('dark')
  if (dark) {
    return { overlayColor: '#020617', overlayOpacity: 0.75 }
  }
  return { overlayColor: '#1e293b', overlayOpacity: 0.62 }
}

/** Loads Driver.js CSS and starts the dashboard nav tour. */
export async function runDashboardNavTour(options: RunDashboardNavTourOptions): Promise<Driver | null> {
  const { t, shouldPersistSettledRef, onSettled } = options

  if (!areDashboardNavTourTargetsReady()) {
    return null
  }

  await import('driver.js/dist/driver.css')
  const { driver } = await import('driver.js')

  const { overlayColor, overlayOpacity } = tourOverlayForTheme()

  const persistSettled = () => {
    if (!shouldPersistSettledRef.current) {
      return
    }
    shouldPersistSettledRef.current = false
    onSettled()
  }

  const steps: DriveStep[] = [
    {
      element: () => resolveSidebarNavTourElement('nav-dashboard')!,
      popover: {
        title: t('dashboard.navTour.steps.dashboard.title'),
        description: t('dashboard.navTour.steps.dashboard.description'),
        side: 'right',
        align: 'start',
        showButtons: ['next'],
      },
    },
    {
      element: () => resolveSidebarNavTourElement('nav-trusted-circle')!,
      popover: {
        title: t('dashboard.navTour.steps.trustedCircle.title'),
        description: t('dashboard.navTour.steps.trustedCircle.description'),
        side: 'right',
        align: 'start',
      },
    },
    {
      element: () => resolveSidebarNavTourElement('nav-transfer-process')!,
      popover: {
        title: t('dashboard.navTour.steps.transferProcess.title'),
        description: t('dashboard.navTour.steps.transferProcess.description'),
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '[data-tour="dashboard-vault-section-grid"]',
      popover: {
        title: t('dashboard.navTour.steps.vaultSections.title'),
        description: t('dashboard.navTour.steps.vaultSections.description'),
        side: 'bottom',
        align: 'center',
      },
    },
  ]

  const config: Config = {
    showProgress: false,
    showButtons: ['next', 'previous'],
    nextBtnText: t('dashboard.navTour.next'),
    prevBtnText: t('dashboard.navTour.previous'),
    doneBtnText: t('dashboard.navTour.done'),
    /** Hides X, disables overlay + Escape close (driver only adds close when this is true). */
    allowClose: false,
    /** With allowClose false, overlay clicks are ignored (see driver.js overlay handler). */
    overlayClickBehavior: 'close',
    smoothScroll: true,
    stagePadding: 6,
    stageRadius: 14,
    overlayColor,
    overlayOpacity,
    popoverOffset: POPOVER_OFFSET_SIDEBAR_STEPS,
    animate: true,
    popoverClass: 'ep-driver-popover',
    onHighlighted: (_e, _s, { driver }) => {
      const idx = driver.getActiveIndex()
      if (typeof idx !== 'number') {
        return
      }
      const targetOffset =
        idx < SIDEBAR_STEP_COUNT ? POPOVER_OFFSET_SIDEBAR_STEPS : POPOVER_OFFSET_MAIN_STEP
      const cfg = driver.getConfig()
      if (cfg.popoverOffset === targetOffset) {
        return
      }
      driver.setConfig({ ...cfg, popoverOffset: targetOffset })
      driver.refresh()
    },
    onPopoverRender: (popover, { driver: d }) => {
      layoutTourPopoverFooter(popover, t('dashboard.navTour.skip'), () => {
        persistSettled()
        d.destroy()
      })
    },
    onDestroyed: () => {
      persistSettled()
    },
    steps,
  }

  const driverInstance = driver(config)
  driverInstance.drive(0)
  return driverInstance
}
