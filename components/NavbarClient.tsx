'use client'

import { useState, useEffect, useRef, useCallback, type MouseEvent as ReactMouseEvent } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import type { User } from '@supabase/supabase-js'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'

const LANG_META = {
  en: { label: 'English', flag: 'https://flagcdn.com/w40/us.png', alt: 'United States' },
  ar: { label: 'العربية', flag: 'https://flagcdn.com/w40/sa.png', alt: 'Saudi Arabia' },
  de: { label: 'Deutsch', flag: 'https://flagcdn.com/w40/de.png', alt: 'Germany' },
  ja: { label: '日本語', flag: 'https://flagcdn.com/w40/jp.png', alt: 'Japan' },
} as const

const ACCOUNT_FALLBACK_BY_LANG = {
  en: 'Account',
  ar: 'الحساب',
  de: 'Konto',
  ja: 'アカウント',
} as const

const LANGUAGE_SECTION_TITLE_BY_LANG = {
  en: 'Language',
  ar: 'اللغة',
  de: 'Sprache',
  ja: '言語',
} as const

const THEME_SECTION_TITLE_BY_LANG = {
  en: 'Appearance',
  ar: 'المظهر',
  de: 'Darstellung',
  ja: '表示',
} as const

const THEME_TOGGLE_LABEL_BY_LANG = {
  en: { dark: 'Dark Mode', light: 'Light Mode' },
  ar: { dark: 'داكن', light: 'فاتح' },
  de: { dark: 'Dunkel', light: 'Hell' },
  ja: { dark: 'ダーク', light: 'ライト' },
} as const

type Lang = keyof typeof LANG_META

interface NavbarClientProps { user: User | null; name: string | null }

function getInitialThemeIsDark() {
  if (typeof window === 'undefined') return true
  return (localStorage.getItem('turtleshell-theme') || 'dark') === 'dark'
}

function compactNavName(value: string, maxChars = 5) {
  const text = value.trim()
  const chars = Array.from(text)
  if (chars.length <= maxChars) return text
  return `${chars.slice(0, maxChars).join('')}...`
}

export default function NavbarClient({ user, name }: NavbarClientProps) {
  const pathname = usePathname()
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileVisible, setMobileVisible] = useState(false)
  const [mobileClosing, setMobileClosing] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [navDimmed, setNavDimmed] = useState(false)
  const [navTopFocus, setNavTopFocus] = useState(false)
  const [isDark, setIsDark] = useState(getInitialThemeIsDark)
  const [lang, setLang] = useState<Lang>('en')
  const navRef = useRef<HTMLElement>(null)
  const langRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const navDimmedRef = useRef(false)
  const navTopFocusRef = useRef(false)
  const overlayOpenRef = useRef(false)
  const bodyScrollYRef = useRef(0)
  const bodyScrollLockedRef = useRef(false)
  const skipBodyScrollRestoreRef = useRef(false)
  const closeTimerRef = useRef<number | null>(null)
  const lastScrollYRef = useRef(0)
  const scrollRafRef = useRef<number | null>(null)
  const idleFadeTimeoutRef = useRef<number | null>(null)
  const navHoveringRef = useRef(false)
  const overlayOpen = mobileOpen || langOpen || userOpen
  const MOBILE_NAV_ANIM_MS = 220
  const NAV_IDLE_FADE_DELAY_MS = 500

  const getDisplayName = useCallback((nextUser: User | null) => {
    return nextUser?.user_metadata?.full_name || nextUser?.email?.split('@')[0] || null
  }, [])
  const resolvedUser = authUser === undefined ? user : authUser
  const resolvedName = authUser === undefined ? name : getDisplayName(authUser)
  const accountLabelFull = resolvedName || ACCOUNT_FALLBACK_BY_LANG[lang]
  const accountLabelShort = compactNavName(accountLabelFull, 5)

  useEffect(() => {
    const supabase = createSupabaseClient()
    let isMounted = true

    const syncAuthUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!isMounted) return
      const nextUser = data.user ?? null
      setAuthUser(nextUser)
    }

    syncAuthUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      setAuthUser(nextUser)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const clearIdleFadeTimeout = useCallback(() => {
    if (idleFadeTimeoutRef.current !== null) {
      window.clearTimeout(idleFadeTimeoutRef.current)
      idleFadeTimeoutRef.current = null
    }
  }, [])

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const lockBodyScroll = useCallback(() => {
    if (bodyScrollLockedRef.current) return

    bodyScrollYRef.current = window.scrollY || window.pageYOffset || 0
    document.body.classList.add('mobile-nav-open')
    document.documentElement.classList.add('mobile-nav-open')
    document.body.style.position = 'fixed'
    document.body.style.top = `-${bodyScrollYRef.current}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    bodyScrollLockedRef.current = true
  }, [])

  const unlockBodyScroll = useCallback((restoreScroll: boolean) => {
    if (
      !bodyScrollLockedRef.current &&
      !document.body.classList.contains('mobile-nav-open') &&
      !document.documentElement.classList.contains('mobile-nav-open')
    ) {
      skipBodyScrollRestoreRef.current = false
      return
    }

    const restoreY = bodyScrollYRef.current

    document.body.classList.remove('mobile-nav-open')
    document.documentElement.classList.remove('mobile-nav-open')
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
    bodyScrollLockedRef.current = false

    if (restoreScroll) {
      window.scrollTo({ left: 0, top: restoreY, behavior: 'auto' })
    }

    skipBodyScrollRestoreRef.current = false
  }, [])

  const setNavDimmedState = useCallback((next: boolean) => {
    if (navDimmedRef.current === next) return
    navDimmedRef.current = next
    setNavDimmed(next)
  }, [])

  const setNavTopFocusState = useCallback((next: boolean) => {
    if (navTopFocusRef.current === next) return
    navTopFocusRef.current = next
    setNavTopFocus(next)
  }, [])

  const canIdleRelax = useCallback(() => {
    return !overlayOpenRef.current && !navHoveringRef.current
  }, [])

  const canAutoDim = useCallback(() => {
    const y = window.scrollY || window.pageYOffset || 0
    return canIdleRelax() && y > 120
  }, [canIdleRelax])

  const scheduleIdleFade = useCallback((delayMs = NAV_IDLE_FADE_DELAY_MS) => {
    clearIdleFadeTimeout()
    if (!canIdleRelax()) return
    idleFadeTimeoutRef.current = window.setTimeout(() => {
      idleFadeTimeoutRef.current = null
      if (!canIdleRelax()) return
      setNavTopFocusState(false)
      setNavDimmedState(canAutoDim())
    }, delayMs)
  }, [NAV_IDLE_FADE_DELAY_MS, canAutoDim, canIdleRelax, clearIdleFadeTimeout, setNavDimmedState, setNavTopFocusState])

  useEffect(() => {
    navDimmedRef.current = navDimmed
  }, [navDimmed])

  useEffect(() => {
    navTopFocusRef.current = navTopFocus
  }, [navTopFocus])

  useEffect(() => {
    overlayOpenRef.current = overlayOpen
  }, [overlayOpen])

  useEffect(() => () => clearIdleFadeTimeout(), [clearIdleFadeTimeout])
  useEffect(() => () => clearCloseTimer(), [clearCloseTimer])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    const saved = localStorage.getItem('turtleshell-lang') as Lang | null
    const docLang = document.documentElement.getAttribute('lang') as Lang | null
    const initialLang = saved && saved in LANG_META
      ? saved
      : (docLang && docLang in LANG_META ? docLang : 'en')

    const initialLangFrame = window.requestAnimationFrame(() => {
      setLang((current) => (current === initialLang ? current : initialLang))
    })

    const onLang = (e: Event) => {
      const l = (e as CustomEvent<string>).detail as Lang
      if (LANG_META[l]) setLang(l)
    }
    window.addEventListener('turtleshell-lang-change', onLang)
    return () => {
      window.cancelAnimationFrame(initialLangFrame)
      window.removeEventListener('turtleshell-lang-change', onLang)
    }
  }, [])

  useEffect(() => {
    if (!langOpen && !userOpen) return
    const h = (e: PointerEvent) => {
      const target = e.target as Node
      if (langOpen && !langRef.current?.contains(target)) setLangOpen(false)
      if (userOpen && !userRef.current?.contains(target)) setUserOpen(false)
    }

    document.addEventListener('pointerdown', h)
    return () => document.removeEventListener('pointerdown', h)
  }, [langOpen, userOpen])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const h = (e: MediaQueryListEvent) => {
      if (!e.matches) {
        clearCloseTimer()
        setMobileClosing(false)
        setMobileVisible(false)
        setMobileOpen(false)
        setLangOpen(false)
        setUserOpen(false)
      }
    }
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [clearCloseTimer])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileVisible) {
          setMobileClosing(true)
          clearCloseTimer()
          closeTimerRef.current = window.setTimeout(() => {
            closeTimerRef.current = null
            setMobileClosing(false)
            setMobileVisible(false)
            setMobileOpen(false)
          }, MOBILE_NAV_ANIM_MS)
          return
        }
        setLangOpen(false)
        setUserOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [MOBILE_NAV_ANIM_MS, clearCloseTimer, mobileVisible])

  useEffect(() => {
    if (mobileOpen) {
      lockBodyScroll()
      return
    }

    unlockBodyScroll(!skipBodyScrollRestoreRef.current)
  }, [lockBodyScroll, mobileOpen, unlockBodyScroll])

  useEffect(() => () => unlockBodyScroll(false), [unlockBodyScroll])

  useEffect(() => {
    const onScroll = () => {
      if (scrollRafRef.current !== null) return

      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null

        const currentY = window.scrollY || window.pageYOffset || 0
        const moved = Math.abs(currentY - lastScrollYRef.current) > 1

        if (overlayOpenRef.current) {
          clearIdleFadeTimeout()
          setNavTopFocusState(false)
          setNavDimmedState(false)
          lastScrollYRef.current = currentY
          return
        }

        if (moved) {
          setNavTopFocusState(true)
          setNavDimmedState(false)
          scheduleIdleFade(NAV_IDLE_FADE_DELAY_MS)
        } else if (currentY < 72) {
          setNavDimmedState(false)
        }

        lastScrollYRef.current = currentY
      })
    }

    lastScrollYRef.current = window.scrollY || window.pageYOffset || 0
    onScroll()

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current)
        scrollRafRef.current = null
      }
    }
  }, [NAV_IDLE_FADE_DELAY_MS, clearIdleFadeTimeout, scheduleIdleFade, setNavDimmedState, setNavTopFocusState])

  function revealNav() {
    if (overlayOpenRef.current) return
    setNavTopFocusState(true)
    setNavDimmedState(false)
    scheduleIdleFade()
  }

  function handleNavMouseEnter() {
    if (overlayOpenRef.current) return
    navHoveringRef.current = true
    clearIdleFadeTimeout()
    setNavTopFocusState(true)
    setNavDimmedState(false)
  }

  function handleNavMouseLeave() {
    navHoveringRef.current = false
    scheduleIdleFade(NAV_IDLE_FADE_DELAY_MS)
  }

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark'
    setIsDark((value) => !value)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('turtleshell-theme', next)
  }

  function selectLang(l: Lang) {
    setLang(l)
    setLangOpen(false)
    setUserOpen(false)
    ;(window as Window & { setLanguage?: (l: string) => void }).setLanguage?.(l)
  }

  function closeMobileMenu(immediateOrEvent: boolean | ReactMouseEvent<HTMLElement> = false) {
    const immediate = typeof immediateOrEvent === 'boolean' ? immediateOrEvent : false
    setLangOpen(false)
    setUserOpen(false)
    if (mobileOpen) {
      setMobileOpen(false)
    }
    if (immediate) {
      clearCloseTimer()
      setMobileClosing(false)
      setMobileVisible(false)
      return
    }
    if (!mobileVisible || mobileClosing) return
    setMobileClosing(true)
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      setMobileClosing(false)
      setMobileVisible(false)
    }, MOBILE_NAV_ANIM_MS)
  }

  function closeMobileMenuForNavigation() {
    skipBodyScrollRestoreRef.current = true
    closeMobileMenu(true)
  }

  function toggleMobileMenu() {
    if (mobileVisible) {
      closeMobileMenu()
      return
    }
    clearCloseTimer()
    setMobileClosing(false)
    setMobileVisible(true)
    clearIdleFadeTimeout()
    setNavTopFocusState(false)
    setNavDimmedState(false)
    setUserOpen(false)
    setLangOpen(false)
    setMobileOpen(true)
  }

  function openContact() {
    closeMobileMenuForNavigation()
    window.location.href = '/contact'
  }

  const meta = LANG_META[lang]
  const themeToggleLabel = isDark ? THEME_TOGGLE_LABEL_BY_LANG[lang].dark : THEME_TOGGLE_LABEL_BY_LANG[lang].light
  const portalTarget = typeof document !== 'undefined' ? document.body : null
  const mobileNav = mobileVisible && portalTarget
    ? createPortal(
      <div className={`mobile-nav-overlay ${mobileClosing ? 'is-closing' : 'is-open'}`} role="dialog" aria-modal="true" aria-label="Mobile navigation">
        <button type="button" className="mobile-nav-backdrop" aria-label="Close menu" onClick={closeMobileMenu} />
        <section
          className="mobile-nav-sheet"
          id="mobileNavSheet"
          role="document"
          dir="ltr"
          lang={lang}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeMobileMenu()
          }}
        >
          <section className="mobile-nav-section">
            <p className="mobile-nav-section-title" data-i18n="nav_navigation">Navigation</p>
            <div className="mobile-nav-links">
              <Link href="/#services" className="mobile-nav-link" data-i18n="nav_services" onClick={closeMobileMenuForNavigation}>
                Services
              </Link>
              <Link href="/#about" className="mobile-nav-link" data-i18n="nav_about" onClick={closeMobileMenuForNavigation}>
                About
              </Link>
              <button type="button" className="mobile-nav-link" data-i18n="nav_contact" onClick={openContact}>
                Contact
              </button>
              {resolvedUser ? (
                <Link href="/systems" className="mobile-nav-link mobile-nav-link-cta" data-i18n="nav_dashboard" onClick={closeMobileMenuForNavigation}>
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className="mobile-nav-link mobile-nav-link-cta" data-i18n="nav_login" onClick={closeMobileMenuForNavigation}>
                  Login
                </Link>
              )}
            </div>
          </section>

          {resolvedUser && (
            <section className="mobile-nav-section">
              <p className="mobile-nav-section-title" data-i18n="nav_account">Account</p>
              <div className="mobile-nav-account-box">
                <div className="mobile-nav-account-user">
                  <span className="mobile-nav-account-avatar">{(resolvedName || 'A').charAt(0).toUpperCase()}</span>
                  <div className="mobile-nav-account-meta">
                    <span className="mobile-nav-account-name">{resolvedUser.user_metadata?.full_name || resolvedUser.email?.split('@')[0]}</span>
                    <span className="mobile-nav-account-email">{resolvedUser.email}</span>
                  </div>
                </div>
                <div className="mobile-nav-links">
                  <Link href="/account" className="mobile-nav-link" data-i18n="nav_account_settings" onClick={closeMobileMenuForNavigation}>
                    Account settings
                  </Link>
                  <form action="/auth/signout" method="post">
                    <button type="submit" className="mobile-nav-link mobile-nav-signout" data-i18n="nav_signout">
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </section>
          )}

          <section className="mobile-nav-section">
            <p className="mobile-nav-section-title">{THEME_SECTION_TITLE_BY_LANG[lang]}</p>
            <button
              type="button"
              className="mobile-nav-theme mobile-nav-theme--row"
              aria-label="Toggle dark mode"
              onClick={toggleTheme}
            >
              <span className="mobile-nav-theme-label">{themeToggleLabel}</span>
              <span className="theme-toggle" aria-hidden="true">
                <span className="toggle-track">
                  <span className="toggle-icon sun">&#9728;&#65039;</span>
                  <span className="toggle-icon moon">&#127769;</span>
                </span>
                <span className="toggle-thumb" />
              </span>
            </button>
          </section>

          <section className="mobile-nav-section">
            <p className="mobile-nav-section-title">{LANGUAGE_SECTION_TITLE_BY_LANG[lang]}</p>
            <div className="mobile-nav-preferences">
              <div className="mobile-nav-lang-grid" role="listbox" aria-label="Language options">
                {(Object.entries(LANG_META) as [Lang, typeof LANG_META[Lang]][]).map(([l, m]) => (
                  <button
                    key={l}
                    className={`mobile-nav-lang-option${lang === l ? ' active' : ''}`}
                    type="button"
                    role="option"
                    aria-selected={lang === l}
                    onClick={() => selectLang(l)}
                  >
                    <img className="lang-flag" src={m.flag} alt={m.alt} />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </section>
      </div>,
      portalTarget
    )
    : null

  if (pathname?.startsWith('/auth/google')) {
    return null
  }

  return (
    <>
      <nav
        className={`nav${navTopFocus && !overlayOpen ? ' nav--top-focus' : ''}${navDimmed && !overlayOpen ? ' nav--dimmed' : ''}${mobileOpen ? ' nav--mobile-open' : ''}`}
        id="navbar"
        ref={navRef}
        onMouseEnter={handleNavMouseEnter}
        onMouseLeave={handleNavMouseLeave}
        onFocusCapture={revealNav}
        onTouchStart={revealNav}
        onClickCapture={revealNav}
      >
        <div className="nav-inner">
          <div className="nav-logo-box">
            <Link className="nav-logo" href="/#hero" onClick={closeMobileMenuForNavigation}>
              <picture>
                <source srcSet="/TURTLESHELL-LOGO.webp" type="image/webp" />
                <img className="nav-logo-icon" src="/TURTLESHELL-LOGO.png" alt="TURTLESHELL Logo" />
              </picture>
              <span className="nav-logo-text">TURTLESHELL</span>
            </Link>
          </div>

          <div className="nav-links-box">
            <ul className="nav-links" id="navLinks">
            <li>
              <Link href="/#services" data-i18n="nav_services">
                Services
              </Link>
            </li>
            <li>
              <Link href="/#about" data-i18n="nav_about">
                About
              </Link>
            </li>
            <li>
              <a
                href="#"
                id="navContactLink"
                data-i18n="nav_contact"
                onClick={(e) => {
                  e.preventDefault()
                  openContact()
                }}
              >
                Contact
              </a>
            </li>
            <li>
              {resolvedUser ? (
                <Link href="/systems" className="nav-cta-link" data-i18n="nav_dashboard">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className="nav-cta-link" data-i18n="nav_login">
                  Login
                </Link>
              )}
            </li>
            </ul>
          </div>

          <div className="nav-controls-box">
            {resolvedUser && (
              <div className={`nav-user-menu${userOpen ? ' open' : ''}`} ref={userRef} id="navUserMenu">
                <button
                  className="nav-user-trigger"
                  id="navUserTrigger"
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={userOpen}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!userOpen) setLangOpen(false)
                    setUserOpen((open) => !open)
                  }}
                >
                  <span className="nav-user-avatar">{(resolvedName || 'A').charAt(0).toUpperCase()}</span>
                  <span className="nav-user-label" title={accountLabelFull}>
                    {accountLabelShort}
                  </span>
                  <span className="lang-chevron">&#9662;</span>
                </button>
                <div className={`nav-user-dropdown${userOpen ? ' open' : ''}`} id="navUserDropdown">
                  <div className="nav-user-info">
                    <span className="nav-user-name">{resolvedUser.user_metadata?.full_name || resolvedUser.email?.split('@')[0]}</span>
                    <span className="nav-user-email">{resolvedUser.email}</span>
                  </div>
                  <div className="nav-user-divider" />
                  <Link href="/account" className="nav-user-item" data-i18n="nav_account_settings">
                    Account settings
                  </Link>
                  <form action="/auth/signout" method="post" style={{ margin: 0 }}>
                    <button type="submit" className="nav-user-item nav-user-signout" data-i18n="nav_signout">
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            )}

            <div className={`lang-picker${langOpen ? ' open' : ''}`} ref={langRef} id="langPicker">
              <button
                className="lang-picker-trigger"
                id="langPickerTrigger"
                type="button"
                aria-label="Select Language"
                aria-haspopup="listbox"
                aria-expanded={langOpen}
                onClick={(e) => {
                  e.stopPropagation()
                  setUserOpen(false)
                  setLangOpen((open) => !open)
                }}
              >
                <img className="lang-flag" id="langCurrentFlag" src={meta.flag} alt={meta.alt} />
                <span className="lang-current-code" id="langCurrentCode">{meta.label}</span>
                <span className="lang-chevron">&#9662;</span>
              </button>
              <div className="lang-menu" id="langMenu" role="listbox" aria-label="Language options">
                {(Object.entries(LANG_META) as [Lang, typeof LANG_META[Lang]][]).map(([l, m]) => (
                  <button
                    key={l}
                    className={`lang-option${lang === l ? ' active' : ''}`}
                    type="button"
                    role="option"
                    data-lang={l}
                    aria-selected={lang === l}
                    onClick={() => selectLang(l)}
                  >
                    <img className="lang-flag" src={m.flag} alt={m.alt} />
                    <span className="lang-option-code">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button className="nav-mobile-theme-hitarea" aria-label="Toggle dark mode" type="button" onClick={toggleTheme}>
              <span className="theme-toggle" id="themeToggle" aria-hidden="true">
                <span className="toggle-track">
                  <span className="toggle-icon sun">&#9728;&#65039;</span>
                  <span className="toggle-icon moon">&#127769;</span>
                </span>
                <span className="toggle-thumb" />
              </span>
            </button>
          </div>

          <button className={`mobile-menu-btn${mobileOpen ? ' is-open' : ''}`} id="mobileMenuBtn"
            type="button" aria-label="Toggle menu" aria-controls="mobileNavSheet" aria-expanded={mobileOpen}
            onClick={(e) => { e.stopPropagation(); toggleMobileMenu() }}>
            <span className="mobile-menu-bars" aria-hidden="true"><span /><span /><span /></span>
          </button>
        </div>
      </nav>
      {mobileNav}
    </>
  )
}
