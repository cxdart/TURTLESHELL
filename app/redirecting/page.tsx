'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ALLOWED = ['/', '/systems', '/account']
type Lang = 'en' | 'ar' | 'de' | 'ja'

const REDIRECT_COPY: Record<Lang, {
  checking: string
  errorHeadline: string
  errorSub: string
  signupHeadline: string
  signupSub: string
  welcomeBack: string
  systemsSub: string
}> = {
  en: {
    checking: 'Verifying session...',
    errorHeadline: 'Something went wrong',
    errorSub: 'Redirecting to login...',
    signupHeadline: 'Account created!',
    signupSub: 'Taking you home...',
    welcomeBack: 'Welcome back',
    systemsSub: 'Taking you to your systems...',
  },
  ar: {
    checking: 'جار التحقق من الجلسة...',
    errorHeadline: 'حدث خطأ ما',
    errorSub: 'جار تحويلك إلى تسجيل الدخول...',
    signupHeadline: 'تم إنشاء الحساب!',
    signupSub: 'جار نقلك إلى الرئيسية...',
    welcomeBack: 'أهلا بعودتك',
    systemsSub: 'جار نقلك إلى أنظمتك...',
  },
  de: {
    checking: 'Sitzung wird überprüft...',
    errorHeadline: 'Etwas ist schiefgelaufen',
    errorSub: 'Weiterleitung zur Anmeldung...',
    signupHeadline: 'Konto erstellt!',
    signupSub: 'Du wirst zur Startseite weitergeleitet...',
    welcomeBack: 'Willkommen zurück',
    systemsSub: 'Weiterleitung zu deinen Systemen...',
  },
  ja: {
    checking: 'セッションを確認しています...',
    errorHeadline: '問題が発生しました',
    errorSub: 'ログイン画面へ移動しています...',
    signupHeadline: 'アカウントを作成しました！',
    signupSub: 'ホームへ移動しています...',
    welcomeBack: 'おかえりなさい',
    systemsSub: 'システムへ移動しています...',
  },
}

function normalizeLang(value: string | null | undefined): Lang {
  const v = (value || '').toLowerCase()
  if (v.startsWith('ar')) return 'ar'
  if (v.startsWith('de')) return 'de'
  if (v.startsWith('ja')) return 'ja'
  return 'en'
}

function welcomeWithName(lang: Lang, base: string, name: string) {
  if (lang === 'ar' || lang === 'ja') return `${base}، ${name}`
  return `${base}, ${name}`
}

function RedirectingInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [name, setName] = useState<string | null>(null)
  const [status, setStatus] = useState<'checking' | 'ready' | 'error'>('checking')
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en'
    return normalizeLang(localStorage.getItem('turtleshell-lang') || document.documentElement.getAttribute('lang'))
  })

  const from = params.get('from') ?? 'login'
  const rawTo = params.get('to') ?? ''
  const to = ALLOWED.includes(rawTo) ? rawTo : (from === 'signup' ? '/' : '/systems')
  const copy = REDIRECT_COPY[lang]

  useEffect(() => {
    const onLang = (e: Event) => {
      const next = normalizeLang((e as CustomEvent<string>).detail)
      setLang(next)
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'turtleshell-lang') return
      setLang(normalizeLang(e.newValue))
    }

    window.addEventListener('turtleshell-lang-change', onLang)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('turtleshell-lang-change', onLang)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function verify() {
      const supabase = createClient()

      let session = null
      for (let i = 0; i < 8; i++) {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          session = data.session
          break
        }
        await new Promise((r) => setTimeout(r, 300))
      }

      if (cancelled) return

      if (!session) {
        setStatus('error')
        setTimeout(() => router.replace('/login?error=auth_failed'), 1500)
        return
      }

      const displayName =
        session.user.user_metadata?.full_name?.split(' ')[0] ||
        session.user.email?.split('@')[0] ||
        null

      setName(displayName)
      setStatus('ready')

      setTimeout(() => {
        if (!cancelled) router.replace(to)
      }, 1800)
    }

    verify()
    return () => { cancelled = true }
  }, [router, to])

  const headline =
    status === 'error'
      ? copy.errorHeadline
      : from === 'signup'
        ? copy.signupHeadline
        : name
          ? welcomeWithName(lang, copy.welcomeBack, name)
          : copy.welcomeBack

  const sub =
    status === 'error'
      ? copy.errorSub
      : from === 'signup'
        ? copy.signupSub
        : copy.systemsSub

  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      gap: '28px',
      padding: '24px',
      fontFamily: lang === 'ar' ? "'Cairo', 'Inter', sans-serif" : "'Inter', sans-serif",
    }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute',
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,179,237,0.18) 0%, transparent 70%)',
          filter: 'blur(12px)',
          animation: 'rdrPulse 2s ease-in-out infinite',
        }} />
        <svg width="88" height="88" viewBox="0 0 88 88" style={{ position: 'absolute', animation: 'rdrSpin 1.1s linear infinite' }}>
          <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(99,179,237,0.18)" strokeWidth="3" />
          <circle
            cx="44"
            cy="44"
            r="38"
            fill="none"
            stroke="rgba(99,179,237,0.75)"
            strokeWidth="3"
            strokeDasharray="60 180"
            strokeLinecap="round"
          />
        </svg>
        <picture>
          <source srcSet="/TURTLESHELL-LOGO.webp" type="image/webp" />
          <img
            src="/TURTLESHELL-LOGO.png"
            alt="TURTLESHELL"
            style={{
              width: '56px',
              height: '56px',
              objectFit: 'contain',
              position: 'relative',
              zIndex: 1,
              filter: 'var(--logo-filter, brightness(0) invert(1))',
              animation: 'rdrFadeIn 0.6s ease forwards',
            }}
          />
        </picture>
      </div>

      <div style={{ textAlign: 'center', direction: lang === 'ar' ? 'rtl' : 'ltr', animation: 'rdrFadeIn 0.5s ease 0.2s both' }}>
        <h1 style={{
          fontSize: 'clamp(1.35rem, 4vw, 1.75rem)',
          fontWeight: 700,
          color: 'var(--text)',
          margin: '0 0 8px',
          letterSpacing: '-0.02em',
        }}>
          {status === 'checking' ? '\u00A0' : headline}
        </h1>
        <p style={{
          fontSize: '0.88rem',
          color: 'var(--text-muted)',
          margin: 0,
          letterSpacing: lang === 'ar' ? '0' : '0.03em',
        }}>
          {status === 'checking' ? copy.checking : sub}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '7px', animation: 'rdrFadeIn 0.5s ease 0.4s both' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: status === 'error' ? 'rgba(239,68,68,0.7)' : 'rgba(99,179,237,0.7)',
              animation: `rdrDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes rdrSpin   { to { transform: rotate(360deg); } }
        @keyframes rdrPulse  { 0%,100% { opacity:.5; transform:scale(1); } 50% { opacity:1; transform:scale(1.15); } }
        @keyframes rdrFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes rdrDot    { 0%,80%,100% { opacity:.25; transform:scale(0.8); } 40% { opacity:1; transform:scale(1.2); } }
        [data-theme="light"] img[alt="TURTLESHELL"] { filter: brightness(0); }
      `}</style>
    </div>
  )
}

export default function RedirectingPage() {
  return (
    <Suspense>
      <RedirectingInner />
    </Suspense>
  )
}
