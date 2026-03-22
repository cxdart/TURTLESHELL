'use client'

import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useRuntimeLanguage } from '@/lib/use-runtime-language'
import PageHeader from '@/components/PageHeader'
import styles from './NexusPageClient.module.css'

type Bot = {
  id: string
  bot_name: string
  bot_slug: string
  status: string
  description?: string | null
}

type NexusPageClientProps = {
  bots: Bot[]
}

const COPY = {
  en: {
    back: '\u2190 Back to Systems',
    badge: 'NEXUS',
    title: 'Automation Infrastructure',
    subtitle: 'Your active automation bots and workflows.',
    line1: 'Automate.',
    line2: 'Orchestrate.',
    line3: 'Control.',
    statBots: 'Active bots',
    statCoverage: 'Workflow coverage',
    statSupport: 'Support window',
    emptyTitle: 'No bots assigned yet',
    emptyDesc: 'Your automation bots will appear here once configured.',
    botTag: 'NEXUS BOT',
    botDescFallback: 'Custom automation bot running 24/7.',
    active: 'Active',
    paused: 'Paused',
    standby: 'Standby',
    open: 'Open',
    carouselLabel: 'NEXUS Bots Carousel',
    prevBot: 'Previous bot',
    nextBot: 'Next bot',
  },
  ar: {
    back: '\u2192 \u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0627\u0644\u0623\u0646\u0638\u0645\u0629',
    badge: '\u0646\u064a\u0643\u0633\u0648\u0633',
    title: '\u0628\u0646\u064a\u0629 \u0627\u0644\u0623\u062a\u0645\u062a\u0629',
    subtitle: '\u0631\u0648\u0628\u0648\u062a\u0627\u062a\u0643 \u0627\u0644\u0646\u0634\u0637\u0629 \u0648\u0633\u064a\u0631 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u062e\u0627\u0635 \u0628\u0643.',
    line1: '\u0623\u062a\u0645\u062a\u0629.',
    line2: '\u062a\u0646\u0633\u064a\u0642.',
    line3: '\u062a\u062d\u0643\u0645.',
    statBots: '\u0627\u0644\u0631\u0648\u0628\u0648\u062a\u0627\u062a \u0627\u0644\u0646\u0634\u0637\u0629',
    statCoverage: '\u062a\u063a\u0637\u064a\u0629 \u0633\u064a\u0631 \u0627\u0644\u0639\u0645\u0644',
    statSupport: '\u0646\u0627\u0641\u0630\u0629 \u0627\u0644\u062f\u0639\u0645',
    emptyTitle: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0631\u0648\u0628\u0648\u062a\u0627\u062a \u0645\u062e\u0635\u0635\u0629 \u0628\u0639\u062f',
    emptyDesc: '\u0633\u062a\u0638\u0647\u0631 \u0631\u0648\u0628\u0648\u062a\u0627\u062a \u0627\u0644\u0623\u062a\u0645\u062a\u0629 \u0627\u0644\u062e\u0627\u0635\u0629 \u0628\u0643 \u0647\u0646\u0627 \u0628\u0645\u062c\u0631\u062f \u0625\u0639\u062f\u0627\u062f\u0647\u0627.',
    botTag: '\u0631\u0648\u0628\u0648\u062a \u0646\u064a\u0643\u0633\u0648\u0633',
    botDescFallback: '\u0631\u0648\u0628\u0648\u062a \u0623\u062a\u0645\u062a\u0629 \u0645\u062e\u0635\u0635 \u064a\u0639\u0645\u0644 \u0639\u0644\u0649 \u0645\u062f\u0627\u0631 \u0627\u0644\u0633\u0627\u0639\u0629.',
    active: '\u0646\u0634\u0637',
    paused: '\u0645\u062a\u0648\u0642\u0641',
    standby: '\u062c\u0627\u0647\u0632',
    open: '\u0641\u062a\u062d',
    carouselLabel: '\u0645\u0639\u0631\u0636 \u0631\u0648\u0628\u0648\u062a\u0627\u062a \u0646\u064a\u0643\u0633\u0648\u0633',
    prevBot: '\u0627\u0644\u0631\u0648\u0628\u0648\u062a \u0627\u0644\u0633\u0627\u0628\u0642',
    nextBot: '\u0627\u0644\u0631\u0648\u0628\u0648\u062a \u0627\u0644\u062a\u0627\u0644\u064a',
  },
} as const

function getStatusLabel(status: string, copy: (typeof COPY)[keyof typeof COPY]) {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return copy.active
    case 'paused':
      return copy.paused
    default:
      return copy.standby
  }
}

export default function NexusPageClient({ bots }: NexusPageClientProps) {
  const lang = useRuntimeLanguage()
  const isRTL = lang === 'ar'
  const copy = COPY[lang as keyof typeof COPY] ?? COPY.en
  const activeCount = bots.filter((bot) => bot.status === 'active').length
  const [activeIndex, setActiveIndex] = useState(0)
  const pointerStartX = useRef<number | null>(null)
  const pointerDeltaX = useRef(0)
  const safeIndex = bots.length === 0 ? 0 : Math.min(activeIndex, bots.length - 1)

  const canSlide = bots.length > 1

  const goNext = () => {
    if (!canSlide) return
    setActiveIndex((prev) => (prev + 1) % bots.length)
  }

  const goPrev = () => {
    if (!canSlide) return
    setActiveIndex((prev) => (prev - 1 + bots.length) % bots.length)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canSlide) return
    pointerStartX.current = event.clientX
    pointerDeltaX.current = 0
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canSlide || pointerStartX.current === null) return
    pointerDeltaX.current = event.clientX - pointerStartX.current
  }

  const handlePointerEnd = () => {
    if (!canSlide || pointerStartX.current === null) return

    const delta = pointerDeltaX.current
    if (Math.abs(delta) > 44) {
      if (delta < 0) goNext()
      else goPrev()
    }

    pointerStartX.current = null
    pointerDeltaX.current = 0
  }

  return (
    <div className="systems-page systems-page--nexus" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="systems-page-orb systems-page-orb--one" aria-hidden="true" />
      <div className="systems-page-orb systems-page-orb--two" aria-hidden="true" />

      <div className="systems-shell">
        <aside className="systems-brand-panel" aria-hidden="true">
          <span className="systems-brand-badge">{copy.badge}</span>
          <div className="systems-brand-lockup">
            <img className="systems-brand-logo" src="/TURTLESHELL-LOGO.png" alt="" />
            <span className="systems-brand-wordmark">TURTLESHELL</span>
          </div>

          <div className="systems-brand-display">
            <span>{copy.line1}</span>
            <span>{copy.line2}</span>
            <span>{copy.line3}</span>
          </div>

          <p className="systems-brand-copy">{copy.subtitle}</p>

          <div className="systems-brand-stats">
            <div className="systems-brand-stat">
              <strong>{activeCount || 0}</strong>
              <span>{copy.statBots}</span>
            </div>
            <div className="systems-brand-stat">
              <strong>24/7</strong>
              <span>{copy.statSupport}</span>
            </div>
            <div className="systems-brand-stat">
              <strong>100%</strong>
              <span>{copy.statCoverage}</span>
            </div>
          </div>
        </aside>

        <section className="systems-main-panel">
          <PageHeader
            variant="compact"
            backHref="/systems"
            backLabel={copy.back}
            badge={copy.badge}
            title={copy.title}
            description={copy.subtitle}
          />

          <div className={styles.botCarouselArea}>
            {bots.length === 0 ? (
              <div className="systems-empty">
                <div className="systems-empty-icon">{'\u{1F916}'}</div>
                <h3>{copy.emptyTitle}</h3>
                <p>{copy.emptyDesc}</p>
              </div>
            ) : (
              <div className={styles.botCarousel} role="region" aria-label={copy.carouselLabel}>
                {canSlide && (
                  <button
                    type="button"
                    className={`${styles.botCarouselArrow} ${styles.botCarouselArrowLeft}`}
                    aria-label={copy.prevBot}
                    onClick={goPrev}
                  >
                    {isRTL ? '\u2192' : '\u2190'}
                  </button>
                )}

                <div
                  className={styles.botCarouselViewport}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                >
                  <div
                    className={styles.botCarouselTrack}
                    style={{ transform: `translateX(-${safeIndex * 100}%)` }}
                  >
                    {bots.map((bot) => (
                      <div key={bot.id} className={styles.botCarouselSlide}>
                        <a
                          href={`/systems/nexus/${bot.bot_slug}`}
                          className="systems-card systems-card--active systems-card-link"
                          style={{ '--svc-accent': 'var(--accent)' } as React.CSSProperties}
                        >
                          <div className="systems-card-accent-line" />
                          <div className="systems-card-icon">{'\u{1F916}'}</div>
                          <div className="systems-card-tag">{copy.botTag}</div>
                          <h3 className="systems-card-title">{bot.bot_name}</h3>
                          <p className="systems-card-desc">{bot.description || copy.botDescFallback}</p>
                          <div className="systems-card-status">
                            <span className={`status-dot status-dot--${bot.status}`}></span>
                            <span className="status-label">{getStatusLabel(bot.status, copy)}</span>
                          </div>
                          <span className="systems-card-btn systems-card-btn--active glass-btn glass-btn-primary">
                            {copy.open} {bot.bot_name} <span>{isRTL ? '\u2190' : '\u2192'}</span>
                          </span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {canSlide && (
                  <button
                    type="button"
                    className={`${styles.botCarouselArrow} ${styles.botCarouselArrowRight}`}
                    aria-label={copy.nextBot}
                    onClick={goNext}
                  >
                    {isRTL ? '\u2190' : '\u2192'}
                  </button>
                )}

                {canSlide && (
                  <div className={styles.botCarouselDots}>
                    {bots.map((bot, idx) => (
                      <button
                        key={bot.id}
                        type="button"
                        className={`${styles.botCarouselDot}${idx === safeIndex ? ` ${styles.isActive}` : ''}`}
                        aria-label={`${copy.open} ${bot.bot_name}`}
                        aria-current={idx === safeIndex ? 'true' : undefined}
                        onClick={() => setActiveIndex(idx)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
