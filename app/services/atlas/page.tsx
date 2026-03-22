'use client'

import ContactModal from '@/components/ContactModal'
import LightButton from '@/components/LightButton'

type AtlasWindow = Window & {
    openContactModal?: (service: 'ATLAS') => void
}

export default function AtlasServicePage() {
    const scrollToDetails = () => {
        const detailsSection = document.getElementById('atlas-details')
        if (detailsSection) {
            detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    const openRequestModal = () => {
        const openContactModal = (window as AtlasWindow).openContactModal
        if (typeof openContactModal === 'function') {
            openContactModal('ATLAS')
            return
        }

        window.location.href = '/contact?service=ATLAS'
    }

    return (
        <>
            <main className="service-page">
                <section className="hero hero-centered" id="hero-atlas">
                    <div className="hero-bg">
                        <div className="hero-orb hero-orb-1 flyer-glow--atlas"></div>
                        <div className="hero-orb hero-orb-2 flyer-glow--atlas"></div>
                        <div className="hero-orb hero-orb-3 flyer-glow--atlas"></div>
                    </div>
                    <div className="hero-content">
                        <div className="hero-text-reveal">
                            <div className="section-label" style={{ marginBottom: '1rem' }} data-i18n="atlas_badge">WEB INFRASTRUCTURE</div>
                            <h1 data-i18n="atlas_title">ATLAS</h1>
                            <p data-i18n="atlas_hero_desc" className="service-lead" style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginTop: '1.5rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
                                Modern websites and web systems, landing pages, business sites, dashboards, and custom web platforms.
                            </p>
                            <div className="hero-actions" style={{ marginTop: '2.5rem', justifyContent: 'center' }}>
                                <LightButton variant="hollow" className="service-hero-jump-btn" onClick={scrollToDetails}>
                                    <span data-i18n="atlas_jump_cta">See platform features {'\u2193'}</span>
                                </LightButton>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section" id="atlas-details">
                    <div className="about-inner">
                        <div className="about-grid">
                            <div className="about-text reveal">
                                <h2 data-i18n="atlas_what_title">What is ATLAS?</h2>
                                <p data-i18n="atlas_what_desc1">
                                    ATLAS handles everything web. From high-converting landing pages to complex secure dashboards and custom SaaS products, we engineer web experiences that perform under pressure.
                                </p>
                                <div style={{ marginTop: '2.5rem' }}>
                                    <h3 data-i18n="atlas_benefits_title" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text)' }}>Core Capabilities</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-muted)' }}>
                                        <li style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                                            <span style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>{'\u2713'}</span>
                                            <div>
                                                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '0.25rem' }} data-i18n="atlas_capability_1_title">Business Sites & Landing Pages</strong>
                                                <span data-i18n="atlas_capability_1_desc">Blazing fast, SEO-optimized, pixel-perfect sites designed to convert visitors into clients.</span>
                                            </div>
                                        </li>
                                        <li style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                                            <span style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>{'\u2713'}</span>
                                            <div>
                                                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '0.25rem' }} data-i18n="atlas_capability_2_title">Custom Web Platforms</strong>
                                                <span data-i18n="atlas_capability_2_desc">Internal tools, CMS, and specialized SaaS architectures built specifically for your needs.</span>
                                            </div>
                                        </li>
                                        <li style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                                            <span style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>{'\u2713'}</span>
                                            <div>
                                                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '0.25rem' }} data-i18n="atlas_capability_3_title">Client Dashboards</strong>
                                                <span data-i18n="atlas_capability_3_desc">Secure, data-driven interfaces for your clients to track metrics or interact with your service.</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="about-stats reveal">
                                <div className="stat-card" style={{ padding: '2rem' }}>
                                    <div className="stat-number" style={{ fontSize: '2.5rem' }} data-i18n="atlas_stat_1_value">Custom</div>
                                    <div className="stat-label" data-i18n="atlas_stat_1_label">Tailored Delivery</div>
                                </div>
                                <div className="stat-card" style={{ padding: '2rem' }}>
                                    <div className="stat-number" style={{ fontSize: '2.5rem' }}>{'\u26A1'}</div>
                                    <div className="stat-label" data-i18n="atlas_stat_2_label">Ultra Fast Performance</div>
                                </div>
                                <div className="stat-card" style={{ padding: '2rem' }}>
                                    <div className="stat-number" style={{ fontSize: '2.5rem' }}>SEO</div>
                                    <div className="stat-label" data-i18n="atlas_stat_3_label">Search Optimized</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section section-service-cta reveal" style={{ textAlign: 'center', paddingBottom: '6rem' }}>
                    <h2 data-i18n="atlas_final_title">Ready to build with ATLAS?</h2>
                    <p data-i18n="service_final_desc" style={{ margin: '1rem auto 2.5rem', maxWidth: '600px', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Tell us what you need and we will scope architecture, timeline, and delivery.
                    </p>
                    <LightButton variant="hollow" className="service-request-btn" onClick={openRequestModal} style={{ margin: '0 auto' }}>
                        <span data-i18n="atlas_final_button">Request ATLAS</span>
                        <span>{'\u2192'}</span>
                    </LightButton>
                </section>
            </main>

            <footer className="footer">
                <div className="footer-inner">
                    <p data-i18n="footer_copy">&copy; 2025 TURTLESHELL. All rights reserved.</p>
                    <div className="footer-links">
                        <a href="/contact" data-i18n="footer_contact">Contact</a>
                    </div>
                </div>
            </footer>

            <ContactModal />
        </>
    )
}
