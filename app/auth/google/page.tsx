'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function GoogleEntryInner() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const next = params.get('next')
    const mode = params.get('mode')
    const popup = params.get('popup')
    const target = new URLSearchParams()
    if (next) target.set('next', next)
    if (mode) target.set('mode', mode)
    if (popup) target.set('popup', popup)
    const query = target.toString()
    router.replace(query ? `/auth/google/continue?${query}` : '/auth/google/continue')
  }, [params, router])

  return null
}

export default function GoogleEntryPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--text)' }}>
          Redirecting...
        </div>
      }
    >
      <GoogleEntryInner />
    </Suspense>
  )
}
