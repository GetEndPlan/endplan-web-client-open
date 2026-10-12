import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Driver } from 'driver.js'
import { consumeLegacyDashboardNavTourSettled } from '../lib/migrate-dashboard-nav-tour-storage'
import { areDashboardNavTourTargetsReady, runDashboardNavTour } from '../lib/run-dashboard-nav-tour'

/** Matches Tailwind `lg` — drawer is used below this width. */
const MOBILE_TOUR_MAX_WIDTH_PX = 1024

/** `SidebarMobile` uses `duration-300`; wait until the panel is on-screen before measuring tour targets. */
const MOBILE_DRAWER_OPEN_WAIT_MS = 320

/**
 * After welcome modals or loading gates clear, React may not have committed sidebar / vault grid yet.
 * A single rAF pass can run before `[data-tour]` nodes exist; retry until ready or cap (~2.5s @ 60fps).
 */
const TOUR_TARGETS_MAX_RAF_ATTEMPTS = 150

export type UseDashboardNavTourParams = {
  userId: string | null
  canOffer: boolean
  settled: boolean
  onSettled: () => void
  showWelcomeModal: boolean
  stillLoading: boolean
  blocked: boolean
  openMobileDrawer?: () => void
}

export function useDashboardNavTour(params: UseDashboardNavTourParams): void {
  const { i18n } = useTranslation()
  const driverRef = useRef<Driver | null>(null)
  const {
    userId,
    canOffer,
    settled,
    onSettled,
    showWelcomeModal,
    stillLoading,
    blocked,
    openMobileDrawer,
  } = params

  useEffect(() => {
    if (!userId || settled) {
      return
    }

    if (consumeLegacyDashboardNavTourSettled(userId)) {
      onSettled()
    }
  }, [onSettled, settled, userId])

  useEffect(() => {
    if (
      !userId ||
      stillLoading ||
      !canOffer ||
      settled ||
      blocked ||
      showWelcomeModal
    ) {
      return
    }

    let cancelled = false
    const shouldPersistSettledRef = { current: true }
    let drawerOpenWaitId: number | undefined
    let raf2Id: number | undefined
    let targetsRetryRafId: number | undefined
    let targetAttempts = 0

    const startTourWhenTargetsReady = () => {
      if (cancelled) {
        return
      }
      if (!areDashboardNavTourTargetsReady()) {
        targetAttempts += 1
        if (targetAttempts > TOUR_TARGETS_MAX_RAF_ATTEMPTS) {
          return
        }
        targetsRetryRafId = window.requestAnimationFrame(() => {
          targetsRetryRafId = undefined
          startTourWhenTargetsReady()
        })
        return
      }

      void (async () => {
        if (cancelled) {
          return
        }
        const t = i18n.getFixedT(i18n.language, 'translation')
        try {
          const d = await runDashboardNavTour({
            t,
            shouldPersistSettledRef,
            onSettled,
          })
          if (cancelled) {
            shouldPersistSettledRef.current = false
            d?.destroy()
            return
          }
          if (d) {
            driverRef.current = d
          }
        } catch {
          // Do not mark settled — user can retry on a later visit.
        }
      })()
    }

    const runTour = () => {
      if (cancelled) {
        return
      }
      targetAttempts = 0
      startTourWhenTargetsReady()
    }

    const start = () => {
      if (cancelled) {
        return
      }

      const openDrawer = openMobileDrawer
      const useMobileDrawer =
        typeof window !== 'undefined' &&
        !window.matchMedia(`(min-width: ${MOBILE_TOUR_MAX_WIDTH_PX}px)`).matches &&
        openDrawer != null

      if (useMobileDrawer) {
        openDrawer()
        drawerOpenWaitId = window.setTimeout(() => {
          drawerOpenWaitId = undefined
          if (cancelled) {
            return
          }
          runTour()
        }, MOBILE_DRAWER_OPEN_WAIT_MS)
        return
      }

      runTour()
    }

    const raf1Id = window.requestAnimationFrame(() => {
      raf2Id = window.requestAnimationFrame(start)
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(raf1Id)
      if (raf2Id != null) {
        window.cancelAnimationFrame(raf2Id)
      }
      if (targetsRetryRafId != null) {
        window.cancelAnimationFrame(targetsRetryRafId)
      }
      if (drawerOpenWaitId != null) {
        window.clearTimeout(drawerOpenWaitId)
      }
      shouldPersistSettledRef.current = false
      driverRef.current?.destroy()
      driverRef.current = null
    }
  }, [
    i18n,
    i18n.language,
    blocked,
    canOffer,
    onSettled,
    openMobileDrawer,
    settled,
    showWelcomeModal,
    stillLoading,
    userId,
  ])
}
