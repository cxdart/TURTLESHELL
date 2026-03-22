'use client'

import { useEffect, useState } from 'react'

export function useRuntimeLanguage() {
  // Keep initial client render deterministic with server output to avoid
  // hydration text/dir mismatches. Runtime language is synced after mount.
  const [lang, setLang] = useState<string>('en')

  useEffect(() => {
    const syncLang = () => {
      const stored = localStorage.getItem('turtleshell-lang')
      const docLang = document.documentElement.lang
      setLang((stored || docLang || 'en').toLowerCase())
    }

    syncLang()

    // Keep in sync whenever the language is switched
    window.addEventListener('turtleshell-lang-change', syncLang)
    return () => window.removeEventListener('turtleshell-lang-change', syncLang)
  }, [])

  return lang
}
