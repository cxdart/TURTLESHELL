'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

function PopupDoneInner() {
  const params = useSearchParams()

  useEffect(() => {
    const success = params.get('success') === '1'
    const next = params.get('next') || '/systems'
    const error = params.get('error') || ''
    const payload = {
      type: 'turtleshell-google-auth',
      success,
      next,
      error,
    }

    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, window.location.origin)
      }
    } catch {
      // Ignore opener messaging failures.
    }

    try {
      localStorage.setItem('turtleshell-google-auth', JSON.stringify(payload))
    } catch {
      // Ignore storage errors.
    }

    const closeTimer = window.setTimeout(() => {
      window.close()
    }, 120)

    return () => window.clearTimeout(closeTimer)
  }, [params])

  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Inter', 'Cairo', sans-serif",
      }}
    >
      <p style={{ margin: 0, opacity: 0.82 }}>Authentication complete. You can close this window.</p>
    </div>
  )
}

export default function GooglePopupDonePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--text)' }}>
          Closing...
        </div>
      }
    >
      <PopupDoneInner />
    </Suspense>
  )
}
