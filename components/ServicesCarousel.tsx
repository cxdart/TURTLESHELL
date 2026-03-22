'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const CARDS = [
  { id: 'cardNexus', service: 'NEXUS', icon: '\uD83E\uDD16', glowMod: '',
    sub: 'card_nexus_sub', subDef: 'Automation Infrastructure',
    title: 'card_nexus_title', titleDef: 'NEXUS',
    desc: 'card_nexus_desc', descDef: 'Custom automation systems built for your workflow, hosted, monitored, and maintained.',
    cta: 'card_nexus_cta', ctaDef: 'Request NEXUS' },
  { id: 'cardAtlas', service: 'ATLAS', icon: '\uD83C\uDF10', glowMod: 'flyer-glow--atlas',
    sub: 'card_atlas_sub', subDef: 'Web Infrastructure',
    title: 'card_atlas_title', titleDef: 'ATLAS',
    desc: 'card_atlas_desc', descDef: 'Modern websites and web systems, landing pages, business sites, dashboards, and custom platforms.',
    cta: 'card_atlas_cta', ctaDef: 'Start ATLAS' },
  { id: 'cardGenos', service: 'GENOS', icon: '\uD83D\uDCF1', glowMod: 'flyer-glow--genos',
    sub: 'card_genos_sub', subDef: 'Mobile Infrastructure',
    title: 'card_genos_title', titleDef: 'GENOS',
    desc: 'card_genos_desc', descDef: 'Native and cross-platform mobile applications, built, deployed, and maintained for your business.',
    cta: 'card_genos_cta', ctaDef: 'Build with GENOS' },
] as const

type Idx = 0 | 1 | 2
const N = CARDS.length

function wrap(i: number): Idx { return (((i % N) + N) % N) as Idx }

function rel(i: number, active: Idx) {
  let d = i - active
  if (d > N / 2) d -= N
  if (d < -N / 2) d += N
  return d
}

type Metrics = { sideX: number; sideAngle: number; sideScale: number; frontDepth: number; sideDepth: number; hiddenDepth: number; hiddenScale: number; sideOpacity: number }

function calcMetrics(sceneW: number, cardW: number): Metrics {
  const c = window.innerWidth <= 768
  return {
    sideX:      Math.min(sceneW * (c ? 0.24 : 0.305), cardW * (c ? 0.88 : 1.08)),
    sideAngle:  c ? 26 : 32, sideScale: c ? 0.9 : 0.92,
    frontDepth: c ? 34 : 58, sideDepth: c ? -20 : -40,
    hiddenDepth: c ? -80 : -120, hiddenScale: c ? 0.82 : 0.84,
    sideOpacity: c ? 0.74 : 0.84,
  }
}

function cardCSS(offset: number, m: Metrics): React.CSSProperties {
  const b = 'translate(-50%,-50%)'
  if (offset === 0)  return { transform: `${b} translateX(0) translateZ(${m.frontDepth}px) rotateY(0deg) scale(1)`, opacity: 1, zIndex: 150, pointerEvents: 'auto' }
  if (offset === -1) return { transform: `${b} translateX(-${m.sideX}px) translateZ(${m.sideDepth}px) rotateY(${m.sideAngle}deg) scale(${m.sideScale})`, opacity: m.sideOpacity, zIndex: 140, pointerEvents: 'auto' }
  if (offset === 1)  return { transform: `${b} translateX(${m.sideX}px) translateZ(${m.sideDepth}px) rotateY(-${m.sideAngle}deg) scale(${m.sideScale})`, opacity: m.sideOpacity, zIndex: 140, pointerEvents: 'auto' }
  const dir = offset < 0 ? -1 : 1
  return { transform: `${b} translateX(${dir * m.sideX * 1.35}px) translateZ(${m.hiddenDepth}px) scale(${m.hiddenScale})`, opacity: 0, zIndex: 120, pointerEvents: 'none' }
}

export default function ServicesCarousel() {
  const [active,  setActive]  = useState<Idx>(0)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const ringRef  = useRef<HTMLDivElement>(null)
  const ptrState = useRef<{ id: number | null; x: number; y: number }>({ id: null, x: 0, y: 0 })

  const refreshMetrics = useCallback(() => {
    const s = sceneRef.current; const r = ringRef.current
    if (!s || !r) return
    const card = r.querySelector('.flyer-card') as HTMLElement | null
    setMetrics(calcMetrics(s.clientWidth, card?.offsetWidth ?? 260))
  }, [])

  useEffect(() => {
    refreshMetrics()
    let t: ReturnType<typeof setTimeout>
    const h = () => { clearTimeout(t); t = setTimeout(refreshMetrics, 120) }
    window.addEventListener('resize', h)

    // Register with the global reveal observer so the carousel fades in correctly
    const el = document.getElementById('serviceCarousel')
    const observer = (window as Window & { __revealObserver?: IntersectionObserver }).__revealObserver
    if (el && observer) observer.observe(el)

    return () => { window.removeEventListener('resize', h); clearTimeout(t) }
  }, [refreshMetrics])

  useEffect(() => {
    ;(window as Window & { carouselGoTo?: (i: number) => void }).carouselGoTo = (i) => setActive(wrap(i))
    return () => { delete (window as Window & { carouselGoTo?: (i: number) => void }).carouselGoTo }
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  setActive(a => wrap(a - 1))
      if (e.key === 'ArrowRight') setActive(a => wrap(a + 1))
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  function openContact(service: string) {
    window.dispatchEvent(new CustomEvent('turtleshell-open-contact', { detail: { service } }))
  }

  function onSceneClick(e: React.MouseEvent<HTMLDivElement>) {
    const card = (e.target as Element).closest('.flyer-card') as HTMLElement | null
    if (card) {
      const i = CARDS.findIndex(c => c.id === card.id)
      if (i === -1) return
      if (i === active) openContact(CARDS[i].service); else setActive(i as Idx)
      return
    }
    const rect = sceneRef.current!.getBoundingClientRect()
    const rel2 = e.clientX - rect.left - rect.width / 2
    if (Math.abs(rel2) < rect.width * 0.12) return
    setActive(a => wrap(a + (rel2 < 0 ? -1 : 1)))
  }

  function onPtrDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' || window.innerWidth <= 900) return
    ptrState.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
    sceneRef.current?.setPointerCapture(e.pointerId)
  }
  function onPtrUp(e: React.PointerEvent<HTMLDivElement>) {
    const s = ptrState.current; if (e.pointerId !== s.id) return
    const dx = e.clientX - s.x; const dy = e.clientY - s.y
    ptrState.current.id = null
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) setActive(a => wrap(a + (dx > 0 ? -1 : 1)))
  }

  return (
    <div className="carousel reveal" id="serviceCarousel">
      <button className="carousel-arrow carousel-arrow-left" id="carouselPrev" aria-label="Previous"
        onClick={() => setActive(a => wrap(a - 1))}>&#8249;</button>

      <div className="carousel-scene" ref={sceneRef} onClick={onSceneClick}
        onPointerDown={onPtrDown} onPointerUp={onPtrUp}
        onPointerCancel={() => { ptrState.current.id = null }}>
        <div className="carousel-ring" id="carouselRing" ref={ringRef}>
          {CARDS.map((c, i) => {
            const offset = metrics ? rel(i, active) : 0
            const style  = metrics ? cardCSS(offset, metrics) : { opacity: 0 }
            return (
              <div key={c.id} id={c.id} className={`flyer-card${i === active ? ' is-front' : ''}`} style={style}>
                <div className={`flyer-glow${c.glowMod ? ' ' + c.glowMod : ''}`} />
                <div className="flyer-icon">{c.icon}</div>
                <div className="flyer-subtitle" data-i18n={c.sub}>{c.subDef}</div>
                <h3 data-i18n={c.title}>{c.titleDef}</h3>
                <p data-i18n={c.desc}>{c.descDef}</p>
                <span className="flyer-action">
                  <span data-i18n={c.cta}>{c.ctaDef}</span>{' '}
                  <span className="arrow">&#8594;</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <button className="carousel-arrow carousel-arrow-right" id="carouselNext" aria-label="Next"
        onClick={() => setActive(a => wrap(a + 1))}>&#8250;</button>

      <div className="carousel-dots" id="carouselDots">
        {CARDS.map((_, i) => (
          <button key={i} className={`carousel-dot${i === active ? ' active' : ''}`}
            aria-label={`Go to slide ${i + 1}`} onClick={() => setActive(i as Idx)} />
        ))}
      </div>
    </div>
  )
}
