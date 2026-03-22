'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useRuntimeLanguage } from '@/lib/use-runtime-language'
import { createClient } from '@/lib/supabase/client'
import { buildContactPrefill, type ContactPrefill } from '@/lib/contact-prefill'
import LightButton from '@/components/LightButton'

const COPY = {
  en: {
    close: 'Close',
    badge: '\uD83D\uDC22 Get in touch',
    title: "Let's build something.",
    subtitle: 'Tell us what you need. We reply within 24 hours with a tailored plan.',
    name: 'Your Name',
    email: 'Email',
    phone: 'Phone Number',
    optional: '(optional)',
    project: 'Describe your project',
    email_ph: 'you@example.com',
    phone_ph: '+1 555 000 0000',
    project_ph: 'What do you want to build or automate?',
    solution: 'Choose Your Solution',
    send: 'Send Request',
    whatsapp: 'WhatsApp',
    success_icon: '\uD83D\uDC22',
    success_title: 'Request sent!',
    success_subtitle: "We'll get back to you within 24 hours.",
    success_whatsapp: 'Chat on WhatsApp \u2192',
    services: {
      NEXUS: { name: 'NEXUS', sub: 'AUTOMATION' },
      ATLAS: { name: 'ATLAS', sub: 'WEB SYSTEM' },
      GENOS: { name: 'GENOS', sub: 'MOBILE APP' },
      Other: { name: 'NOT SURE?', sub: "LET'S TALK" },
    },
    options: {
      NEXUS: 'NEXUS Automation',
      ATLAS: 'ATLAS Web System',
      GENOS: 'GENOS Mobile App',
      Both: 'Both',
      Other: 'Not sure yet',
    },
  },
  ar: {
    close: '\u0625\u063a\u0644\u0627\u0642',
    badge: '\uD83D\uDC22 \u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627',
    title: '\u0644\u0646\u0628\u0646\u064a \u0634\u064a\u0626\u064b\u0627 \u0645\u0645\u064a\u0632\u064b\u0627.',
    subtitle:
      '\u0623\u062e\u0628\u0631\u0646\u0627 \u0628\u0645\u0627 \u062a\u062d\u062a\u0627\u062c\u0647. \u0633\u0646\u0631\u062f \u0639\u0644\u064a\u0643 \u062e\u0644\u0627\u0644 24 \u0633\u0627\u0639\u0629 \u0628\u062e\u0637\u0629 \u062a\u0646\u0641\u064a\u0630 \u0648\u0627\u0636\u062d\u0629.',
    name: '\u0627\u0633\u0645\u0643',
    email: '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a',
    phone: '\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641',
    optional: '(\u0627\u062e\u062a\u064a\u0627\u0631\u064a)',
    project: '\u0627\u0634\u0631\u062d \u0645\u0634\u0631\u0648\u0639\u0643',
    email_ph: 'you@example.com',
    phone_ph: '+966 50 000 0000',
    project_ph:
      '\u0645\u0627\u0630\u0627 \u062a\u0631\u064a\u062f \u0623\u0646 \u062a\u0628\u0646\u064a \u0623\u0648 \u062a\u0624\u062a\u0645\u062a\u0647\u061f',
    solution: '\u0627\u062e\u062a\u0631 \u0627\u0644\u062d\u0644 \u0627\u0644\u0645\u0646\u0627\u0633\u0628',
    send: '\u0623\u0631\u0633\u0644 \u0627\u0644\u0637\u0644\u0628',
    whatsapp: '\u0648\u0627\u062a\u0633\u0627\u0628',
    success_icon: '\uD83D\uDC22',
    success_title: '\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628!',
    success_subtitle: '\u0633\u0646\u0639\u0648\u062f \u0625\u0644\u064a\u0643 \u062e\u0644\u0627\u0644 24 \u0633\u0627\u0639\u0629.',
    success_whatsapp: '\u062a\u062d\u062f\u062b \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628 \u2190',
    services: {
      NEXUS: { name: '\u0646\u064a\u0643\u0633\u0648\u0633', sub: '\u0627\u0644\u0623\u062a\u0645\u062a\u0629' },
      ATLAS: { name: '\u0623\u0637\u0644\u0633', sub: '\u0646\u0638\u0627\u0645 \u0648\u064a\u0628' },
      GENOS: { name: '\u062c\u064a\u0646\u0648\u0633', sub: '\u062a\u0637\u0628\u064a\u0642 \u0645\u0648\u0628\u0627\u064a\u0644' },
      Other: { name: '\u063a\u064a\u0631 \u0645\u062a\u0623\u0643\u062f\u061f', sub: '\u0644\u0646\u062a\u062d\u062f\u062b' },
    },
    options: {
      NEXUS: '\u0623\u062a\u0645\u062a\u0629 NEXUS',
      ATLAS: '\u0646\u0638\u0627\u0645 \u0648\u064a\u0628 ATLAS',
      GENOS: '\u062a\u0637\u0628\u064a\u0642 \u0645\u0648\u0628\u0627\u064a\u0644 GENOS',
      Both: '\u0643\u0644\u0627\u0647\u0645\u0627',
      Other: '\u0644\u0633\u062a \u0645\u062a\u0623\u0643\u062f\u064b\u0627 \u0628\u0639\u062f',
    },
  },
  de: {
    close: 'Schliessen',
    badge: '\uD83D\uDC22 Kontakt aufnehmen',
    title: 'Lassen Sie uns etwas bauen.',
    subtitle: 'Sagen Sie uns, was Sie brauchen. Wir antworten innerhalb von 24 Stunden mit einem klaren Plan.',
    name: 'Ihr Name',
    email: 'E-Mail',
    phone: 'Telefonnummer',
    optional: '(optional)',
    project: 'Beschreiben Sie Ihr Projekt',
    email_ph: 'sie@beispiel.de',
    phone_ph: '+49 170 0000000',
    project_ph: 'Was moechten Sie bauen oder automatisieren?',
    solution: 'Waehlen Sie Ihre Loesung',
    send: 'Anfrage senden',
    whatsapp: 'WhatsApp',
    success_icon: '\uD83D\uDC22',
    success_title: 'Anfrage gesendet!',
    success_subtitle: 'Wir melden uns innerhalb von 24 Stunden bei Ihnen.',
    success_whatsapp: 'Bei WhatsApp chatten \u2192',
    services: {
      NEXUS: { name: 'NEXUS', sub: 'AUTOMATISIERUNG' },
      ATLAS: { name: 'ATLAS', sub: 'WEB-SYSTEM' },
      GENOS: { name: 'GENOS', sub: 'MOBILE APP' },
      Other: { name: 'UNSICHER?', sub: 'LASSEN SIE UNS REDEN' },
    },
    options: {
      NEXUS: 'NEXUS Automatisierung',
      ATLAS: 'ATLAS Web-System',
      GENOS: 'GENOS Mobile App',
      Both: 'Beides',
      Other: 'Noch nicht sicher',
    },
  },
  ja: {
    close: '\u9589\u3058\u308b',
    badge: '\uD83D\uDC22 \u304A\u554F\u3044\u5408\u308F\u305B',
    title: '\u4E00\u7DD2\u306B\u4F5C\u308A\u307E\u3057\u3087\u3046\u3002',
    subtitle:
      '\u5FC5\u8981\u306A\u3082\u306E\u3092\u6559\u3048\u3066\u304F\u3060\u3055\u3044\u300224\u6642\u9593\u4EE5\u5185\u306B\u5B9F\u884C\u30D7\u30E9\u30F3\u3092\u3054\u9023\u7D61\u3057\u307E\u3059\u3002',
    name: '\u304A\u540D\u524D',
    email: '\u30E1\u30FC\u30EB',
    phone: '\u96FB\u8A71\u756A\u53F7',
    optional: '(\u4EFB\u610F)',
    project: '\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u5185\u5BB9',
    email_ph: 'you@example.com',
    phone_ph: '+81 90 0000 0000',
    project_ph: '\u4F55\u3092\u69CB\u7BC9\u307E\u305F\u306F\u81EA\u52D5\u5316\u3057\u305F\u3044\u3067\u3059\u304B\uFF1F',
    solution: '\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3\u3092\u9078\u629E',
    send: '\u30EA\u30AF\u30A8\u30B9\u30C8\u3092\u9001\u4FE1',
    whatsapp: 'WhatsApp',
    success_icon: '\uD83D\uDC22',
    success_title: '\u9001\u4FE1\u3055\u308C\u307E\u3057\u305F\uFF01',
    success_subtitle: '24\u6642\u9593\u4EE5\u5185\u306B\u3054\u9023\u7D61\u3057\u307E\u3059\u3002',
    success_whatsapp: 'WhatsApp\u3067\u30C1\u30E3\u30C3\u30C8 \u2192',
    services: {
      NEXUS: { name: 'NEXUS', sub: '\u81EA\u52D5\u5316' },
      ATLAS: { name: 'ATLAS', sub: 'WEB\u30B7\u30B9\u30C6\u30E0' },
      GENOS: { name: 'GENOS', sub: '\u30E2\u30D0\u30A4\u30EB\u30A2\u30D7\u30EA' },
      Other: { name: '\u307E\u3060\u672A\u5B9A\u3067\u3059\u304B\uFF1F', sub: '\u305C\u3072\u3054\u76F8\u8AC7\u304F\u3060\u3055\u3044' },
    },
    options: {
      NEXUS: 'NEXUS \u81EA\u52D5\u5316',
      ATLAS: 'ATLAS Web\u30B7\u30B9\u30C6\u30E0',
      GENOS: 'GENOS \u30E2\u30D0\u30A4\u30EB\u30A2\u30D7\u30EA',
      Both: '\u4E21\u65B9',
      Other: '\u307E\u3060\u6C7A\u3081\u3066\u3044\u307E\u305B\u3093',
    },
  },
} as const

const CARD_ORDER = ['NEXUS', 'ATLAS', 'GENOS', 'Other'] as const
const CARD_ICONS: Record<(typeof CARD_ORDER)[number], string> = {
  NEXUS: '\uD83E\uDD16',
  ATLAS: '\uD83C\uDF10',
  GENOS: '\uD83D\uDCF1',
  Other: '\uD83D\uDCAC',
}

type ContactWindow = Window & {
  __TS_CONTACT_PREFILL?: ContactPrefill
  __applyContactPrefill?: () => void
}

export default function ContactModal() {
  const lang = useRuntimeLanguage()
  const copy = COPY[lang as keyof typeof COPY] || COPY.en
  const isRTL = lang === 'ar'
  const supabase = useMemo(() => createClient(), [])

  const applyPrefill = useCallback((prefill?: ContactPrefill) => {
    const values = prefill ?? (window as ContactWindow).__TS_CONTACT_PREFILL
    if (!values) return

    const nameInput = document.getElementById('contactName') as HTMLInputElement | null
    const emailInput = document.getElementById('contactEmail') as HTMLInputElement | null
    const phoneInput = document.getElementById('contactWhatsapp') as HTMLInputElement | null

    const syncField = (input: HTMLInputElement | null, value: string) => {
      if (!input || !value) return
      input.defaultValue = value
      if (!input.value) input.value = value
    }

    syncField(nameInput, values.name)
    syncField(emailInput, values.email)
    syncField(phoneInput, values.phone)
  }, [])

  useEffect(() => {
    let mounted = true

    const setAndApply = (prefill: ContactPrefill) => {
      ;(window as ContactWindow).__TS_CONTACT_PREFILL = prefill
      applyPrefill(prefill)
    }

    ;(window as ContactWindow).__applyContactPrefill = () => applyPrefill()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return
      setAndApply(buildContactPrefill(user))
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAndApply(buildContactPrefill(session?.user))
    })

    return () => {
      mounted = false
      if ((window as ContactWindow).__applyContactPrefill) {
        delete (window as ContactWindow).__applyContactPrefill
      }
      data.subscription.unsubscribe()
    }
  }, [applyPrefill, supabase])

  return (
    <div className="modal-overlay contact-modal" id="contactModal">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{ position: 'relative' }}
      >
        <button className="modal-close" id="contactModalClose" type="button" aria-label={copy.close}>
          {'\u2715'}
        </button>

        <div id="contactStep1" className="contact-modal-inner">
          <div className="contact-modal-header">
            <span id="contactBadge" className="contact-modal-badge">
              {copy.badge}
            </span>
            <h2 id="contact-modal-title">{copy.title}</h2>
            <p className="modal-subtitle">{copy.subtitle}</p>
          </div>
          <form id="contactForm" className="contact-form-layout">
            <div className="contact-form-main">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contactName">{copy.name}</label>
                  <input type="text" id="contactName" className="form-input" placeholder="turtle123" required />
                </div>
                <div className="form-group contact-phone-group">
                  <label htmlFor="contactWhatsapp">
                    {copy.phone} <span className="label-optional">{copy.optional}</span>
                  </label>
                  <input type="tel" id="contactWhatsapp" className="form-input" placeholder={copy.phone_ph} />
                </div>
              </div>
              <div className="form-group contact-email-group">
                <label htmlFor="contactEmail">{copy.email}</label>
                <input type="email" id="contactEmail" className="form-input" placeholder={copy.email_ph} required />
              </div>
              <div className="form-group contact-message-group">
                <label htmlFor="contactMessage">{copy.project}</label>
                <textarea
                  id="contactMessage"
                  className="form-input"
                  rows={8}
                  placeholder={copy.project_ph}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="contact-form-side">
              <div className="form-group">
                <label htmlFor="contactProject">{copy.solution}</label>
                <div className="contact-service-grid" id="contactServiceGrid">
                  {CARD_ORDER.map((value, index) => (
                    <label
                      key={value}
                      className={`contact-service-card${index === 0 ? ' contact-service-card--selected' : ''}`}
                      data-value={value}
                    >
                      <input
                        type="radio"
                        name="contactService"
                        value={value}
                        defaultChecked={index === 0}
                        style={{ display: 'none' }}
                      />
                      <span className="cscard-icon">{CARD_ICONS[value]}</span>
                      <span className="cscard-copy">
                        <span className="cscard-name">{copy.services[value].name}</span>
                        <span className="cscard-sub">{copy.services[value].sub}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <select id="contactProject" className="form-input" style={{ display: 'none' }}>
                  <option value="NEXUS">{copy.options.NEXUS}</option>
                  <option value="ATLAS">{copy.options.ATLAS}</option>
                  <option value="GENOS">{copy.options.GENOS}</option>
                  <option value="Both">{copy.options.Both}</option>
                  <option value="Other">{copy.options.Other}</option>
                </select>
              </div>

              <div className="contact-submit-wrap">
                <LightButton type="submit" variant="hollow" className="contact-submit-btn">
                  <span>{copy.send}</span> <span className="arrow">{'\u2192'}</span>
                </LightButton>
                <a
                  id="contactWaDirectLink"
                  href="https://wa.me/966558327668"
                  target="_blank"
                  rel="noreferrer"
                  className="contact-direct-btn contact-wa-btn contact-wa-direct-btn"
                >
                  <span>{'\uD83D\uDCAC'}</span>
                  <span>{copy.whatsapp}</span>
                </a>
                <div className="contact-direct-links">
                  <a href="mailto:hello.turtleshell@gmail.com">{'\u2709'} hello.turtleshell@gmail.com</a>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div id="contactStep2" style={{ display: 'none', textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>{copy.success_icon}</div>
          <h2>{copy.success_title}</h2>
          <p className="modal-subtitle" style={{ marginBottom: '28px' }}>
            {copy.success_subtitle}
          </p>
          <LightButton
            id="contactWaSuccessLink"
            href="https://wa.me/966558327668"
            target="_blank"
            rel="noreferrer"
            variant="hollow"
            style={{ display: 'inline-flex' }}
          >
            {copy.success_whatsapp}
          </LightButton>
        </div>
      </div>
    </div>
  )
}

