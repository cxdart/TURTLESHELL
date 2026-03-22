'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ContactModal from '@/components/ContactModal'
import LightButton from '@/components/LightButton'
import { createClient } from '@/lib/supabase/client'
import { useRuntimeLanguage } from '@/lib/use-runtime-language'

const AUTH_COPY = {
  en: {
    auth_failed: 'Authentication failed. Please try again.',
    generic_error: 'Something went wrong',
    identifier_required: 'Please enter your email.',
    email_required: 'Please enter your email.',
    username_required: 'Please enter your username.',
    password_required: 'Please enter your password.',
    fullname_required: 'Please enter your full name.',
    username_not_found: 'No account found with that username.',
    login_check_email: 'Check your email for a confirmation link.',
    login_title: 'Welcome back',
    signup_title: 'Create account',
    login_desc: 'Sign in to access your systems.',
    signup_desc: 'Join TURTLESHELL to manage your infrastructure.',
    auth_eyebrow: 'TURTLESHELL ACCESS',
    brand_build: 'Build.',
    brand_automate: 'Automate.',
    brand_scale: 'Scale.',
    btn_google: 'Continue with Google',
    login_or: 'or',
    login_fullname: 'Full Name',
    login_fullname_ph: 'turtle123',
    login_username: 'Username',
    login_username_ph: 'turtle123',
    login_phone_optional: 'Phone Number (optional)',
    login_phone_ph: '+1 555 000 0000',
    login_identifier: 'Email',
    ph_identifier: 'you@example.com',
    login_email: 'Email',
    ph_email: 'you@example.com',
    login_password: 'Password',
    login_pass_ph_signup: 'Min. 8 characters',
    login_pass_ph: '••••••••',
    login_lock_warning: 'Username and email cannot be changed after account creation. If you ever need to update them, you will need to contact support.',
    login_choose_carefully: 'Choose carefully.',
    login_loading: 'Please wait...',
    login_btn: 'Sign In',
    signup_btn: 'Create Account',
    login_no_account: "Don't have an account?",
    login_have_account: 'Already have an account?',
    login_sign_up: 'Sign up',
    login_sign_in: 'Sign in',
    forgot_password: 'Forgot password?',
    reset_title: 'Reset password',
    reset_desc: "Enter your email and we'll send you a reset link.",
    reset_btn: 'Send reset link',
    reset_sent: 'Check your inbox for a reset link.',
    back_to_login: 'Back to sign in',
  },
  ar: {
    auth_failed: 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.',
    generic_error: 'حدث خطأ ما',
    identifier_required: '\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a.',
    email_required: 'يرجى إدخال البريد الإلكتروني.',
    username_required: 'يرجى إدخال اسم المستخدم.',
    password_required: 'يرجى إدخال كلمة المرور.',
    fullname_required: 'يرجى إدخال الاسم الكامل.',
    username_not_found: 'لا يوجد حساب بهذا الاسم.',
    login_check_email: 'تحقق من بريدك الإلكتروني لتأكيد الحساب.',
    login_title: 'أهلًا بعودتك',
    signup_title: 'إنشاء حساب',
    login_desc: 'سجل الدخول للوصول إلى أنظمتك.',
    signup_desc: 'انضم إلى TURTLESHELL لإدارة بنيتك الرقمية.',
    auth_eyebrow: 'دخول TURTLESHELL',
    brand_build: 'ابنِ.',
    brand_automate: 'أتمت.',
    brand_scale: 'وسّع.',
    btn_google: 'المتابعة باستخدام Google',
    login_or: 'أو',
    login_fullname: 'الاسم الكامل',
    login_fullname_ph: 'turtle123',
    login_username: 'اسم المستخدم',
    login_username_ph: 'turtle123',
    login_phone_optional: 'رقم الهاتف (اختياري)',
    login_phone_ph: '+966 50 000 0000',
    login_identifier: '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a',
    ph_identifier: 'you@example.com',
    login_email: 'البريد الإلكتروني',
    ph_email: 'you@example.com',
    login_password: 'كلمة المرور',
    login_pass_ph_signup: '8 أحرف على الأقل',
    login_pass_ph: '••••••••',
    login_lock_warning: 'لا يمكن تغيير اسم المستخدم والبريد الإلكتروني بعد إنشاء الحساب. إذا احتجت لتحديثهما، يرجى التواصل مع الدعم.',
    login_choose_carefully: 'اختر بعناية.',
    login_loading: 'يرجى الانتظار...',
    login_btn: 'تسجيل الدخول',
    signup_btn: 'إنشاء حساب',
    login_no_account: 'ليس لديك حساب؟',
    login_have_account: 'لديك حساب بالفعل؟',
    login_sign_up: 'إنشاء حساب',
    login_sign_in: 'تسجيل الدخول',
    forgot_password: 'نسيت كلمة المرور؟',
    reset_title: 'إعادة تعيين كلمة المرور',
    reset_desc: 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.',
    reset_btn: 'إرسال رابط الإعادة',
    reset_sent: 'تحقق من بريدك الإلكتروني للحصول على رابط إعادة التعيين.',
    back_to_login: 'العودة لتسجيل الدخول',
  },
  de: {
    auth_failed: 'Authentifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
    generic_error: 'Etwas ist schiefgelaufen',
    identifier_required: 'Bitte E-Mail eingeben.',
    email_required: 'Bitte E-Mail eingeben.',
    username_required: 'Bitte Benutzernamen eingeben.',
    password_required: 'Bitte Passwort eingeben.',
    fullname_required: 'Bitte vollst?ndigen Namen eingeben.',
    username_not_found: 'Kein Konto mit diesem Benutzernamen gefunden.',
    login_check_email: 'Pr?fen Sie Ihre E-Mails auf einen Best?tigungslink.',
    login_title: 'Willkommen zur?ck',
    signup_title: 'Konto erstellen',
    login_desc: 'Melden Sie sich an, um auf Ihre Systeme zuzugreifen.',
    signup_desc: 'Treten Sie TURTLESHELL bei, um Ihre Infrastruktur zu verwalten.',
    auth_eyebrow: 'TURTLESHELL ZUGANG',
    brand_build: 'Bauen.',
    brand_automate: 'Automatisieren.',
    brand_scale: 'Skalieren.',
    btn_google: 'Mit Google fortfahren',
    login_or: 'oder',
    login_fullname: 'Vollst?ndiger Name',
    login_fullname_ph: 'turtle123',
    login_username: 'Benutzername',
    login_username_ph: 'turtle123',
    login_phone_optional: 'Telefonnummer (optional)',
    login_phone_ph: '+49 170 0000000',
    login_identifier: 'E-Mail',
    ph_identifier: 'you@example.com',
    login_email: 'E-Mail',
    ph_email: 'you@example.com',
    login_password: 'Passwort',
    login_pass_ph_signup: 'Mind. 8 Zeichen',
    login_pass_ph: '••••••••',
    login_lock_warning: 'Benutzername und E-Mail k?nnen nach der Kontoerstellung nicht ge?ndert werden. Wenn Sie sie aktualisieren m?ssen, wenden Sie sich an den Support.',
    login_choose_carefully: 'Sorgf?ltig w?hlen.',
    login_loading: 'Bitte warten...',
    login_btn: 'Anmelden',
    signup_btn: 'Konto erstellen',
    login_no_account: 'Noch kein Konto?',
    login_have_account: 'Haben Sie bereits ein Konto?',
    login_sign_up: 'Registrieren',
    login_sign_in: 'Anmelden',
    forgot_password: 'Passwort vergessen?',
    reset_title: 'Passwort zurücksetzen',
    reset_desc: 'Geben Sie Ihre E-Mail ein und wir senden Ihnen einen Reset-Link.',
    reset_btn: 'Reset-Link senden',
    reset_sent: 'Prüfen Sie Ihren Posteingang für den Reset-Link.',
    back_to_login: 'Zurück zur Anmeldung',
  },
  ja: {
    auth_failed: '??????????????????????',
    generic_error: '?????????',
    identifier_required: '\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
    email_required: '?????????????????',
    username_required: '???????????????',
    password_required: '???????????????',
    fullname_required: '????????????',
    username_not_found: '??????????????????????',
    login_check_email: '??????????????????????????????',
    login_title: '???????',
    signup_title: '???????',
    login_desc: '?????????????????????????',
    signup_desc: 'TURTLESHELL ??????????????????',
    auth_eyebrow: 'TURTLESHELL ????',
    brand_build: '???',
    brand_automate: '????',
    brand_scale: '???',
    btn_google: 'Google ???',
    login_or: '???',
    login_fullname: '??',
    login_fullname_ph: 'turtle123',
    login_username: '?????',
    login_username_ph: 'turtle123',
    login_phone_optional: '????????',
    login_phone_ph: '+81 90 0000 0000',
    login_identifier: '\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9',
    ph_identifier: 'you@example.com',
    login_email: '???????',
    ph_email: 'you@example.com',
    login_password: '?????',
    login_pass_ph_signup: '8????',
    login_pass_ph: '••••••••',
    login_lock_warning: '??????????????????????????????????????????????????????',
    login_choose_carefully: '???????????',
    login_loading: '???????...',
    login_btn: '?????',
    signup_btn: '???????',
    login_no_account: '??????????????????',
    login_have_account: '????????????????',
    login_sign_up: '??',
    login_sign_in: 'サインイン',
    forgot_password: 'パスワードをお忘れですか？',
    reset_title: 'パスワードをリセット',
    reset_desc: 'メールアドレスを入力してください。リセットリンクをお送りします。',
    reset_btn: 'リセットリンクを送信',
    reset_sent: 'メールをご確認ください。',
    back_to_login: 'サインインに戻る',
  },
} as const

type AuthCopyKey = keyof typeof AUTH_COPY.en

function LoginPageInner() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [identifier, setIdentifier] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const lang = useRuntimeLanguage()

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const t = (key: AuthCopyKey) => {
    const copy = (AUTH_COPY[lang as keyof typeof AUTH_COPY] ?? AUTH_COPY.en) as Partial<Record<AuthCopyKey, string>>
    const value = copy[key]
    if (typeof value === 'string' && !/\?{3,}/.test(value)) return value
    return AUTH_COPY.en[key]
  }

  useEffect(() => {
    const errParam = searchParams.get('error')
    if (errParam === 'auth_failed') setError(t('auth_failed'))
    const msgParam = searchParams.get('message')
    if (msgParam) setMessage(decodeURIComponent(msgParam))
  }, [searchParams, lang])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setMessage('')
    const emailVal = identifier.trim()
    if (!emailVal) { setError(t('email_required')); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailVal, {
        redirectTo: `${location.origin}/auth/update-password`,
      })
      if (error) throw error
      setMessage(t('reset_sent'))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('generic_error'))
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setMessage('')
    const emailValue = identifier.trim()
    const usernameValue = username.trim()
    const passwordValue = password.trim()
    const fullNameValue = fullName.trim()
    const phoneValue = phoneNumber.trim()
    if (!emailValue) {
      setError(t('email_required'))
      return
    }
    if (mode === 'signup' && !usernameValue) {
      setError(t('username_required'))
      return
    }
    if (!passwordValue) {
      setError(t('password_required'))
      return
    }
    if (mode === 'signup' && !fullNameValue) {
      setError(t('fullname_required'))
      return
    }
    setLoading(true)
    let keepLoading = false

    try {
      if (mode === 'signup') {
        const signupData: Record<string, string> = { full_name: fullNameValue, username: usernameValue }
        if (phoneValue) signupData.phone = phoneValue
        const { error } = await supabase.auth.signUp({
          email: emailValue,
          password: passwordValue,
          options: {
            data: signupData,
            emailRedirectTo: `${location.origin}/auth/callback?from=signup`,
          },
        })
        if (error) throw error
        setMessage(t('login_check_email'))
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailValue,
          password: passwordValue,
        })
        if (error) throw error
        keepLoading = true
        setMessage(t('login_loading'))
        router.push('/redirecting?from=login&to=%2Fsystems')
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('generic_error'))
      keepLoading = false
    } finally {
      if (!keepLoading) setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (loading) return
    setError('')
    setMessage(t('login_loading'))
    const isSignup = mode === 'signup'
    if (!isSignup) {
      router.push('/auth/google?mode=login&next=/systems&popup=1')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback?from=${isSignup ? 'signup' : 'login'}`,
      },
    })
    if (error) {
      setError(error.message)
      setMessage('')
      setLoading(false)
    }
  }

  const isRTL = lang === 'ar'
  const title = mode === 'login' ? t('login_title') : mode === 'signup' ? t('signup_title') : t('reset_title')
  const description = mode === 'login' ? t('login_desc') : mode === 'signup' ? t('signup_desc') : t('reset_desc')

  return (
    <div className="auth-page">
      <div className="auth-page-orb auth-page-orb--one" aria-hidden="true" />
      <div className="auth-page-orb auth-page-orb--two" aria-hidden="true" />

      <div className="auth-shell">
        <aside className="auth-brand-panel" aria-hidden="true">
          <span className="auth-brand-badge">TURTLESHELL</span>
          <div className="auth-brand-lockup">
            <img className="auth-brand-logo" src="/TURTLESHELL-LOGO.png" alt="" />
            <span className="auth-brand-wordmark">TURTLESHELL</span>
          </div>
          <div className="auth-brand-display">
            <span>{t('brand_build')}</span>
            <span>{t('brand_automate')}</span>
            <span>{t('brand_scale')}</span>
          </div>
          <p className="auth-brand-copy">{description}</p>
          <div className="auth-brand-tags">
            <span>NEXUS</span>
            <span>ATLAS</span>
            <span>GENOS</span>
          </div>
        </aside>

        <section className="auth-card" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="auth-card-glow" aria-hidden="true" />

          <div className="auth-card-header">
            <span className="auth-eyebrow">{t('auth_eyebrow')}</span>
            <div className="auth-card-mark">
              <img src="/TURTLESHELL-LOGO.png" alt="" />
            </div>
            <h1 data-i18n={mode === 'login' ? 'login_title' : 'signup_title'}>{title}</h1>
            <p data-i18n={mode === 'login' ? 'login_desc' : 'signup_desc'}>{description}</p>
          </div>

          {error && <div className="auth-alert auth-alert--error">{error}</div>}
          {message && <div className="auth-alert auth-alert--success">{message}</div>}

          <button type="button" onClick={handleGoogleLogin} className="auth-google-btn" disabled={loading}>
            <GoogleIcon />
            <span data-i18n={loading ? 'login_loading' : 'btn_google'}>
              {loading ? t('login_loading') : t('btn_google')}
            </span>
          </button>

          <div className="auth-divider">
            <span></span>
            <strong data-i18n="login_or">{t('login_or')}</strong>
            <span></span>
          </div>

          <form onSubmit={mode === 'reset' ? handleReset : handleEmailAuth} className="auth-form">
            {mode === 'signup' && (
              <div className="auth-field">
                <label className="auth-label" data-i18n="login_fullname">
                  {t('login_fullname')}
                </label>
                <input
                  className="auth-input"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={t('login_fullname_ph')}
                  data-i18n-ph="login_fullname_ph"
                  disabled={loading}
                  required
                />
              </div>
            )}

            {mode === 'signup' && (
              <div className="auth-field">
                <label className="auth-label" data-i18n="login_username">
                  {t('login_username')}
                </label>
                <input
                  className="auth-input"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={t('login_username_ph')}
                  data-i18n-ph="login_username_ph"
                  disabled={loading}
                  autoComplete="username"
                  required
                />
              </div>
            )}

            {mode === 'signup' && (
              <div className="auth-field">
                <label className="auth-label" data-i18n="login_phone_optional">
                  {t('login_phone_optional')}
                </label>
                <input
                  className="auth-input"
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder={t('login_phone_ph')}
                  data-i18n-ph="login_phone_ph"
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label">
                {t('login_email')}
              </label>
              <input
                className="auth-input"
                type="email"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={t('ph_email')}
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>

            {mode !== 'reset' && <div className="auth-field">
              <label className="auth-label" data-i18n="login_password">
                {t('login_password')}
              </label>
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? t('login_pass_ph_signup') : t('login_pass_ph')}
                data-i18n-ph={mode === 'signup' ? 'login_pass_ph_signup' : 'login_pass_ph'}
                disabled={loading}
                required
                minLength={mode === 'signup' ? 8 : undefined}
              />
              {mode === 'login' && (
                <button
                  type="button"
                  className="auth-forgot-btn"
                  onClick={() => { setMode('reset'); setError(''); setMessage('') }}
                >
                  {t('forgot_password')}
                </button>
              )}
            </div>}

            {mode === 'signup' && (
              <div className="auth-warning">
                <span className="auth-warning-dot" aria-hidden="true"></span>
                <p>
                  <span data-i18n="login_lock_warning">{t('login_lock_warning')}</span>{' '}
                  <strong data-i18n="login_choose_carefully">{t('login_choose_carefully')}</strong>
                </p>
              </div>
            )}

            <LightButton type="submit" disabled={loading} variant="hollow" className="auth-submit-btn">
              <span>
                {loading ? t('login_loading') : mode === 'login' ? t('login_btn') : mode === 'signup' ? t('signup_btn') : t('reset_btn')}
              </span>
            </LightButton>
            {mode === 'reset' && (
              <button type="button" className="auth-switch-btn" style={{marginTop: '8px', display: 'block', width: '100%', textAlign: 'center'}} onClick={() => { setMode('login'); setError(''); setMessage('') }}>
                {t('back_to_login')}
              </button>
            )}
          </form>

          <p className="auth-switch-row">
            <span data-i18n={mode === 'login' ? 'login_no_account' : 'login_have_account'}>
              {mode === 'login' ? t('login_no_account') : t('login_have_account')}
            </span>{' '}
            <button
              type="button"
              className="auth-switch-btn"
              disabled={loading}
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError('')
                setMessage('')
              }}
              data-i18n={mode === 'login' ? 'login_sign_up' : 'login_sign_in'}
            >
              {mode === 'login' ? t('login_sign_up') : t('login_sign_in')}
            </button>
          </p>
        </section>
      </div>
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

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
        <LoginPageInner />
      </Suspense>
      <ContactModal />
    </>
  )
}
