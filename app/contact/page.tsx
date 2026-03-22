'use client'

import { useRouter } from 'next/navigation'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRuntimeLanguage } from '@/lib/use-runtime-language'
import { createClient } from '@/lib/supabase/client'
import { buildContactPrefill } from '@/lib/contact-prefill'
import LightButton from '@/components/LightButton'

const CONTACT_EMAIL = 'hello.turtleshell@gmail.com'
const WHATSAPP_LINK = 'https://wa.me/966558327668'

const COPY = {
    en: {
        title: 'Contact Us',
        subtitle: 'Tell us what you want to build and we will reply with a clear plan within 24 hours.',
        services_title: 'Choose a service',
        services_subtitle: 'Pick the area that best matches your project.',
        contact_info_title: 'Contact information',
        project_title: 'Describe your project',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        optional: '(optional)',
        project: 'Describe your project',
        email_ph: 'you@example.com',
        phone_ph: '+1 555 000 0000',
        project_ph: 'What would you like to build? What is the goal of your project?',
        send: 'Send message',
        sending: 'Sending...',
        whatsapp: 'Chat on WhatsApp',
        or: 'or',
        direct_email: 'Direct email',
        copy_email: 'Copy email',
        copied_email: 'Copied',
        success_icon: '\uD83D\uDC22',
        success_title: 'Message sent!',
        success_subtitle: "We'll get back to you within 24 hours.",
        success_whatsapp: 'Chat on WhatsApp \u2192',
        services: {
            ATLAS: 'ATLAS',
            NEXUS: 'NEXUS',
            GENOS: 'GENOS',
            Other: 'General inquiry',
        },
        service_desc: {
            ATLAS: 'Business sites & landing pages',
            NEXUS: 'Systems & dashboards',
            GENOS: 'Mobile & applications',
            Other: 'Questions, partnerships, or custom requests',
        },
    },
    ar: {
        title: '\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627',
        subtitle: '\u0627\u062e\u0628\u0631\u0646\u0627 \u0645\u0627\u0630\u0627 \u062a\u0631\u064a\u062f \u0623\u0646 \u062a\u0628\u0646\u064a\u060c \u0648\u0633\u0646\u0631\u062f \u0639\u0644\u064a\u0643 \u0628\u062e\u0637\u0629 \u0648\u0627\u0636\u062d\u0629 \u062e\u0644\u0627\u0644 24 \u0633\u0627\u0639\u0629.',
        services_title: '\u0627\u062e\u062a\u0631 \u0627\u0644\u062e\u062f\u0645\u0629',
        services_subtitle: '\u062d\u062f\u062f \u0627\u0644\u0645\u062c\u0627\u0644 \u0627\u0644\u0623\u0642\u0631\u0628 \u0644\u0645\u0634\u0631\u0648\u0639\u0643.',
        contact_info_title: '\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u062a\u0648\u0627\u0635\u0644',
        project_title: '\u0627\u0634\u0631\u062d \u0645\u0634\u0631\u0648\u0639\u0643',
        name: '\u0627\u0644\u0627\u0633\u0645',
        email: '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a',
        phone: '\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641',
        optional: '(\u0627\u062e\u062a\u064a\u0627\u0631\u064a)',
        project: '\u0627\u0634\u0631\u062d \u0645\u0634\u0631\u0648\u0639\u0643',
        email_ph: 'you@example.com',
        phone_ph: '+966 50 000 0000',
        project_ph: '\u0645\u0627\u0630\u0627 \u062a\u0631\u064a\u062f \u0623\u0646 \u062a\u0628\u0646\u064a\u061f \u0648\u0645\u0627 \u0627\u0644\u0647\u062f\u0641 \u0645\u0646 \u0645\u0634\u0631\u0648\u0639\u0643\u061f',
        send: '\u0623\u0631\u0633\u0644 \u0627\u0644\u0631\u0633\u0627\u0644\u0629',
        sending: '\u062c\u0627\u0631\u064d \u0627\u0644\u0625\u0631\u0633\u0627\u0644...',
        whatsapp: '\u062a\u062d\u062f\u062b \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628',
        or: '\u0623\u0648',
        direct_email: '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0645\u0628\u0627\u0634\u0631',
        copy_email: '\u0646\u0633\u062e \u0627\u0644\u0628\u0631\u064a\u062f',
        copied_email: '\u062a\u0645 \u0627\u0644\u0646\u0633\u062e',
        success_icon: '\uD83D\uDC22',
        success_title: '\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0633\u0627\u0644\u0629!',
        success_subtitle: '\u0633\u0646\u0639\u0648\u062f \u0625\u0644\u064a\u0643 \u062e\u0644\u0627\u0644 24 \u0633\u0627\u0639\u0629.',
        success_whatsapp: '\u062a\u062d\u062f\u062b \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628 \u2190',
        services: {
            ATLAS: 'ATLAS',
            NEXUS: 'NEXUS',
            GENOS: 'GENOS',
            Other: '\u0627\u0633\u062a\u0641\u0633\u0627\u0631 \u0639\u0627\u0645',
        },
        service_desc: {
            ATLAS: '\u0645\u0648\u0627\u0642\u0639 \u0634\u0631\u0643\u0627\u062a \u0648\u0635\u0641\u062d\u0627\u062a \u0647\u0628\u0648\u0637',
            NEXUS: '\u0623\u0646\u0638\u0645\u0629 \u0648\u0644\u0648\u062d\u0627\u062a \u062a\u062d\u0643\u0645',
            GENOS: '\u062a\u0637\u0628\u064a\u0642\u0627\u062a \u0645\u0648\u0628\u0627\u064a\u0644',
            Other: '\u0623\u0633\u0626\u0644\u0629 \u0639\u0627\u0645\u0629 \u0623\u0648 \u0637\u0644\u0628 \u062e\u0627\u0635',
        },
    },
    de: {
        title: 'Kontakt',
        subtitle: 'Beschreiben Sie Ihr Vorhaben, wir antworten innerhalb von 24 Stunden mit einem klaren Plan.',
        services_title: 'Service waehlen',
        services_subtitle: 'Waehlen Sie den Bereich, der am besten passt.',
        contact_info_title: 'Kontaktdaten',
        project_title: 'Projektbeschreibung',
        name: 'Name',
        email: 'E-Mail',
        phone: 'Telefon',
        optional: '(optional)',
        project: 'Projektbeschreibung',
        email_ph: 'sie@beispiel.de',
        phone_ph: '+49 170 0000000',
        project_ph: 'Was moechten Sie bauen? Was ist das Ziel Ihres Projekts?',
        send: 'Nachricht senden',
        sending: 'Wird gesendet...',
        whatsapp: 'WhatsApp Chat',
        or: 'oder',
        direct_email: 'Direkte E-Mail',
        copy_email: 'E-Mail kopieren',
        copied_email: 'Kopiert',
        success_icon: '\uD83D\uDC22',
        success_title: 'Nachricht gesendet!',
        success_subtitle: 'Wir melden uns innerhalb von 24 Stunden.',
        success_whatsapp: 'Bei WhatsApp chatten \u2192',
        services: {
            ATLAS: 'ATLAS',
            NEXUS: 'NEXUS',
            GENOS: 'GENOS',
            Other: 'Allgemeine Anfrage',
        },
        service_desc: {
            ATLAS: 'Business-Websites & Landingpages',
            NEXUS: 'Systeme & Dashboards',
            GENOS: 'Mobile Apps & Anwendungen',
            Other: 'Fragen, Partnerschaften oder Sonderanfragen',
        },
    },
    ja: {
        title: '\u304A\u554F\u3044\u5408\u308F\u305B',
        subtitle: '\u4F5C\u308A\u305F\u3044\u5185\u5BB9\u3092\u6559\u3048\u3066\u304F\u3060\u3055\u3044\u300224\u6642\u9593\u4EE5\u5185\u306B\u8A73\u7D30\u3092\u3054\u8FD4\u4FE1\u3057\u307E\u3059\u3002',
        services_title: '\u30B5\u30FC\u30D3\u30B9\u3092\u9078\u629E',
        services_subtitle: '\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306B\u8FD1\u3044\u9805\u76EE\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044\u3002',
        contact_info_title: '\u9023\u7D61\u60C5\u5831',
        project_title: '\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u5185\u5BB9',
        name: '\u304A\u540D\u524D',
        email: '\u30E1\u30FC\u30EB',
        phone: '\u96FB\u8A71',
        optional: '(\u4EFB\u610F)',
        project: '\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u5185\u5BB9',
        email_ph: 'you@example.com',
        phone_ph: '+81 90 0000 0000',
        project_ph: '\u4F55\u3092\u69CB\u7BC9\u3057\u305F\u3044\u3067\u3059\u304B\uFF1F \u30B4\u30FC\u30EB\u306F\u4F55\u3067\u3059\u304B\uFF1F',
        send: '\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u9001\u4FE1',
        sending: '\u9001\u4FE1\u4E2D...',
        whatsapp: 'WhatsApp\u3067\u30C1\u30E3\u30C3\u30C8',
        or: '\u307E\u305F\u306F',
        direct_email: '\u76F4\u63A5\u30E1\u30FC\u30EB',
        copy_email: '\u30E1\u30FC\u30EB\u3092\u30B3\u30D4\u30FC',
        copied_email: '\u30B3\u30D4\u30FC\u6E08\u307F',
        success_icon: '\uD83D\uDC22',
        success_title: '\u9001\u4FE1\u3055\u308C\u307E\u3057\u305F\uFF01',
        success_subtitle: '24\u6642\u9593\u4EE5\u5185\u306B\u3054\u9023\u7D61\u3057\u307E\u3059\u3002',
        success_whatsapp: 'WhatsApp\u3067\u30C1\u30E3\u30C3\u30C8 \u2192',
        services: {
            ATLAS: 'ATLAS',
            NEXUS: 'NEXUS',
            GENOS: 'GENOS',
            Other: '\u4E00\u822C\u304A\u554F\u3044\u5408\u308F\u305B',
        },
        service_desc: {
            ATLAS: '\u4F01\u696D\u30B5\u30A4\u30C8\u3068\u30E9\u30F3\u30C7\u30A3\u30F3\u30B0\u30DA\u30FC\u30B8',
            NEXUS: '\u30B7\u30B9\u30C6\u30E0\u3068\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9',
            GENOS: '\u30E2\u30D0\u30A4\u30EB\u3068\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3',
            Other: '\u8CEA\u554F\u30FB\u5354\u696D\u30FB\u30AB\u30B9\u30BF\u30E0\u76F8\u8AC7',
        },
    },
} as const

const SERVICE_ORDER = ['ATLAS', 'NEXUS', 'GENOS', 'Other'] as const
type ServiceKey = (typeof SERVICE_ORDER)[number]

const SERVICE_ICONS: Record<ServiceKey, string> = {
    ATLAS: '\uD83C\uDF10',
    NEXUS: '\uD83E\uDD16',
    GENOS: '\uD83D\uDCF1',
    Other: '\uD83D\uDCAC',
}

export default function ContactPage() {
    const lang = useRuntimeLanguage()
    const copy = COPY[lang as keyof typeof COPY] || COPY.en
    const isRTL = lang === 'ar'
    const supabase = useMemo(() => createClient(), [])
    const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle')
    const [selectedService, setSelectedService] = useState<ServiceKey>('Other')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [project, setProject] = useState('')
    const [emailCopied, setEmailCopied] = useState(false)

    useEffect(() => {
        let mounted = true

        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!mounted) return
            const prefill = buildContactPrefill(user)
            setName((prev) => prev || prefill.name)
            setEmail((prev) => prev || prefill.email)
            setPhone((prev) => prev || prefill.phone)
        })

        return () => {
            mounted = false
        }
    }, [supabase])

    useEffect(() => () => {
        if (copyResetTimer.current) {
            clearTimeout(copyResetTimer.current)
        }
    }, [])

    const handleCopyEmail = async () => {
        try {
            await navigator.clipboard.writeText(CONTACT_EMAIL)
            setEmailCopied(true)
            if (copyResetTimer.current) clearTimeout(copyResetTimer.current)
            copyResetTimer.current = setTimeout(() => setEmailCopied(false), 1600)
        } catch {
            window.location.href = `mailto:${CONTACT_EMAIL}`
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('sending')
        try {
            const res = await fetch('/api/contact/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'contact',
                    name,
                    email,
                    phone,
                    project: selectedService,
                    message: project,
                }),
            })
            if (res.status === 401) {
                window.location.href = '/login?message=' + encodeURIComponent('Sign in to send a request')
                return
            }
            if (!res.ok) throw new Error('failed')
            setStatus('success')
        } catch {
            setStatus('idle')
            alert('Something went wrong. Please email us at hello.turtleshell@gmail.com')
        }
    }

    return (
        <>
            <main className="service-page contact-page" dir={isRTL ? 'rtl' : 'ltr'}>
                <section className="section contact-page-section">
                    {status === 'success' ? (
                        <div className="contact-page-success reveal">
                            <div className="contact-success-icon" aria-hidden="true">{copy.success_icon}</div>
                            <h2>{copy.success_title}</h2>
                            <p className="modal-subtitle">{copy.success_subtitle}</p>
                            <LightButton
                                href={WHATSAPP_LINK}
                                target="_blank"
                                rel="noreferrer"
                                variant="hollow"
                                className="contact-page-success-btn"
                            >
                                {copy.success_whatsapp}
                            </LightButton>
                        </div>
                    ) : (
                        <div className="contact-page-wrap reveal">
                            <div className="contact-page-head">
                                <span className="contact-page-eyebrow">TURTLESHELL CONTACT</span>
                                <h1>{copy.title}</h1>
                                <p>{copy.subtitle}</p>
                            </div>

                            <div className="contact-page-card">
                                <form onSubmit={handleSubmit} className="contact-page-form contact-page-form--stack">
                                    <input type="hidden" name="service" value={selectedService} />

                                    <section className="contact-page-group contact-page-group--services">
                                        <div className="contact-page-group-head">
                                            <h2>{copy.services_title}</h2>
                                            <p>{copy.services_subtitle}</p>
                                        </div>

                                        <div className="contact-page-service-grid contact-page-service-grid--enhanced">
                                            {SERVICE_ORDER.map((service) => (
                                                <label
                                                    key={service}
                                                    className={`contact-page-service-card${selectedService === service ? ' is-selected' : ''}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="serviceChoice"
                                                        value={service}
                                                        checked={selectedService === service}
                                                        onChange={() => setSelectedService(service)}
                                                    />
                                                    <span className="contact-page-service-icon" aria-hidden="true">{SERVICE_ICONS[service]}</span>
                                                    <span className="contact-page-service-copy">
                                                        <span className="contact-page-service-label">{copy.services[service]}</span>
                                                        <span className="contact-page-service-desc">{copy.service_desc[service]}</span>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="contact-page-group">
                                        <div className="contact-page-group-head">
                                            <h2>{copy.contact_info_title}</h2>
                                        </div>

                                        <div className="form-row contact-page-row contact-page-row--two">
                                            <div className="form-group">
                                                <label>{copy.name}</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{copy.email}</label>
                                                <input
                                                    type="email"
                                                    className="form-input"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder={copy.email_ph}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="form-row contact-page-row contact-page-row--single">
                                            <div className="form-group">
                                                <label>{copy.phone} <span className="label-optional">{copy.optional}</span></label>
                                                <input
                                                    type="tel"
                                                    className="form-input"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder={copy.phone_ph}
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    <section className="contact-page-group">
                                        <div className="contact-page-group-head">
                                            <h2>{copy.project_title}</h2>
                                        </div>
                                        <div className="form-group contact-message-group">
                                            <label>{copy.project}</label>
                                            <textarea
                                                className="form-input"
                                                rows={8}
                                                value={project}
                                                onChange={(e) => setProject(e.target.value)}
                                                placeholder={copy.project_ph}
                                                required
                                            />
                                        </div>
                                    </section>

                                    <section className="contact-page-actions">
                                        <LightButton type="submit" variant="hollow" className="contact-submit-btn contact-submit-btn--primary" disabled={status === 'sending'}>
                                            <span>{status === 'sending' ? copy.sending : copy.send}</span>
                                            {status !== 'sending' && (
                                                <span className={`arrow ${isRTL ? 'arrow--left' : 'arrow--right'}`}>
                                                    {isRTL ? '\u2190' : '\u2192'}
                                                </span>
                                            )}
                                        </LightButton>

                                        <div className="contact-page-secondary">
                                            <a
                                                href={WHATSAPP_LINK}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="contact-direct-btn contact-wa-btn contact-wa-direct-btn contact-page-wa-btn"
                                            >
                                                <span>{'\uD83D\uDCAC'}</span>
                                                <span>{copy.whatsapp}</span>
                                            </a>

                                            <div className="contact-divider">
                                                <span>{copy.or}</span>
                                            </div>

                                            <div className="contact-direct-links contact-page-direct-links">
                                                <span>{copy.direct_email}</span>
                                                <div className="contact-page-email-row">
                                                    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                                                    <button type="button" className="contact-page-copy-btn" onClick={handleCopyEmail}>
                                                        {emailCopied ? copy.copied_email : copy.copy_email}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </form>
                            </div>
                        </div>
                    )}
                </section>
            </main>

            <footer className="footer">
                <div className="footer-inner">
                    <p>&copy; 2026 TURTLESHELL. All rights reserved.</p>
                </div>
            </footer>
        </>
    )
}
