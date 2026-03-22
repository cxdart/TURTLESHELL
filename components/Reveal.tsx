'use client'

import { useEffect, useRef } from 'react'

interface RevealProps {
  children: React.ReactNode
  className?: string
  id?: string
}

/**
 * Reveal — wraps any content in a div.reveal and triggers the
 * `visible` class via IntersectionObserver, exactly matching
 * the logic that was previously in app.js.
 */
export default function Reveal({ children, className, id }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const isLite = document.documentElement.classList.contains('performance-lite')

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          return
        }
        // Only un-reveal when element is clearly off-screen
        const { top, bottom } = entry.boundingClientRect
        if (top > window.innerHeight * 0.12 || bottom < 0) {
          entry.target.classList.remove('visible')
        }
      },
      {
        threshold:  isLite ? 0.08 : 0.14,
        rootMargin: isLite ? '0px 0px -6% 0px' : '0px 0px -10% 0px',
      }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={['reveal', className].filter(Boolean).join(' ')}
      id={id}
    >
      {children}
    </div>
  )
}
