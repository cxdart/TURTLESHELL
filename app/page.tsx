import ContactModal from '@/components/ContactModal'
import IntroOverlay from '@/components/IntroOverlay'
import { createClient } from '@/lib/supabase/server'
import LightButton from '@/components/LightButton'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <>
      {/* Intro animation overlay — handles its own skip logic via useEffect */}
      <IntroOverlay />

      <section className="hero" id="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
          <div className="hero-orb hero-orb-4"></div>
        </div>
        <div className="hero-content">
          <div className="hero-logo-reveal">
            <img className="hero-logo-img" src="/TURTLESHELL-LOGO.png" alt="TURTLESHELL Logo" />
          </div>
          <div className="hero-text-reveal">
            <h1 data-i18n="hero_title" data-hero-source={'Build. Automate. Scale.'}>
              Build. Automate. Scale.
            </h1>
            <p data-i18n="hero_desc">
              Custom automation engines and modern web systems, engineered to run 24/7, scale cleanly, and stay secure.
            </p>
            <div className="hero-actions">
              {user ? (
                <LightButton href="/systems" variant="hollow">
                  <span data-i18n="hero_open_systems">Open Systems</span>
                  <span>{'\u2192'}</span>
                </LightButton>
              ) : (
                <>
                  <LightButton href="#services" variant="hollow">
                    <span data-i18n="hero_btn_explore">Explore Services</span>
                    <span>{'\u2192'}</span>
                  </LightButton>
                  <LightButton href="/login" variant="hollow" className="hero-get-started-btn">
                    <span data-i18n="hero_btn_login">Get Started</span>
                    <span>{'\u2192'}</span>
                  </LightButton>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="reveal" id="servicesLead">
          <div className="section-label" data-i18n="nav_services">
            Services
          </div>
          <h2 className="section-title" data-i18n="services_title">
            Deploy Your Infrastructure
          </h2>
          <p className="section-subtitle" data-i18n="services_desc">
            Choose NEXUS for automation, ATLAS for web systems, or GENOS for mobile apps, built, deployed, and maintained for you.
          </p>
        </div>
        <div className="carousel reveal" id="serviceCarousel">
          <button className="carousel-arrow carousel-arrow-left" id="carouselPrev" aria-label="Previous">
            {'\u2039'}
          </button>
          <div className="carousel-scene">
            <div className="carousel-ring" id="carouselRing">
              <div className="flyer-card is-front" id="cardNexus">
                <div className="flyer-glow"></div>
                <div className="flyer-icon">{'\uD83E\uDD16'}</div>
                <div className="flyer-subtitle" data-i18n="card_nexus_sub">
                  Automation Infrastructure
                </div>
                <h3 data-i18n="card_nexus_title">NEXUS</h3>
                <p data-i18n="card_nexus_desc">
                  Custom automation systems built for your workflow, hosted, monitored, and maintained.
                </p>
                <span className="flyer-action">
                  <span data-i18n="card_nexus_cta">Learn More</span> <span className="arrow">{'\u2192'}</span>
                </span>
              </div>
              <div className="flyer-card" id="cardAtlas">
                <div className="flyer-glow flyer-glow--atlas"></div>
                <div className="flyer-icon">{'\uD83C\uDF10'}</div>
                <div className="flyer-subtitle" data-i18n="card_atlas_sub">
                  Web Infrastructure
                </div>
                <h3 data-i18n="card_atlas_title">ATLAS</h3>
                <p data-i18n="card_atlas_desc">
                  Modern websites and web systems, landing pages, business sites, dashboards, and custom platforms.
                </p>
                <span className="flyer-action">
                  <span data-i18n="card_atlas_cta">Learn More</span> <span className="arrow">{'\u2192'}</span>
                </span>
              </div>
              <div className="flyer-card" id="cardGenos">
                <div className="flyer-glow flyer-glow--genos"></div>
                <div className="flyer-icon">{'\uD83D\uDCF1'}</div>
                <div className="flyer-subtitle" data-i18n="card_genos_sub">
                  Mobile Infrastructure
                </div>
                <h3 data-i18n="card_genos_title">GENOS</h3>
                <p data-i18n="card_genos_desc">
                  Native and cross-platform mobile applications, built, deployed, and maintained for your business.
                </p>
                <span className="flyer-action">
                  <span data-i18n="card_genos_cta">Learn More</span> <span className="arrow">{'\u2192'}</span>
                </span>
              </div>
            </div>
          </div>
          <button className="carousel-arrow carousel-arrow-right" id="carouselNext" aria-label="Next">
            {'\u203A'}
          </button>
          <div className="carousel-dots" id="carouselDots"></div>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-inner">
          <div className="about-grid">
            <div className="about-text reveal">
              <div className="section-label" data-i18n="nav_about">
                About
              </div>
              <h2 className="title-lightfx" data-i18n="about_title">Digital Infrastructure. Built For You.</h2>
              <p data-i18n="about_desc1">
                TURTLESHELL builds digital infrastructure across automation (
                <span className="text-glow-blue">NEXUS</span>), web systems (
                <span className="text-glow-blue">ATLAS</span>), and mobile apps (
                <span className="text-glow-blue">GENOS</span>). From internal workflows to customer-facing products,
                we design, deploy, and maintain platforms that run <span className="text-glow-blue">24/7</span>.
              </p>
              <p data-i18n="about_desc2">
                Built with performance, security, and reliability first, TURTLESHELL helps teams automate operations,
                ship modern web experiences, and launch mobile products without managing heavy infrastructure alone.
              </p>
            </div>
            <div className="about-stats reveal">
              <div className="stat-card">
                <div className="stat-number">24/7</div>
                <div className="stat-label" data-i18n="stat_bots">
                  Systems Uptime
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number">100%</div>
                <div className="stat-label" data-i18n="stat_custom">
                  Custom Built
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number">AES-256</div>
                <div className="stat-label" data-i18n="stat_security">
                  Security-First
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number infinity">&infin;</div>
                <div className="stat-label" data-i18n="stat_potential">
                  Built to Scale
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <p data-i18n="footer_copy">&copy; 2026 TURTLESHELL. All rights reserved.</p>
          <div className="footer-links">
            <a href="/contact" id="footerContactLink" data-i18n="footer_contact">
              Contact
            </a>
          </div>
        </div>
      </footer>

      <a
        href="https://wa.me/966558327668"
        target="_blank"
        rel="noreferrer"
        className="wa-floater"
        id="waFloater"
        aria-label="Chat on WhatsApp"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
        <span className="wa-floater-label">Chat</span>
      </a>

      <ContactModal />
    </>
  )
}
