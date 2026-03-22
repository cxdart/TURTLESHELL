'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Lang = 'en' | 'ar' | 'de' | 'ja'
const ALLOWED_NEXT = ['/', '/systems', '/account'] as const

const COPY: Record<Lang, {
  title: string
  subtitle: string
  cta: string
  redirecting: string
  waiting: string
  secureNote: string
  errorPrefix: string
}> = {
  en: {
    title: 'Sign in with Google',
    subtitle: 'Open a secure Google window to continue to your account.',
    cta: 'Continue with Google',
    redirecting: 'Opening Google...',
    waiting: 'Waiting for Google sign-in...',
    secureNote: 'Secure OAuth sign-in powered by Google',
    errorPrefix: 'Error:',
  },
  ar: {
    title: 'تسجيل الدخول عبر Google',
    subtitle: 'افتح نافذة Google الآمنة للمتابعة إلى حسابك.',
    cta: 'المتابعة باستخدام Google',
    redirecting: 'جارٍ فتح Google...',
    waiting: 'بانتظار تسجيل الدخول من Google...',
    secureNote: 'تسجيل دخول آمن عبر OAuth من Google',
    errorPrefix: 'خطأ:',
  },
  de: {
    title: 'Mit Google anmelden',
    subtitle: 'Öffne ein sicheres Google-Fenster, um fortzufahren.',
    cta: 'Mit Google fortfahren',
    redirecting: 'Google wird geöffnet...',
    waiting: 'Warte auf Google-Anmeldung...',
    secureNote: 'Sicherer OAuth-Login über Google',
    errorPrefix: 'Fehler:',
  },
  ja: {
    title: 'Googleでサインイン',
    subtitle: '安全なGoogleウィンドウを開いて続行します。',
    cta: 'Google で続行',
    redirecting: 'Google を開いています...',
    waiting: 'Google サインインを待機中...',
    secureNote: 'Google OAuth による安全なサインイン',
    errorPrefix: 'エラー:',
  },
}

function normalizeLang(value: string | null | undefined): Lang {
  const v = (value || '').toLowerCase()
  if (v.startsWith('ar')) return 'ar'
  if (v.startsWith('de')) return 'de'
  if (v.startsWith('ja')) return 'ja'
  return 'en'
}

function sanitizeMode(value: string | null): 'login' | 'link' {
  return value === 'link' ? 'link' : 'login'
}

function sanitizeNext(value: string | null, mode: 'login' | 'link') {
  const fallback = mode === 'link' ? '/account' : '/systems'
  if (!value) return fallback
  return ALLOWED_NEXT.includes(value as (typeof ALLOWED_NEXT)[number]) ? value : fallback
}

function isPopupFlow(value: string | null) {
  return value === '1'
}

function GoogleContinueInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [lang, setLang] = useState<Lang>('en')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const mode = useMemo(() => sanitizeMode(params.get('mode')), [params])
  const next = useMemo(() => sanitizeNext(params.get('next'), mode), [mode, params])
  const popup = useMemo(() => isPopupFlow(params.get('popup')), [params])
  const copy = COPY[lang]
  const isRtl = lang === 'ar'

  useEffect(() => {
    const applyLang = () => {
      const stored = localStorage.getItem('turtleshell-lang')
      setLang(normalizeLang(stored || document.documentElement.getAttribute('lang')))
    }

    const onLang = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      setLang(normalizeLang(detail))
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'turtleshell-lang') return
      setLang(normalizeLang(event.newValue))
    }

    applyLang()
    window.addEventListener('turtleshell-lang-change', onLang)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('turtleshell-lang-change', onLang)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  useEffect(() => {
    if (!(mode === 'login' && popup)) return

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const payload = event.data as { type?: string; success?: boolean; next?: string; error?: string } | null
      if (!payload || payload.type !== 'turtleshell-google-auth') return

      if (!payload.success) {
        setLoading(false)
        setError(`${copy.errorPrefix} ${payload.error || 'auth_failed'}`)
        return
      }

      setLoading(false)
      router.replace(`/redirecting?from=login&to=${encodeURIComponent(payload.next || next)}`)
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'turtleshell-google-auth' || !event.newValue) return
      try {
        const payload = JSON.parse(event.newValue) as { type?: string; success?: boolean; next?: string; error?: string }
        if (payload.type !== 'turtleshell-google-auth') return

        if (!payload.success) {
          setLoading(false)
          setError(`${copy.errorPrefix} ${payload.error || 'auth_failed'}`)
          return
        }

        setLoading(false)
        router.replace(`/redirecting?from=login&to=${encodeURIComponent(payload.next || next)}`)
      } catch {
        // Ignore malformed storage payload.
      } finally {
        localStorage.removeItem('turtleshell-google-auth')
      }
    }

    window.addEventListener('message', onMessage)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('storage', onStorage)
    }
  }, [copy.errorPrefix, mode, next, popup, router])

  const handleContinueWithGoogle = async () => {
    if (loading) return

    setLoading(true)
    setError('')
    const supabase = createClient()
    const from = mode === 'link' ? 'google_link' : 'login'
    const callbackQuery = new URLSearchParams({
      from,
      next,
    })
    if (mode === 'login' && popup) callbackQuery.set('popup', '1')
    const redirectTo = `${location.origin}/auth/callback?${callbackQuery.toString()}`

    const result =
      mode === 'link'
        ? await supabase.auth.linkIdentity({
            provider: 'google',
            options: { redirectTo },
          })
        : await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo,
              ...(popup ? { skipBrowserRedirect: true } : {}),
            },
          })

    if (result.error) {
      setError(`${copy.errorPrefix} ${result.error.message}`)
      setLoading(false)
      return
    }

    if (mode === 'login' && popup) {
      const oauthUrl = result.data?.url
      if (!oauthUrl) {
        setError(`${copy.errorPrefix} auth_popup_url_missing`)
        setLoading(false)
        return
      }

      // iOS Safari requires window.open() to be called synchronously inside a user gesture.
      // We open a blank window first, then navigate it to the OAuth URL.
      // This avoids the async-gap popup-block on iOS.
      const preopenedPopup = window.open('', 'turtleshell-google-auth', 'popup=yes,width=520,height=720,resizable=yes,scrollbars=yes')
      if (!preopenedPopup) {
        // Popup blocked even synchronously -- fall back to redirect
        window.location.href = oauthUrl
        return
      }
      preopenedPopup.location.href = oauthUrl
      preopenedPopup.focus()
    }
  }

  const handleBack = () => {
    const fallback = mode === 'link' ? '/account' : '/login'
    if (window.history.length > 1) {
      router.back()
      return
    }
    router.replace(fallback)
  }

  return (
    <div
      className="auth-page auth-page--google-continue"
      style={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <section
        style={{
          width: 'min(560px, 94vw)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'linear-gradient(180deg, rgba(9,14,24,0.84), rgba(8,12,21,0.78))',
          boxShadow: '0 20px 44px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.08)',
          padding: '24px',
          display: 'grid',
          gap: '14px',
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          style={{
            justifySelf: isRtl ? 'end' : 'start',
            width: '34px',
            height: '34px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <span aria-hidden="true" className={`arrow ${isRtl ? 'arrow--right' : 'arrow--left'}`}>{isRtl ? '\u2192' : '\u2190'}</span>
        </button>

        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(1.2rem, 3.8vw, 1.6rem)',
            lineHeight: 1.2,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
          }}
        >
          {copy.title}
        </h1>

        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {copy.subtitle}
        </p>

        <button
          type="button"
          onClick={handleContinueWithGoogle}
          disabled={loading}
          style={{
            width: '100%',
            minHeight: '56px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
            color: 'var(--text)',
            fontSize: '1rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.78 : 1,
          }}
        >
          <GoogleIcon />
          <span>{loading ? copy.redirecting : copy.cta}</span>
        </button>

        {loading && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            <span
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '999px',
                border: '2px solid rgba(148, 163, 184, 0.35)',
                borderTopColor: 'rgba(56, 189, 248, 0.95)',
                animation: 'googleAuthSpin 0.9s linear infinite',
              }}
              aria-hidden="true"
            />
            <span>{copy.waiting}</span>
          </div>
        )}

        {!error && (
          <p style={{ margin: 0, color: 'rgba(148, 163, 184, 0.92)', fontSize: '0.84rem' }}>
            {copy.secureNote}
          </p>
        )}

        {error && (
          <p style={{ margin: 0, color: '#ffb2aa', fontSize: '0.9rem' }}>
            {error}
          </p>
        )}
      </section>
      <style>{`
        @keyframes googleAuthSpin {
          to { transform: rotate(360deg); }
        }
        [data-theme="light"] .auth-page--google-continue section {
          background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(246,250,255,0.9)) !important;
          border-color: rgba(15,23,42,0.14) !important;
          box-shadow: 0 18px 40px rgba(15,23,42,0.16), inset 0 1px 0 rgba(255,255,255,0.88) !important;
        }
      `}</style>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export default function GoogleContinuePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--text)' }}>
          Loading...
        </div>
      }
    >
      <GoogleContinueInner />
    </Suspense>
  )
}


