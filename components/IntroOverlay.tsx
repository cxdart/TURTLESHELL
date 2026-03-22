'use client'

import { useEffect, useRef } from 'react'

/**
 * IntroOverlay
 *
 * Renders the full-screen intro animation shown on the homepage.
 * Replaces the two dangerouslySetInnerHTML <script> blocks that were
 * previously inline in page.tsx.
 *
 * Responsibilities:
 *  - Initialise window.__introSkipped = false (if not already set)
 *  - Listen for tap/touch on the overlay to allow early skip
 *  - Fade + teardown the overlay if the user already skipped before
 *    this component mounted (e.g. fast repeat visits)
 *
 * The heavy animation logic (finishIntro, playHeroTitleWordLight, etc.)
 * continues to live in public/app.js and reads window.__introSkipped.
 */

// Extend window type once for the whole file
type TurtleshellWindow = Window & { __introSkipped?: boolean }

export default function IntroOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    const win = window as TurtleshellWindow

    // Declare flag on window if not already present
    if (typeof win.__introSkipped === 'undefined') {
      win.__introSkipped = false
    }

    function teardownOverlay() {
      if (!overlay) return
      overlay.setAttribute('hidden', '')
      overlay.style.display = 'none'
    }

    function fadeHideOverlay(isSkip = false) {
      if (!overlay) return
      if (isSkip) overlay.classList.add('is-skipping')
      overlay.classList.add('is-hidden')
      setTimeout(teardownOverlay, 1000)
    }

    function addIntroActiveClasses() {
      document.documentElement.classList.add('intro-active', 'scroll-lock')
      document.body.classList.add('intro-active', 'scroll-lock')
    }

    function removeScrollLockClasses() {
      document.documentElement.classList.remove('intro-active', 'scroll-lock')
      document.body.classList.remove('intro-active', 'scroll-lock')
    }

    // If the user already skipped before this effect ran (e.g. cached/fast page), bail early
    if (win.__introSkipped) {
      removeScrollLockClasses()
      fadeHideOverlay()
      return
    }

    addIntroActiveClasses()

    // Allow clicking/tapping the overlay to skip the intro before app.js handles it
    function earlySkip() {
      const w = window as TurtleshellWindow
      if (w.__introSkipped) return
      w.__introSkipped = true
      removeScrollLockClasses()
      fadeHideOverlay(true)
      overlay!.removeEventListener('click', earlySkip)
      overlay!.removeEventListener('touchend', earlySkip)
      setTimeout(() => {
        const w = window as Window & { __refreshRevealObserverTargets?: () => void }
        if (typeof w.__refreshRevealObserverTargets === 'function') w.__refreshRevealObserverTargets()
      }, 600)
    }

    overlay.addEventListener('click', earlySkip, { passive: true })
    overlay.addEventListener('touchend', earlySkip, { passive: true })

    return () => {
      overlay.removeEventListener('click', earlySkip)
      overlay.removeEventListener('touchend', earlySkip)
    }
  }, [])

  return (
    <div
      ref={overlayRef}
      className="intro-overlay"
      id="introOverlay"
      aria-hidden="true"
    >
      <div className="intro-content">
        <div className="intro-logo-wrap">
          <picture>
            <source srcSet="/TURTLESHELL-LOGO.webp" type="image/webp" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="intro-logo"
              src="/TURTLESHELL-LOGO.png"
              alt="TURTLESHELL"
              fetchPriority="high"
            />
          </picture>
        </div>
        <div className="intro-title-block" aria-hidden="true">
          <div className="intro-wordmark-wrap">
            <div className="intro-wordmark">TURTLESHELL</div>
          </div>
          <div className="intro-tagline">
            <span className="intro-tagline-text">Built, For you</span>
          </div>
        </div>
      </div>
    </div>
  )
}
