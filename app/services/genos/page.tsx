'use client'

import ContactModal from '@/components/ContactModal'
import LightButton from '@/components/LightButton'

type GenosWindow = Window & {
    openContactModal?: (service: 'GENOS') => void
}

export default function GenosServicePage() {
    const scrollToDetails = () => {
        const detailsSection = document.getElementById('genos-details')
        if (detailsSection) {
            detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    const openRequestModal = () => {
        const openContactModal = (window as GenosWindow).openContactModal
        if (typeof openContactModal === 'function') {
            openContactModal('GENOS')
            return
        }

        window.location.href = '/contact?service=GENOS'
    }

    return (
        <>
            <main className="service-page">
                <section className="hero hero-centered" id="hero-genos">
                    <div className="hero-bg">
                        <div className="hero-orb hero-orb-1 flyer-glow--genos"></div>
                        <div className="hero-orb hero-orb-2 flyer-glow--genos"></div>
                        <div className="hero-orb hero-orb-3 flyer-glow--genos"></div>
                    </div>
                    <div className="hero-content">
                        <div className="hero-text-reveal">
                            <div className="section-label" style={{ marginBottom: '1rem' }} data-i18n="genos_badge">MOBILE INFRASTRUCTURE</div>
                            <h1 data-i18n="genos_title">GENOS</h1>
                            <p data-i18n="genos_hero_desc" className="service-lead" style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginTop: '1.5rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
                                Native and cross-platform mobile applications, built from the ground up, deployed to app stores, and maintained for your business.
                            </p>
                            <div className="hero-actions" style={{ marginTop: '2.5rem', justifyContent: 'center' }}>
                                <LightButton variant="hollow" className="service-hero-jump-btn" onClick={scrollToDetails}>
                                    <span data-i18n="genos_jump_cta">See capabilities {'\u2193'}</span>
                                </LightButton>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section" id="genos-details">
                    <div className="about-inner">
                        <div className="about-grid">
                            <div className="about-text reveal">
                                <h2 data-i18n="genos_what_title">What is GENOS?</h2>
                                <p data-i18n="genos_what_desc1">
                                    GENOS is our mobile application unit. Whether it&apos;s iOS or Android, we develop sleek, high-performing apps that keep your users engaged on the devices they carry every day.
                                </p>
                                <div style={{ marginTop: '2.5rem' }}>
                                    <h3 data-i18n="genos_benefits_title" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text)' }}>Core Capabilities</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-muted)' }}>
                                        <li style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                                            <span style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>{'\u2713'}</span>
                                            <div>
                                                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '0.25rem' }} data-i18n="genos_capability_1_title">Cross-Platform Mastery</strong>
                                                <span data-i18n="genos_capability_1_desc">Write once, deploy everywhere. High-performance apps for both iOS and Android simultaneously.</span>
                                            </div>
                                        </li>
                                        <li style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                                            <span style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>{'\u2713'}</span>
                                            <div>
                                                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '0.25rem' }} data-i18n="genos_capability_2_title">Native Experiences</strong>
                                                <span data-i18n="genos_capability_2_desc">Smooth, intuitive UIs that feel right at home on massive tablets and compact phones.</span>
                                            </div>
                                        </li>
                                        <li style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                                            <span style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>{'\u2713'}</span>
                                            <div>
                                                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '0.25rem' }} data-i18n="genos_capability_3_title">Store Deployment & Updates</strong>
                                                <span data-i18n="genos_capability_3_desc">We navigate Apple and Google&apos;s complex review systems to push your app and updates live seamlessly.</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="about-stats reveal">
                                <div className="stat-card" style={{ padding: '2rem' }}>
                                    <div className="stat-number" style={{ fontSize: '2.5rem' }} data-i18n="genos_stat_1_value">Custom</div>
                                    <div className="stat-label" data-i18n="genos_stat_1_label">Tailored Development</div>
                                </div>
                                <div className="stat-card" style={{ padding: '2rem' }}>
                                    <div className="stat-number" style={{ fontSize: '2.5rem' }}>iOS/Droid</div>
                                    <div className="stat-label" data-i18n="genos_stat_2_label">Cross Platform</div>
                                </div>
                                <div className="stat-card" style={{ padding: '2rem' }}>
                                    <div className="stat-number" style={{ fontSize: '2.5rem' }}>{'\u2601'}</div>
                                    <div className="stat-label" data-i18n="genos_stat_3_label">Cloud Backend Ready</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section section-service-cta reveal" style={{ textAlign: 'center', paddingBottom: '6rem' }}>
                    <h2 data-i18n="genos_final_title">Ready to build with GENOS?</h2>
                    <p data-i18n="service_final_desc" style={{ margin: '1rem auto 2.5rem', maxWidth: '600px', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Tell us what you need and we will scope architecture, timeline, and delivery.
                    </p>
                    <LightButton variant="hollow" className="service-request-btn" onClick={openRequestModal} style={{ margin: '0 auto' }}>
                        <span data-i18n="genos_final_button">Request GENOS</span>
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
