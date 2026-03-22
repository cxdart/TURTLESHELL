'use client'

import ContactModal from '@/components/ContactModal'
import LightButton from '@/components/LightButton'

type NexusWindow = Window & {
    openContactModal?: (service: 'NEXUS') => void
}

export default function NexusServicePage() {
    const scrollToDetails = () => {
        const detailsSection = document.getElementById('nexus-details')
        if (detailsSection) {
            detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    const openRequestModal = () => {
        const openContactModal = (window as NexusWindow).openContactModal
        if (typeof openContactModal === 'function') {
            openContactModal('NEXUS')
            return
        }

        window.location.href = '/contact?service=NEXUS'
    }

    return (
        <>
            <main className="service-page">
                <section className="hero hero-centered" id="hero-nexus">
                    <div className="hero-bg">
                        <div className="hero-orb hero-orb-1"></div>
                        <div className="hero-orb hero-orb-2"></div>
                        <div className="hero-orb hero-orb-3"></div>
                    </div>
                    <div className="hero-content">
                        <div className="hero-text-reveal">
                            <div className="section-label" style={{ marginBottom: '1rem' }} data-i18n="nexus_badge">AUTOMATION INFRASTRUCTURE</div>
                            <h1 data-i18n="nexus_title">NEXUS</h1>
                            <p data-i18n="nexus_hero_desc" className="service-lead" style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginTop: '1.5rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
                                Custom automation systems engineered to eliminate repetitive tasks, connect your tools, and scale your operations 24/7.
                            </p>
                            <div className="hero-actions" style={{ marginTop: '2.5rem', justifyContent: 'center' }}>
                                <LightButton variant="hollow" className="service-hero-jump-btn" onClick={scrollToDetails}>
                                    <span data-i18n="nexus_jump_cta">See automation capabilities {'\u2193'}</span>
                                </LightButton>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section" id="nexus-details">
                    <div className="about-inner">
                        <div className="about-grid">
                            <div className="about-text reveal">
                                <h2 data-i18n="nexus_what_title">What is NEXUS?</h2>
                                <p data-i18n="nexus_what_desc1">
                                    NEXUS is our flagship automation infrastructure. We build custom bots, scripts, and background workers that talk to your APIs, manage your data, and handle the heavy lifting so your team doesn&apos;t have to.
                                </p>
                                <div style={{ marginTop: '2.5rem' }}>
                                    <h3 data-i18n="nexus_benefits_title" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text)' }}>Core Capabilities</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-muted)' }}>
                                        <li style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                                            <span style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>{'\u2713'}</span>
                                            <div>
                                                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '0.25rem' }} data-i18n="nexus_capability_1_title">Workflow Automation</strong>
                                                <span data-i18n="nexus_capability_1_desc">Connect disparate SaaS tools (CRM, Slack, Email) into one seamless pipeline.</span>
                                            </div>
                                        </li>
                                        <li style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                                            <span style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>{'\u2713'}</span>
                                            <div>
                                                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '0.25rem' }} data-i18n="nexus_capability_2_title">Data Extraction & Processing</strong>
                                                <span data-i18n="nexus_capability_2_desc">Automated web scraping, data formatting, and automated reporting systems.</span>
                                            </div>
                                        </li>
                                        <li style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                                            <span style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>{'\u2713'}</span>
                                            <div>
                                                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '0.25rem' }} data-i18n="nexus_capability_3_title">AI Integration</strong>
                                                <span data-i18n="nexus_capability_3_desc">Embed custom LLMs into your workflows to categorize, respond, and process natural language automatically.</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="about-stats reveal">
                                <div className="stat-card" style={{ padding: '2rem' }}>
                                    <div className="stat-number" style={{ fontSize: '2.5rem' }} data-i18n="nexus_stat_1_value">Custom</div>
                                    <div className="stat-label" data-i18n="nexus_stat_1_label">Tailored Architecture</div>
                                </div>
                                <div className="stat-card" style={{ padding: '2rem' }}>
                                    <div className="stat-number" style={{ fontSize: '2.5rem' }}>24/7</div>
                                    <div className="stat-label" data-i18n="nexus_stat_2_label">Cloud Hosted</div>
                                </div>
                                <div className="stat-card" style={{ padding: '2rem' }}>
                                    <div className="stat-number" style={{ fontSize: '2.5rem' }}>API</div>
                                    <div className="stat-label" data-i18n="nexus_stat_3_label">Seamless Integrations</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section section-service-cta reveal" style={{ textAlign: 'center', paddingBottom: '6rem' }}>
                    <h2 data-i18n="nexus_final_title">Ready to build with NEXUS?</h2>
                    <p data-i18n="service_final_desc" style={{ margin: '1rem auto 2.5rem', maxWidth: '600px', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Tell us what you need and we will scope architecture, timeline, and delivery.
                    </p>
                    <LightButton variant="hollow" className="service-request-btn" onClick={openRequestModal} style={{ margin: '0 auto' }}>
                        <span data-i18n="nexus_final_button">Request NEXUS</span>
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
