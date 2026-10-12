import { useCallback, useState } from 'react'
import { useKeyPersonStartOwnEndplanPrompt } from '@/features/endplan/hooks/onboarding/use-key-person-start-own-endplan-prompt'
import { useStartOwnEndplanFlow } from './use-start-own-endplan-flow'

/**
 * Same eligibility as the dashboard banner and sidebar "start your own EndPlan"
 * card (`useKeyPersonStartOwnEndplanPrompt.showBanner`). Only invite-only key persons
 * are gated; users who already had an EndPlan account before the invite (including
 * free tier) keep full access to their own plan.
 */
export function useKeyPersonPageGate() {
  const { showBanner: requiresGate } = useKeyPersonStartOwnEndplanPrompt()
  const { startOwnEndplan } = useStartOwnEndplanFlow()

  const [showGateModal, setShowGateModal] = useState(false)
  const [ctasSuppressed, setCtasSuppressed] = useState(false)
  const [prevRequiresGate, setPrevRequiresGate] = useState<boolean | null>(null)
  if (prevRequiresGate === null || requiresGate !== prevRequiresGate) {
    setPrevRequiresGate(requiresGate)
    if (!requiresGate) {
      setShowGateModal(false)
      setCtasSuppressed(false)
    } else {
      // Start in "suppressed" mode so CTA attempts open the modal,
      // but never auto-open it on initial page load.
      setShowGateModal(false)
      setCtasSuppressed(true)
    }
  }

  const onContinueFree = useCallback(() => {
    setShowGateModal(false)
    setCtasSuppressed(true)
  }, [])

  const openGateModal = useCallback(() => {
    if (!requiresGate) return
    setShowGateModal(true)
  }, [requiresGate])

  const onStartOwnEndplan = useCallback(() => {
    void startOwnEndplan()
  }, [startOwnEndplan])

  const wrapIfSuppressed = useCallback(
    <Args extends unknown[]>(fn: (...args: Args) => void) => {
      return (...args: Args) => {
        if (!requiresGate) {
          fn(...args)
          return
        }
        if (ctasSuppressed) {
          openGateModal()
          return
        }
        fn(...args)
      }
    },
    [requiresGate, ctasSuppressed, openGateModal],
  )

  return {
    requiresGate,
    showGateModal,
    setShowGateModal,
    ctasSuppressed,
    onContinueFree,
    onStartOwnEndplan,
    openGateModal,
    wrapIfSuppressed,
  }
}
