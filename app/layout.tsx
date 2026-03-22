import type { Metadata } from 'next'
import Script from 'next/script'
import Navbar from '@/components/Navbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'TURTLESHELL - Built, for you',
  description: 'Custom bots, tech solutions, and cybersecurity. Automate smarter.',
  icons: { icon: '/TURTLESHELL-LOGO-white.png' },
}

// Evaluated at build time — changes on every deploy
const BUILD_TS = Date.now().toString()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const runtimeContactEndpoint = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT || '/api/contact/send'
  const runtimeAppVersion = process.env.NEXT_PUBLIC_APP_VERSION || process.env.npm_package_version || '0.1.0'

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className="lang-loading">
      <head>
        {/* Preload critical assets */}
        <link rel="preload" href="/TURTLESHELL-LOGO.webp" as="image" type="image/webp" />
        <link rel="preload" href={`/styles.css?v=${BUILD_TS}`} as="style" />
        <link rel="stylesheet" href={`/styles.css?v=${BUILD_TS}`} />
        {/* Gate translatable content until the correct language is applied.
            For English users the inline script removes lang-loading immediately
            (zero delay). For other languages it stays until setLanguage() runs
            in app.js — preventing the English→Arabic flash entirely. */}
        <style dangerouslySetInnerHTML={{ __html: `
          html.lang-loading [data-i18n],
          html.lang-loading [data-i18n-placeholder],
          html.lang-loading [data-i18n-ph] {
            visibility: hidden;
          }
        ` }} />
        <script dangerouslySetInnerHTML={{
          __html: `
(function(){
  try {
    window.__TS_CONTACT_ENDPOINT = ${JSON.stringify(runtimeContactEndpoint)};
    window.__TS_APP_VERSION = ${JSON.stringify(runtimeAppVersion)};

    var lang = localStorage.getItem('turtleshell-lang');
    var isArabicOrOther = lang && lang !== 'en';
    
    if (isArabicOrOther) {
      document.documentElement.setAttribute('lang', lang);
    } else {
      // It's english or default, remove the loading hidden class immediately
      document.documentElement.classList.remove('lang-loading');
    }

    var theme = localStorage.getItem('turtleshell-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e){}
})();
        `}} />
      </head>
      {/* NO intro-active here — only homepage adds it via inline script */}
      <body suppressHydrationWarning>
        {/* Page loading overlay — hidden on homepage (intro animation handles that) */}
        <div id="pageLoader" style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#0a0a0f',
          display: 'none',
          flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '2rem',
          transition: 'opacity 0.5s ease',
        }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div id="loaderGlow" style={{
              position: 'absolute', width: '140px', height: '140px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99,179,237,0.15) 0%, transparent 70%)',
              filter: 'blur(14px)',
            }} />
            <img src="/TURTLESHELL-LOGO.webp" alt="" id="loaderLogo"
              style={{ width: '72px', height: '72px', objectFit: 'contain', position: 'relative', zIndex: 1 }} />
          </div>
          <span id="loaderText" style={{
            fontSize: '0.75rem', letterSpacing: '0.22em',
            fontFamily: "'Inter', sans-serif",
            color: 'rgba(255,255,255,0.28)', fontWeight: 600,
            textTransform: 'uppercase',
          }}>LOADING</span>
        </div>

        <div className="site-global-bg" aria-hidden="true">
          <div className="site-global-orb site-global-orb--one"></div>
          <div className="site-global-orb site-global-orb--two"></div>
          <div className="site-global-orb site-global-orb--three"></div>
          <div className="site-global-orb site-global-orb--four"></div>
        </div>

        {/* Navigation - Client Component */}
        <Navbar />

        {/* Page Content */}
        <main>{children}</main>

        <Script id="page-loader" strategy="afterInteractive">{`
          (function(){
            var loader = document.getElementById('pageLoader');
            var logo   = document.getElementById('loaderLogo');
            var glow   = document.getElementById('loaderGlow');
            var text   = document.getElementById('loaderText');
            if (!loader) return;

            // On homepage, intro animation handles the reveal — skip loader entirely
            var isHomepage = window.location.pathname === '/';
            if (isHomepage) {
              loader.style.display = 'none';
              return;
            }

            // On all other pages, show the loader
            loader.style.display = 'flex';

            if (!logo) return;

            // Breathing pulse
            var start = performance.now();
            var raf;
            function pulse(now) {
              var t = (now - start) / 1400;
              var s = 0.9 + 0.12 * Math.sin(t * Math.PI * 2);
              var opacity = 0.55 + 0.45 * Math.sin(t * Math.PI * 2);
              logo.style.transform = 'scale(' + s + ')';
              logo.style.opacity   = opacity;
              logo.style.filter    = 'drop-shadow(0 0 ' + Math.round(4 + 18 * ((s-0.9)/0.12)) + 'px rgba(147,210,255,0.7))';
              if (glow) {
                glow.style.transform = 'scale(' + (0.8 + 0.5 * ((s-0.9)/0.12)) + ')';
                glow.style.opacity   = 0.4 + 0.6 * ((s-0.9)/0.12);
              }
              raf = requestAnimationFrame(pulse);
            }
            raf = requestAnimationFrame(pulse);

            // Dot cycling
            var dots = 0, dotTimer;
            function cycleDots(){
              dots = (dots % 3) + 1;
              if (text) text.textContent = 'LOADING' + '\u00B7'.repeat(dots);
            }
            dotTimer = setInterval(cycleDots, 450);

            // Fade out when page is ready
            function hide(){
              cancelAnimationFrame(raf);
              clearInterval(dotTimer);
              loader.style.opacity = '0';
              loader.style.pointerEvents = 'none';
              setTimeout(function(){ loader.style.display = 'none'; }, 520);
            }

            if (document.readyState === 'complete') {
              setTimeout(hide, 250);
            } else {
              window.addEventListener('load', function(){ setTimeout(hide, 250); });
            }
          })();
        `}</Script>
        <Script src={`/app.js?v=${BUILD_TS}`} strategy="afterInteractive" id="main-app-js" />
      </body>
    </html>
  )
}
