/* ============================================================================
   TURTLESHELL, App Logic
   ============================================================================ */

/* ---------- Navigation tracking (for smart back button) ---------- */
(function () {
    const current = window.location.pathname;
    const prev = sessionStorage.getItem('ts_prev_path');
    if (prev !== current) {
        sessionStorage.setItem('ts_prev_path', prev || current);
    }
})();

/* ---------- Config ---------- */
const CONTACT_ENDPOINT = '/api/contact/send';

const introOverlay = document.getElementById('introOverlay');
const introLogo = introOverlay?.querySelector('.intro-logo-wrap');
const introTagline = introOverlay?.querySelector('.intro-tagline-text');
// Dynamic tagline metrics — computed from actual text at runtime so any text length works
const _introTaglineChars = introTagline ? introTagline.textContent.trim().length || 13 : 13;
const _introTaglineWidth = _introTaglineChars + 'ch';
// Only inject a dynamic override if the text length differs from the CSS default (13).
// If it's 13 chars, CSS already has the right steps(13) — no race condition.
// If text ever changes to a different length, this kicks in and restarts the animation cleanly.
(function() {
    if (!introTagline || _introTaglineChars === 13) return;
    // Text length differs from CSS default — inject corrected keyframe + restart animation
    var s = document.createElement('style');
    s.id = 'intro-tagline-dynamic';
    s.textContent = [
        '@keyframes introTaglineType {',
        '  0%   { width: 0; opacity: 0; }',
        '  1%   { opacity: 1; }',
        '  100% { width: ' + _introTaglineWidth + '; opacity: 1; }',
        '}',
        '.intro-tagline-text {',
        '  animation-timing-function: steps(' + _introTaglineChars + ', end) !important;',
        '}'
    ].join('\n');
    document.head.appendChild(s);
    // Force animation restart so the new steps value takes effect
    introTagline.style.animation = 'none';
    introTagline.offsetWidth; // reflow
    introTagline.style.animation = '';
})();
const INTRO_POST_TEXT_HOLD_MS = 1000;
const INTRO_LIGHT_DELAY_MS = 80;
const _isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.matchMedia("(max-width: 768px)").matches;

// iOS SAFARI SCROLL-LOCK FIX
// Only clears scroll-lock and hides overlay — does NOT strip animations.
// Fade-in animations play normally after intro clears.
if (_isMobile) {
    // BULLETPROOF iOS FIX: run immediately + at 3 safety intervals
    // CSS already sets opacity:1/animation:none on mobile, but we also
    // ensure the overlay and scroll-lock are definitely cleared.
    function _mobileUnlock() {
        // Only clear scroll locks — do NOT touch the intro overlay.
        // finishIntro() handles the overlay after animations complete.
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        document.body.style.visibility = "";
        document.documentElement.style.visibility = "";
        // Only remove scroll-lock, not intro-active (that belongs to finishIntro)
        document.body.classList.remove("scroll-lock");
        document.documentElement.classList.remove("scroll-lock");
    }
    // Run immediately (catches pre-JS state), then at 2 safety intervals
    _mobileUnlock();
    setTimeout(_mobileUnlock, 500);
    setTimeout(_mobileUnlock, 1500);
}
const INTRO_FALLBACK_MS = 4200;
const INTRO_FALLBACK_RETRY_MS = 200;
const INTRO_FALLBACK_MAX_WAIT_MS = 11000;
const networkInfo = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let introFinished = false;
let introFallbackTimer = null;
let introHoldTimer = null;
let introLightTimer = null;
let introRemovalTimer = null;
let heroTitleAnimating = false;
let heroTitleRunId = 0;
let heroTitleHasPlayed = false;
let canTapUnlockScroll = false;
let isPerformanceLite = false;
let introTaglineDone = false;
let introStartedAt = 0;

function initPerformanceMode() {
    const saveData = !!networkInfo?.saveData;
    const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
    const lowCPU = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
    const mobileViewport = window.matchMedia('(max-width: 768px)').matches;
    const reducedMotion = reducedMotionQuery.matches;
    // Don't kill animations just because it's a phone — only kill for explicit reduced motion or save-data
    const enableLite = reducedMotion || saveData;

    document.documentElement.classList.toggle('performance-lite', enableLite);
    return enableLite;
}

function refreshPerformanceMode() {
    isPerformanceLite = initPerformanceMode();
}

refreshPerformanceMode();

let perfModeRaf = 0;
window.addEventListener('resize', () => {
    if (perfModeRaf) cancelAnimationFrame(perfModeRaf);
    perfModeRaf = requestAnimationFrame(() => {
        refreshPerformanceMode();
        releasePageScrollIfSafe();
        perfModeRaf = 0;
    });
}, { passive: true });

if (typeof networkInfo?.addEventListener === 'function') {
    networkInfo.addEventListener('change', refreshPerformanceMode);
}

if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', refreshPerformanceMode);
} else if (typeof reducedMotionQuery.addListener === 'function') {
    reducedMotionQuery.addListener(refreshPerformanceMode);
}

function lockPageScroll() {
    document.documentElement.classList.add('scroll-lock');
    document.body.classList.add('scroll-lock');
}

function unlockPageScroll() {
    document.documentElement.classList.remove('scroll-lock');
    document.body.classList.remove('scroll-lock');
}

function setIntroActiveState() {
    document.documentElement.classList.add('intro-active');
    document.body.classList.add('intro-active');
    lockPageScroll();
}

function clearIntroActiveState() {
    document.documentElement.classList.remove('intro-active');
    document.body.classList.remove('intro-active');
}

function releasePageScrollIfSafe() {
    if (isIntroRunning()) return;
    if (document.querySelector('.modal-overlay.active')) return;

    document.body.style.overflow = '';
    unlockPageScroll();
}

function enableTapUnlockScroll() {
    canTapUnlockScroll = true;
}

function disableTapUnlockScroll() {
    canTapUnlockScroll = false;
}

function handleTapUnlockScroll() {
    if (!canTapUnlockScroll) return;
    if (isIntroRunning()) return;
    unlockPageScroll();
    disableTapUnlockScroll();
}

document.addEventListener('pointerdown', handleTapUnlockScroll, { passive: true });

function isIntroRunning() {
    return !!introOverlay
        && !introFinished
        && !introOverlay.classList.contains('is-hidden')
        && !introOverlay.hasAttribute('hidden');
}

function removeIntroOverlay(immediate = false) {
    if (!introOverlay) return;
    clearTimeout(introRemovalTimer);

    const teardown = () => {
        introOverlay.setAttribute('hidden', '');
        introOverlay.style.display = 'none';
        introRemovalTimer = null;
    };

    if (immediate) {
        teardown();
        return;
    }

    introRemovalTimer = setTimeout(teardown, 1000);
}

function prepareHeroTitleWords() {
    const heroTitle = document.querySelector('.hero h1[data-i18n="hero_title"], .title-lightfx');
    if (!heroTitle) return;

    const existingSource = heroTitle.getAttribute('data-hero-source');
    const sourceHtml = existingSource || heroTitle.innerHTML
        .replace(/<span\b[^>]*>/gi, '')
        .replace(/<\/span>/gi, '');

    heroTitle.setAttribute('data-hero-source', sourceHtml);

    const tokens = sourceHtml
        .replace(/<br\s*\/?>/gi, ' __BR__ ')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    let wordIndex = 0;
    const wordsHtml = tokens.map((token) => {
        if (token === '__BR__') return '<br>';
        const index = wordIndex++;
        return `<span class="hero-word" style="--word-index:${index}">${token}</span>`;
    }).join(' ');

    heroTitle.innerHTML = wordsHtml;
    heroTitle.classList.add('hero-title-wordlight');
    heroTitle.classList.remove('hero-title-animate');
}

function resetHeroTitleWordLight() {
    const heroTitle = document.querySelector('.hero h1[data-i18n="hero_title"], .title-lightfx');
    if (!heroTitle) return;

    heroTitleRunId += 1;
    heroTitleAnimating = false;
    heroTitleHasPlayed = false;
    heroTitle.classList.remove('hero-title-animate');
    heroTitle.classList.remove('hero-title-breathe');
    prepareHeroTitleWords();

    // Fail-safe: if intro is already finished, keep title readable even if
    // a follow-up animation cycle does not run (e.g. language refresh races).
    if (introFinished || !isIntroRunning()) {
        heroTitle.classList.add('hero-title-breathe');
        heroTitleHasPlayed = true;
    }
}

function playHeroTitleWordLight(onComplete) {
    const heroTitle = document.querySelector('.hero h1[data-i18n="hero_title"], .title-lightfx');
    if (!heroTitle) {
        if (typeof onComplete === 'function') onComplete();
        return;
    }

    if (heroTitleHasPlayed) {
        if (typeof onComplete === 'function') onComplete();
        return;
    }

    if (!heroTitle.querySelector('.hero-word')) {
        prepareHeroTitleWords();
    }

    const runId = ++heroTitleRunId;
    heroTitleAnimating = true;
    const words = Array.from(heroTitle.querySelectorAll('.hero-word'));
    let completed = false;
    const finish = () => {
        if (completed) return;
        if (runId !== heroTitleRunId) return;
        completed = true;
        heroTitleAnimating = false;
        heroTitle.classList.remove('hero-title-animate');
        heroTitle.classList.add('hero-title-breathe');
        heroTitleHasPlayed = true;
        if (typeof onComplete === 'function') onComplete();
    };

    const lastWord = words[words.length - 1];
    if (lastWord) {
        const onLastWordEnd = (event) => {
            if (event.animationName !== 'heroWordLight') return;
            finish();
        };
        lastWord.addEventListener('animationend', onLastWordEnd, { once: true });
    }

    const titleStyles = getComputedStyle(heroTitle);
    const durationSec = parseFloat(titleStyles.getPropertyValue('--hero-word-light-duration')) || 1.75;
    const staggerSec = parseFloat(titleStyles.getPropertyValue('--hero-word-light-stagger')) || 0.42;
    const totalMs = (durationSec + Math.max(0, words.length - 1) * staggerSec) * 1000 + 220;
    setTimeout(finish, totalMs);

    heroTitle.classList.remove('hero-title-breathe');
    heroTitle.classList.remove('hero-title-animate');
    void heroTitle.offsetWidth;
    heroTitle.classList.add('hero-title-animate');
}

function finishIntro() {
    if (introFinished) return;
    introFinished = true;

    // Hide overlay only; the page remains loaded beneath it
    introOverlay?.classList.add('is-hidden');
    removeIntroOverlay(false);
    disableTapUnlockScroll();

    // Play the hero title word-light animation once the intro clears
    introLightTimer = setTimeout(() => {
        introLightTimer = null;
        playHeroTitleWordLight(() => { });
    }, INTRO_LIGHT_DELAY_MS);

    // Always unlock scroll immediately when intro ends
    clearIntroActiveState();
    unlockPageScroll();
    window.dispatchEvent(new Event('turtleshell-intro-finished'));

    // Safety net: force intro text elements to their final visible state
    // Guards against clip-path or width animation silent failures (RTL, contain, etc.)
    var wWrap = document.querySelector('.intro-wordmark-wrap');
    var wMark = document.querySelector('.intro-wordmark');
    var tLine = document.querySelector('.intro-tagline-text');
    if (wWrap) { wWrap.style.clipPath = 'inset(0 0 0 0)'; wWrap.style.maxWidth = '100%'; }
    if (wMark) { wMark.style.opacity = '1'; wMark.style.transform = 'translateX(0)'; }
    if (tLine) { tLine.style.width = (tLine.textContent.trim().length || 13) + 'ch'; tLine.style.opacity = '1'; }

    // After intro clears, re-run reveal check for ALL devices
    // On mobile especially: observer may have fired while overlay was blocking
    // Reset in-viewport reveals and re-observe so fade-in plays correctly
    setTimeout(function() {
        var viewH = window.innerHeight || 768;
        document.querySelectorAll('.reveal').forEach(function(el) {
            var rect = el.getBoundingClientRect();
            if (rect.bottom > 0 && rect.top < viewH + 10) {
                // In viewport — show immediately (was covered by intro overlay)
                el.classList.add('visible');
            } else {
                // Below fold — reset so observer can fire fade-in on scroll
                el.classList.remove('visible');
            }
        });
        // Re-register all reveals with observer for below-fold elements
        if (window.__refreshRevealObserverTargets) {
            window.__refreshRevealObserverTargets();
        }
    }, 150);
}

function skipIntro() {
    clearTimeout(introFallbackTimer);
    clearTimeout(introHoldTimer);
    clearTimeout(introLightTimer);
    introLightTimer = null;
    introOverlay?.classList.add('is-skipping');
    finishIntro();
}

function runIntroFallback() {
    if (introFinished) return;

    if (!introTagline || introTaglineDone) {
        finishIntro();
        return;
    }

    if ((performance.now() - introStartedAt) < INTRO_FALLBACK_MAX_WAIT_MS) {
        introFallbackTimer = setTimeout(runIntroFallback, INTRO_FALLBACK_RETRY_MS);
        return;
    }

    finishIntro();
}

if (introOverlay) {
    // User may have already tapped before app.js loaded — respect that
    if (window.__introSkipped) {
        disableTapUnlockScroll();
        clearIntroActiveState();
        unlockPageScroll();
        introOverlay.classList.add('is-hidden');
        removeIntroOverlay(false);
        introFinished = true;
        setTimeout(() => {
            if (!heroTitleAnimating && !heroTitleHasPlayed) playHeroTitleWordLight(() => { });
        }, 80);
    } else {
        setIntroActiveState();
        introStartedAt = performance.now();
        introFallbackTimer = setTimeout(runIntroFallback, INTRO_FALLBACK_MS);

        // Click/tap anywhere on intro to skip with fade
        introOverlay.addEventListener('click', skipIntro, { once: true });
        introOverlay.addEventListener('touchend', skipIntro, { once: true, passive: true });

        if (introTagline) {
            const onTaglineEnd = (event) => {
                if (event.animationName !== 'introTaglineType') return;
                introTaglineDone = true;
                clearTimeout(introFallbackTimer);
                introHoldTimer = setTimeout(finishIntro, INTRO_POST_TEXT_HOLD_MS);
                introTagline.removeEventListener('animationend', onTaglineEnd);
            };
            introTagline.addEventListener('animationend', onTaglineEnd);
        } else {
            introLogo?.addEventListener('animationend', () => {
                clearTimeout(introFallbackTimer);
                introHoldTimer = setTimeout(finishIntro, INTRO_POST_TEXT_HOLD_MS);
            }, { once: true });
        }
    } // end else (__introSkipped)
} else {
    disableTapUnlockScroll();
    clearIntroActiveState();
    unlockPageScroll();
    introOverlay?.classList.add('is-hidden');
    removeIntroOverlay(true);
    introFinished = true;
}

window.addEventListener('pageshow', () => {
    requestAnimationFrame(releasePageScrollIfSafe);
});

window.addEventListener('load', () => {
    requestAnimationFrame(releasePageScrollIfSafe);
});

// Tap/Click anywhere to speed up animations
let animationsAccelerated = false;
document.addEventListener('click', () => {
    if (isPerformanceLite || animationsAccelerated) return;
    animationsAccelerated = true;
    var run = function () { document.querySelectorAll('.hero-orb').forEach(function (orb) { orb.style.animationDuration = '2s'; }); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 500 });
    else setTimeout(run, 0);
}, { once: true, passive: true });

// Reset animation when scrolling back to hero section
const heroSection = document.querySelector('.hero');
let lastScrollY = window.scrollY;
const heroReplayMedia = window.matchMedia('(max-width: 768px)');
const heroLightObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) {
            if (heroTitleHasPlayed && !heroTitleAnimating && window.scrollY > 120) {
                resetHeroTitleWordLight();
            }
            return;
        }
        if (isIntroRunning()) return;
        if (heroTitleHasPlayed) return;
        if (heroTitleAnimating) return;

        playHeroTitleWordLight(() => { });
    });
}, {
    threshold: heroReplayMedia.matches ? 0.24 : 0.55,
    rootMargin: heroReplayMedia.matches ? '0px 0px -14% 0px' : '0px'
});

if (heroSection) {
    heroLightObserver.observe(heroSection);
}

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY; // P1: passive listener below
    const heroBottom = heroSection ? heroSection.offsetHeight : 0;
    const replayResetPoint = Math.max(140, heroBottom * 0.38);
    const replayTriggerPoint = Math.max(28, heroBottom * 0.18);

    if (currentScrollY > replayResetPoint && heroTitleHasPlayed && !heroTitleAnimating) {
        resetHeroTitleWordLight();
    }

    if (
        currentScrollY < replayTriggerPoint &&
        currentScrollY < lastScrollY &&
        !isIntroRunning() &&
        !heroTitleAnimating &&
        !heroTitleHasPlayed
    ) {
        playHeroTitleWordLight(() => { });
    }

    if (isPerformanceLite) {
        lastScrollY = currentScrollY;
        return;
    }

    // If user scrolls back up to hero section and animations were accelerated
    if (currentScrollY < heroBottom && animationsAccelerated && currentScrollY < lastScrollY) {
        animationsAccelerated = false;
        // Reset animations to normal speed
        document.querySelectorAll('.hero-orb').forEach(orb => {
            orb.style.animation = 'none';
            // Trigger reflow
            orb.offsetHeight;
            orb.style.animation = '';
        });
    }

    lastScrollY = currentScrollY;
}, { passive: true });

// ---------- Dark Mode ----------
(function initTheme() {
    const saved = localStorage.getItem('turtleshell-theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    // updateToggleIcon(); removed as theme is handled by CSS now
})();

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('turtleshell-theme', next);
});

// Mobile menu
const mobileBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');
const mobileMenuMedia = window.matchMedia('(max-width: 768px)');

function isMobileNavViewport() {
    return mobileMenuMedia.matches;
}

// Mobile menu owned by React (NavbarClient.tsx) - app.js only handles close side-effects
function setMobileMenuOpen(isOpen) {
    if (!isOpen) {
        closeLanguageMenu();
        closeUserMenu();
    }
}
// Do NOT add click listener on mobileBtn here - React owns it

navLinks?.addEventListener('click', (event) => {
    if (!isMobileNavViewport()) return;
    if (!navLinks.classList.contains('open')) return;
    if (!(event.target instanceof Element)) return;

    const interactiveTarget = event.target.closest('a, button, input, select, textarea, label, form');
    if (!interactiveTarget) {
        setMobileMenuOpen(false);
    }
});

document.addEventListener('click', (event) => {
    if (!isMobileNavViewport()) return;
    if (!navLinks?.classList.contains('open')) return;
    if (!(event.target instanceof Node)) return;
    if (navLinks.contains(event.target) || mobileBtn?.contains(event.target)) return;

    setMobileMenuOpen(false);
});

if (typeof mobileMenuMedia.addEventListener === 'function') {
    mobileMenuMedia.addEventListener('change', (event) => {
        if (!event.matches) setMobileMenuOpen(false);
    });
}

// User account dropdown
const navUserMenu = document.getElementById('navUserMenu');
const navUserTrigger = document.getElementById('navUserTrigger');
function closeUserMenu() {
    navUserMenu?.classList.remove('open');
    navUserTrigger?.setAttribute('aria-expanded', 'false');
}

if (navUserTrigger && navUserMenu) {
    navUserTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!navUserMenu.classList.contains('open')) {
            closeLanguageMenu();
        }
        const isOpen = navUserMenu.classList.toggle('open');
        navUserTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
}

// Language picker (custom rounded dropdown)
const langPicker = document.getElementById('langPicker');
const langPickerTrigger = document.getElementById('langPickerTrigger');
const langMenu = document.getElementById('langMenu');
const langCurrentFlag = document.getElementById('langCurrentFlag');
const langCurrentCode = document.getElementById('langCurrentCode');

const languageMeta = {
    en: { label: 'English', flag: 'https://flagcdn.com/w40/us.png', alt: 'United States' },
    ar: { label: 'العربية', flag: 'https://flagcdn.com/w40/sa.png', alt: 'Saudi Arabia' },
    de: { label: 'Deutsch', flag: 'https://flagcdn.com/w40/de.png', alt: 'Germany' },
    ja: { label: '日本語', flag: 'https://flagcdn.com/w40/jp.png', alt: 'Japan' }
};

function closeLanguageMenu() {
    langPicker?.classList.remove('open');
    langPickerTrigger?.setAttribute('aria-expanded', 'false');
}

function syncLanguagePicker(lang) {
    const meta = languageMeta[lang] || languageMeta.en;

    if (langCurrentCode) langCurrentCode.textContent = meta.label;
    if (langCurrentFlag) {
        langCurrentFlag.src = meta.flag;
        langCurrentFlag.alt = meta.alt;
    }

    if (!langMenu) return;
    langMenu.querySelectorAll('.lang-option').forEach((option) => {
        const isActive = option.getAttribute('data-lang') === lang;
        option.classList.toggle('active', isActive);
        option.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
}

langPickerTrigger?.addEventListener('click', (event) => {
    event.stopPropagation();
    closeUserMenu();
    const isOpen = langPicker?.classList.toggle('open');
    langPickerTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

langMenu?.querySelectorAll('.lang-option').forEach((option) => {
    option.addEventListener('click', () => {
        const lang = option.getAttribute('data-lang');
        if (!lang) return;
        setLanguage(lang);
        closeLanguageMenu();
        closeMobileMenu();
    });
});

document.addEventListener('click', (event) => {
    if (!langPicker?.contains(event.target)) {
        closeLanguageMenu();
    }
    if (navUserMenu && !navUserMenu.contains(event.target)) {
        closeUserMenu();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeLanguageMenu();
        closeMobileMenu();
    }
});
// Scroll reveal (Intersection Observer) — single observer block below
const reveals = document.querySelectorAll('.reveal');
const revealTimers = new WeakMap();
let revealObserver = null;

revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        const target = entry.target;
        const existingTimer = revealTimers.get(target);
        if (existingTimer) {
            clearTimeout(existingTimer);
            revealTimers.delete(target);
        }

        if (entry.isIntersecting) {
            target.classList.add('visible');
            return;
        }

        if (entry.boundingClientRect.top > window.innerHeight * 0.12 || entry.boundingClientRect.bottom < 0) {
            target.classList.remove('visible');
        }
    });
}, {
    // iOS-safe: threshold:0 fires as soon as 1px is visible
    // rootMargin: no negative offset on mobile (elements too small for -10% to work)
    threshold: _isMobile ? 0 : (isPerformanceLite ? 0.08 : 0.14),
    rootMargin: _isMobile ? '0px' : (isPerformanceLite ? '0px 0px -6% 0px' : '0px 0px -10% 0px')
});

function refreshRevealObserverTargets() {
    if (!revealObserver) return;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

    document.querySelectorAll('.reveal').forEach((el) => {
        revealObserver.observe(el);

        // Safety net: keep already-in-view sections from staying hidden after
        // language/layout updates or client-side route transitions.
        const rect = el.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < viewportHeight * 0.92) {
            el.classList.add('visible');
        }
    });
}

refreshRevealObserverTargets();

// Expose so React-mounted .reveal elements (e.g. carousel) can register after mount
window.__revealObserver = revealObserver;
window.__refreshRevealObserverTargets = refreshRevealObserverTargets;

// Re-run reveal checks after page fully loads.
// The intro overlay hides the page during initial load, so the first
// refreshRevealObserverTargets() call sees all elements as out-of-view.
// We retry at intervals until the overlay is gone, then do a final refresh.
(function scheduleRevealRetry() {
    // On mobile: use IntersectionObserver (now with threshold:0) but also
    // immediately reveal elements already in the viewport, and retry for
    // React-mounted elements. No blanket force-reveal — keeps fade animations.
    if (_isMobile) {
        // Immediately reveal elements already in viewport on load
        function mobileRevealInView() {
            var viewH = window.innerHeight || 768;
            document.querySelectorAll('.reveal').forEach(function(el) {
                var rect = el.getBoundingClientRect();
                // Reveal if any part is on screen
                if (rect.bottom > 0 && rect.top < viewH) {
                    el.classList.add('visible');
                } else {
                    // Register with observer for scroll-triggered reveal
                    if (revealObserver) revealObserver.observe(el);
                }
            });
        }
        mobileRevealInView();
        // Retry for React-mounted elements (carousel etc.)
        setTimeout(mobileRevealInView, 400);
        setTimeout(mobileRevealInView, 900);
        setTimeout(mobileRevealInView, 1600);
        setTimeout(mobileRevealInView, 2500);
        return;
    }
    // Desktop: wait for intro overlay to clear, then run full observer refresh
    var attempts = 0;
    var maxAttempts = 20;
    var interval = setInterval(function() {
        attempts++;
        var overlay = document.getElementById('introOverlay');
        var overlayGone = !overlay || overlay.hasAttribute('hidden') || overlay.style.display === 'none';
        if (overlayGone || attempts >= maxAttempts) {
            clearInterval(interval);
            refreshRevealObserverTargets();
        }
    }, 500);
})();

// Nav background on scroll
const nav = document.getElementById('navbar');
let scrollTicking = false;
window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(() => {
            nav.style.borderBottomColor = window.scrollY > 40 ? 'var(--border-strong)' : 'var(--border)';
            scrollTicking = false;
        });
        scrollTicking = true;
    }
}, { passive: true });


// ---------- Contact nav link & modal wiring ----------
document.getElementById('navContactLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeMobileMenu();
    window.location.href = '/contact';
});
document.getElementById('footerContactLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/contact';
});

// Service card click selection
document.getElementById('contactServiceGrid')?.addEventListener('click', (e) => {
    const card = e.target.closest('.contact-service-card');
    if (card && card.dataset.value) selectServiceCard(card.dataset.value);
});

document.getElementById('contactModalClose')?.addEventListener('click', () => {
    closeOverlayWithFade(document.getElementById('contactModal'));
});
document.getElementById('contactModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        closeOverlayWithFade(e.currentTarget);
    }
});
document.getElementById('contactForm')?.addEventListener('submit', handleContactSubmit);

// ---------- Navigation ----------
const sectionScrollConfig = {
    hero: { targetId: 'hero', gap: 12 },
    services: { targetId: 'servicesLead', gap: 28 },
    about: { targetId: 'about', gap: 18 }
};

function scrollToSection(id, behavior = 'smooth', updateHash = false) {
    const config = sectionScrollConfig[id] || { targetId: id, gap: 12 };
    const target = document.getElementById(config.targetId) || document.getElementById(id);
    if (!target) return false;

    const nav = document.getElementById('navbar');
    const navHeight = nav?.offsetHeight || 0;
    const absoluteTop = window.scrollY + target.getBoundingClientRect().top;
    const top = Math.max(0, absoluteTop - navHeight - config.gap);

    window.scrollTo({ top, behavior });
    requestAnimationFrame(() => {
        refreshRevealObserverTargets();
    });

    if (updateHash) {
        const nextHash = `#${id}`;
        const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
        window.history.replaceState(null, '', nextUrl);
    }

    return true;
}

function alignHashSection(behavior = 'auto') {
    if (window.location.pathname !== '/') return;

    const hashId = window.location.hash.replace('#', '');
    if (!hashId || !sectionScrollConfig[hashId]) return;

    requestAnimationFrame(() => {
        scrollToSection(hashId, behavior, false);
    });
}

function closeMobileMenu() {
    setMobileMenuOpen(false);
}

const emulatedTouchScrollState = {
    active: false,
    lastY: 0,
};

function shouldUseEmulatedTouchScroll(event) {
    if (window.innerWidth > 768) return false;
    if (event.pointerType !== 'mouse') return false;
    if (document.body.classList.contains('mobile-nav-open')) return false;
    if (document.querySelector('.modal-overlay.active')) return false;
    if (!(event.target instanceof Element)) return false;
    if (event.target.closest('.nav, .modal-overlay, .carousel-scene, .carousel-arrow, .lang-menu, .nav-user-dropdown')) return false;
    return true;
}

document.addEventListener('pointerdown', (event) => {
    if (!shouldUseEmulatedTouchScroll(event)) return;
    emulatedTouchScrollState.active = true;
    emulatedTouchScrollState.lastY = event.clientY;
}, { passive: true });

document.addEventListener('pointermove', (event) => {
    if (!emulatedTouchScrollState.active) return;
    const deltaY = emulatedTouchScrollState.lastY - event.clientY;
    if (Math.abs(deltaY) < 1) return;
    window.scrollBy(0, deltaY);
    emulatedTouchScrollState.lastY = event.clientY;
}, { passive: true });

function stopEmulatedTouchScroll() {
    emulatedTouchScrollState.active = false;
}

document.addEventListener('pointerup', stopEmulatedTouchScroll, { passive: true });
document.addEventListener('pointercancel', stopEmulatedTouchScroll, { passive: true });
document.addEventListener('lostpointercapture', stopEmulatedTouchScroll, { passive: true });

document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;

    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    const url = new URL(link.href, window.location.href);
    const hashId = url.hash.replace('#', '');

    if (!sectionScrollConfig[hashId]) return;
    if (url.origin !== window.location.origin || url.pathname !== '/') return;
    if (window.location.pathname !== '/') return;

    e.preventDefault();
    scrollToSection(hashId, 'smooth', true);
    closeMobileMenu();
});

window.addEventListener('hashchange', () => {
    alignHashSection('smooth');
});

window.addEventListener('load', () => {
    alignHashSection('auto');
});

window.addEventListener('turtleshell-intro-finished', () => {
    alignHashSection('smooth');
});

// ---------- Focus Trap Utility ----------
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
let _trapCleanup = null;
function trapFocus(modal, triggerEl) {
    if (_trapCleanup) _trapCleanup();
    const focusable = () => Array.from(modal.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null);
    requestAnimationFrame(() => { const f = focusable(); if (f.length) f[0].focus(); });
    function onKeydown(e) {
        if (e.key !== 'Tab') return;
        const els = focusable();
        if (!els.length) return;
        if (e.shiftKey) {
            if (document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
        } else {
            if (document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
        }
    }
    modal.addEventListener('keydown', onKeydown);
    _trapCleanup = () => {
        modal.removeEventListener('keydown', onKeydown);
        if (triggerEl && typeof triggerEl.focus === 'function') triggerEl.focus();
        _trapCleanup = null;
    };
}
function releaseFocus() { if (_trapCleanup) _trapCleanup(); }

// ---------- Modals ----------
function openLoginModal() {
    const _lm = document.getElementById('loginModal');
    _lm?.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (_lm) trapFocus(_lm, document.activeElement);
}

function closeLoginModal() {
    document.getElementById('loginModal')?.classList.remove('active');
    document.body.style.overflow = '';
    releaseFocus();
}



function openSignupModal() {
    document.getElementById('signupStep1').style.display = '';
    document.getElementById('signupStep2').style.display = 'none';
    const _sm = document.getElementById('signupModal');
    _sm?.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (_sm) trapFocus(_sm, document.activeElement);
}

function closeSignupModal() {
    document.getElementById('signupModal')?.classList.remove('active');
    document.body.style.overflow = '';
    releaseFocus();
}

function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value.trim();

    // Transition to step 2
    document.getElementById('signupStep1').style.display = 'none';
    document.getElementById('signupWelcomeMsg').textContent = `Welcome, ${username}. Your account is ready.`;
    document.getElementById('signupConfirmUsername').textContent = username;
    document.getElementById('signupStep2').style.display = '';
}

function finishSignup() {
    closeSignupModal();
    showBotsDashboard();
    setLoggedIn(document.getElementById('signupConfirmUsername').textContent);
    showToast('Account created! Welcome to TURTLESHELL. 🐢');
}

function openContactModal(projectType) {
    // Reset to step 1
    const step1 = document.getElementById('contactStep1');
    const step2 = document.getElementById('contactStep2');
    if (step1) step1.style.display = '';
    if (step2) step2.style.display = 'none';

    const form = document.getElementById('contactForm');

    // Reset form first so the chosen service is not overwritten by defaultChecked/default selected values
    form?.reset();

    // Set project type in hidden select + badge
    const select = document.getElementById('contactProject');
    const badge = document.getElementById('contactBadge');
    const activeType = projectType || 'NEXUS';

    if (select) {
        select.value = activeType;
    }
    if (badge) {
        const icons = { NEXUS: '🤖', ATLAS: '🌐', GENOS: '📱', Other: '💬', '': '🐢' };
        badge.textContent = (icons[activeType] || '🐢') + ' ' + (activeType || 'Get in touch');
    }

    // Sync service cards
    selectServiceCard(activeType);

    // UX Logic: Lock the service selector and update title if a specific project was requested
    const titleEl = document.getElementById('contact-modal-title');
    const serviceGridGroup = document.getElementById('contactServiceGrid')?.closest('.form-group');

    if (projectType) {
        if (titleEl) {
            if (!titleEl.hasAttribute('data-original')) {
                titleEl.setAttribute('data-original', titleEl.textContent);
            }
            const isAr =
                document.documentElement.getAttribute('lang') === 'ar' ||
                document.body.classList.contains('lang-ar');
            if (projectType === 'NEXUS') titleEl.textContent = isAr ? 'ابدأ مشروع الأتمتة NEXUS' : 'Start NEXUS Automation';
            else if (projectType === 'ATLAS') titleEl.textContent = isAr ? 'ابدأ نظام الويب ATLAS' : 'Start ATLAS Web System';
            else if (projectType === 'GENOS') titleEl.textContent = isAr ? 'ابدأ تطبيق الموبايل GENOS' : 'Start GENOS Mobile App';
        }
        if (serviceGridGroup) serviceGridGroup.style.display = 'none';
    } else {
        if (titleEl && titleEl.hasAttribute('data-original')) {
            titleEl.textContent = titleEl.getAttribute('data-original');
        }
        if (serviceGridGroup) serviceGridGroup.style.display = '';
    }

    const _cm = document.getElementById('contactModal');
    _cm?.classList.toggle('contact-modal--service-locked', !!projectType);
    _cm?.classList.remove('is-closing');
    _cm?.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (_cm) trapFocus(_cm, document.activeElement);
}

function selectServiceCard(value) {
    const cards = document.querySelectorAll('.contact-service-card');
    const select = document.getElementById('contactProject');
    cards.forEach(card => {
        const isSelected = card.dataset.value === value;
        card.classList.toggle('contact-service-card--selected', isSelected);
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = isSelected;
    });
    if (select) {
        for (let opt of select.options) {
            if (opt.value === value) { opt.selected = true; break; }
        }
    }
}

function closeModal(event, modalId) {
    if (event.target === event.currentTarget) {
        closeOverlayWithFade(document.getElementById(modalId));
    }
}

function closeOverlayWithFade(overlay) {
    if (!overlay) return;
    overlay.classList.add('is-closing');
    overlay.classList.remove('active');
    setTimeout(() => {
        overlay.classList.remove('is-closing');
    }, 340);
    document.body.style.overflow = '';
    releaseFocus();
}

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => {
            closeOverlayWithFade(m);
        });
    }
});

// ---------- Form Handlers ----------
// ── Auth helpers ──────────────────────────────────────────────
function getAccounts() {
    return JSON.parse(localStorage.getItem('ts_accounts') || '[]');
}
function saveAccounts(accounts) {
    localStorage.setItem('ts_accounts', JSON.stringify(accounts));
}

function handleLogin(e) {
    e.preventDefault();
    const id = document.getElementById('loginIdentifier').value.trim().toLowerCase();
    const pw = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');

    const accounts = getAccounts();
    const match = accounts.find(a =>
        a.username.toLowerCase() === id ||
        a.email.toLowerCase() === id ||
        (a.phone && a.phone.replace(/\s/g, '') === id.replace(/\s/g, ''))
    );

    if (!match) {
        errEl.textContent = 'No account found with that username, email or phone.';
        errEl.style.display = 'block'; return;
    }
    if (match.password !== pw) {
        errEl.textContent = 'Incorrect password.';
        errEl.style.display = 'block'; return;
    }

    errEl.style.display = 'none';
    closeLoginModal();
    setLoggedIn(match.email, match.username, match.fullName);
    showToast(`Welcome back, ${match.fullName || match.username}! 🐢`);
}

function handleSignup(e) {
    e.preventDefault();
    const fullName = document.getElementById('signupFullName').value.trim();
    const username = document.getElementById('signupUsername').value.trim().toLowerCase();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value;
    const errEl = document.getElementById('signupError');

    const accounts = getAccounts();

    if (accounts.find(a => a.username === username)) {
        errEl.textContent = 'That username is already taken.';
        errEl.style.display = 'block'; return;
    }
    if (accounts.find(a => a.email === email)) {
        errEl.textContent = 'An account with that email already exists.';
        errEl.style.display = 'block'; return;
    }

    const newAccount = { fullName, username, email, phone, password, createdAt: Date.now() };
    accounts.push(newAccount);
    saveAccounts(accounts);

    // Show success step
    errEl.style.display = 'none';
    document.getElementById('signupStep1').style.display = 'none';
    document.getElementById('signupStep2').style.display = 'block';
    document.getElementById('signupConfirmUsername').textContent = `@${username}`;

    setLoggedIn(email, username, fullName);
}

function finishSignup() {
    closeSignupModal();
    showToast('Account created successfully! 🐢');
}

async function handleContactSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const whatsapp = document.getElementById('contactWhatsapp')?.value.trim() || '';
    const project = document.getElementById('contactProject')?.value || '';
    const message = document.getElementById('contactMessage').value.trim();

    // Build WhatsApp pre-fill link using their number if provided
    const waNumber = '966558327668'; // digits only (country code + number)
    const waMsg = encodeURIComponent(`Hi! I submitted a request for ${project}.\nName: ${name}\nEmail: ${email}`);
    const waHref = `https://wa.me/${waNumber}?text=${waMsg}`;
    document.getElementById('contactWaDirectLink')?.setAttribute('href', waHref);
    document.getElementById('contactWaSuccessLink')?.setAttribute('href', waHref);
    document.getElementById('waFloater')?.setAttribute('href', `https://wa.me/${waNumber}`);

    const showContactSuccessStep = () => {
        const step1 = document.getElementById('contactStep1');
        const step2 = document.getElementById('contactStep2');
        const modalCard = document.querySelector('#contactModal .modal');

        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = '';

        requestAnimationFrame(() => {
            if (modalCard && typeof modalCard.scrollTo === 'function') {
                modalCard.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            } else if (modalCard) {
                modalCard.scrollTop = 0;
            }

            const successAction = document.getElementById('contactWaSuccessLink');
            try {
                successAction?.focus({ preventScroll: true });
            } catch {
                successAction?.focus();
            }
        });
    };

    // No endpoint yet — show success step
    if (!CONTACT_ENDPOINT) {
        showContactSuccessStep();
        return;
    }

    // With endpoint
    const btn = e.target.querySelector('[type="submit"]');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>Sending…</span>';

    try {
        const res = await fetch(CONTACT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ name, email, whatsapp, project, message }),
        });
        if (res.status === 401) {
            // Not signed in — redirect to login
            window.location.href = '/login?message=' + encodeURIComponent('Sign in to send a request');
            return;
        }
        if (res.ok) {
            showContactSuccessStep();
        } else {
            throw new Error(`${res.status}`);
        }
    } catch {
        showToast('Something went wrong. Email us at hello.turtleshell@gmail.com');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

// ---------- Bots Dashboard Toggle ----------
function showBotsDashboard() {
    const botsSection = document.getElementById('bots');
    const botsNav = document.getElementById('navBotsLink');

    botsSection?.classList.add('visible');
    botsNav?.classList.remove('hidden');

    // Scroll to bots section
    setTimeout(() => {
        botsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Trigger reveals inside
        botsSection?.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    }, 300);
}

// ---------- Nav Auth State ----------
function setLoggedIn(email, username, fullName) {
    const display = fullName || username || email || 'User';
    document.getElementById('navLoginItem')?.classList.add('hidden');
    document.getElementById('navUserItem')?.classList.remove('hidden');
    document.getElementById('navUserName').textContent = display;
    document.getElementById('navUserAvatar').textContent = display.charAt(0).toUpperCase();
    localStorage.setItem('ts_session', JSON.stringify({ email, username, fullName }));
}

function setLoggedOut() {
    document.getElementById('navLoginItem')?.classList.remove('hidden');
    document.getElementById('navUserItem')?.classList.add('hidden');
    localStorage.removeItem('ts_session');
}

function handleLogout() {
    setLoggedOut();
    hideBotsDashboard();
    showToast('Signed out. See you soon! 🐢');
}

function hideBotsDashboard() {
    const botsSection = document.getElementById('bots');
    const botsNav = document.getElementById('navBotsLink');

    botsSection?.classList.remove('visible');
    botsNav?.classList.add('hidden');
}

// Demo toggle (footer link), toggles bots on/off for preview
let botsVisible = false;
function toggleBotsDemo() {
    botsVisible = !botsVisible;
    if (botsVisible) {
        showBotsDashboard();
        showToast('Demo: Your Bots dashboard is now visible');
    } else {
        hideBotsDashboard();
        showToast('Demo: Your Bots dashboard is now hidden');
    }
}

// ---------- Toast Notifications ----------
function showToast(message) {
    // Remove existing
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%) translateY(20px)',
        background: 'var(--text)',
        color: 'var(--bg)',
        padding: '12px 24px',
        borderRadius: 'var(--radius-full)',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: 'var(--shadow-lg)',
        zIndex: '3000',
        opacity: '0',
        transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
        whiteSpace: 'nowrap',
        maxWidth: '90vw',
        textAlign: 'center',
        fontFamily: "'Inter', sans-serif",
    });

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Animate out
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

/* ============================================================================
   Internationalization (i18n)
   ============================================================================ */

const translations = {
    en: {
        nav_nexus: "NEXUS",
        nav_atlas: "ATLAS",
        nav_home: "Home",
        nav_services: "Services",
        nav_about: "About",
        nav_contact: "Contact",
        nav_bots: "Your Bots",
        nav_login: "Login",
        hero_open_systems: "Open Systems",
        nav_dashboard: "Dashboard",
        nav_navigation: "Navigation",
        nav_account: "Account",
        nav_preferences: "Preferences",
        nav_account_settings: "Account settings",
        nav_signout: "Sign out",
        hero_title: "Build. Automate. Scale.",
        hero_desc: "Custom automation engines and modern web systems, engineered to run 24/7, scale cleanly, and stay secure.",
        hero_btn_explore: "Explore Services",
        hero_btn_login: "Get Started",
        hero_btn_learn: "Launch ATLAS",
        services_title: "Deploy Your Infrastructure",
        services_desc: "Choose NEXUS for automation, ATLAS for web, or GENOS for mobile, built, deployed, and maintained for you.",
        card_nexus_title: "NEXUS",
        card_nexus_sub: "Automation Infrastructure",
        card_nexus_desc: "Custom automation systems built for your workflow, hosted, monitored, and maintained.",
        card_nexus_cta: "Request NEXUS",
        card_atlas_title: "ATLAS",
        card_atlas_sub: "Web Infrastructure",
        card_atlas_desc: "Modern websites and web systems, landing pages, business sites, dashboards, and custom platforms.",
        card_atlas_cta: "Start ATLAS",
        card_genos_title: "GENOS",
        card_genos_sub: "Mobile Infrastructure",
        card_genos_desc: "Native and cross-platform mobile applications, built, deployed, and maintained for your business.",
        card_genos_cta: "Build with GENOS",
        about_title: "Digital Infrastructure. Built For You.",
        about_desc1: `TURTLESHELL builds digital infrastructure across automation (<span class="text-glow-blue">NEXUS</span>), web systems (<span class="text-glow-blue">ATLAS</span>), and mobile apps (<span class="text-glow-blue">GENOS</span>). From internal workflows to customer-facing products, we design, deploy, and maintain platforms that run <span class="text-glow-blue">24/7</span>.`,
        about_desc2: "Built with performance, security, and reliability first, TURTLESHELL helps teams automate operations, ship modern web experiences, and launch mobile products without managing heavy infrastructure alone.",
        about_founder: "Founded by",
        stat_bots: "Systems Uptime",
        stat_custom: "Custom Built",
        stat_security: "Security-First",
        stat_potential: "Built to Scale",
        footer_copy: "© 2026 TURTLESHELL. All rights reserved.",
        footer_contact: "Contact",
        footer_demo: "⚙ Demo",

        // Modals
        modal_login_title: "Welcome back",
        modal_login_desc: "Sign in to access your dashboard and manage your bots.",
        btn_google: "Continue with Google",
        modal_divider: "or sign in with email",
        label_email: "Email",
        label_password: "Password",
        btn_signin: "Sign In",

        modal_contact_title: "Request a Custom Bot",
        modal_contact_desc: "Tell us what you need automated. We'll get back to you within 24 hours with a plan and quote.",
        label_name: "Your Name",
        label_message: "What do you want to automate?",
        btn_send_request: "Send Request",
        contact_footer_email: "Or email us directly at",
        contact_footer_dm: "DM on X:",

        // Placeholders
        ph_name: "John Doe",
        ph_email: "you@example.com",
        ph_message: "Describe your automation needs...",

        // Nexus Dashboard
        nexus_subtitle: "Custom Repost / Reply on Command",
        status_stopped: "Stopped",
        section_controls: "Controls",
        btn_start: "▶ Start Bot",
        btn_stop: "■ Stop Bot",
        error_title: "Bot encountered an error.",
        error_detail: "If the problem persists, please contact support.",
        section_google: "Google Account",
        google_desc: "The bot logs into Twitter using your Google account. Enter your credentials here. They're saved locally to your config only.",
        label_google_email: "Google Email",
        ph_google_email: "you@gmail.com",
        label_google_password: "Google Password",
        ph_google_password: "••••••••",
        btn_save_account: "Save Account",
        section_settings: "Settings",
        label_keyword: "Keyword",
        ph_keyword: "e.g. Yes",
        label_reply: "Reply Message",
        ph_reply: "e.g. Thanks",
        label_interval: "Interval (seconds)",
        ph_interval: "e.g. 20",
        label_passcode: "Passcode",
        ph_passcode: "••••",
        label_allowed: "Allowed Accounts",
        allowed_desc: "Only reply to these accounts. Leave empty to reply to anyone.",
        ph_allowed: "@username1, @username2 ...",
        section_allowed: "Allowed Accounts",
        btn_save_accounts: "Save Accounts",
        btn_save_settings: "Save Settings",
        section_log: "Activity Log",
        log_empty: "No activity yet. Start the bot to see logs here.",
        status_online: "Online",
        btn_starting: "▶ Starting",
        btn_running: '<span class="btn-running-dot"></span> Running',
        btn_stopping: "■ Stopping",
        btn_saving: "Saving…",
        btn_saved: "Saved!",
        nexus_loading: "Loading...",
        nexus_back: "← Back to Systems",
        nexus_title: "Automation Infrastructure",
        nexus_page_subtitle: "Your active automation bots and workflows.",
        nexus_empty_title: "No bots assigned yet",
        nexus_empty_desc: "Your automation bots will appear here once configured.",
        nexus_bot_tag: "NEXUS BOT",
        nexus_bot_desc_fallback: "Custom automation bot running 24/7.",
        nexus_status_active: "Active",
        nexus_status_paused: "Paused",
        nexus_open_bot: "Open",

        // Systems Dashboard
        dash_label: "Dashboard",
        dash_welcome: "Welcome back",
        dash_subtitle: "Your active infrastructure is below. Contact us to add more services.",
        svc_nexus_sub: "Automation Infrastructure",
        svc_nexus_desc: "Your custom automation systems, bots, workflows, and scheduled tasks running 24/7.",
        svc_atlas_sub: "Web Infrastructure",
        svc_atlas_desc: "Your websites, dashboards, and web platforms, built, deployed, and maintained.",
        svc_genos_sub: "Mobile Infrastructure",
        svc_genos_desc: "Native and cross-platform mobile applications built for your business.",
        svc_access: "Access",
        svc_locked: "🔒 Not Available",

        // Account Page
        acct_title: "Account",
        acct_subtitle: "Manage your profile and security settings.",
        acct_back: "← Back to dashboard",
        acct_profile: "PROFILE",
        acct_lock_msg: "Username and email cannot be changed.",
        acct_lock_support: "contact support",
        acct_lock_detail: "If you need to update them, please",
        acct_email: "Email",
        acct_username: "Username",
        acct_locked_badge: "locked",
        acct_fullname: "Full Name",
        acct_fullname_hint: "(editable)",
        acct_fullname_ph: "Your full name",
        acct_save: "Save",
        acct_password: "PASSWORD",
        acct_new_pass: "New Password",
        acct_new_pass_ph: "Min. 8 characters",
        acct_confirm_pass: "Confirm New Password",
        acct_confirm_pass_ph: "Repeat new password",
        acct_update_pass: "Update Password",
        acct_forgot: "Forgot your password? We'll send a reset link to your email.",
        acct_send_reset: "Send Reset Email",
        acct_sending: "Sending...",
        acct_saving: "Saving...",
        acct_account_section: "ACCOUNT",
        acct_contact_note: "Need to delete your account or change your email? Contact our support team.",
        acct_contact_btn: "Contact Support",
        acct_oauth_note: "You signed in with Google. Password management is handled by Google.",
        acct_loading: "Loading...",
        acct_pass_mismatch: "Passwords do not match.",
        acct_pass_short: "Password must be at least 8 characters.",
        acct_name_saved: "Name updated successfully.",
        acct_pass_saved: "Password updated successfully.",
        acct_reset_sent: "Reset link sent to",

        // Login Page
        login_title: "Welcome back",
        login_desc: "Sign in to access your systems.",
        signup_title: "Create account",
        signup_desc: "Join TURTLESHELL to manage your infrastructure.",
        login_fullname: "Full Name",
        login_fullname_ph: "turtle123",
        login_email: "Email",
        login_password: "Password",
        login_pass_ph_signup: "Min. 8 characters",
        login_pass_ph: "••••••••",
        login_or: "or",
        login_btn: "Sign In",
        signup_btn: "Create Account",
        login_loading: "Please wait...",
        login_no_account: "Don't have an account?",
        login_sign_up: "Sign up",
        login_have_account: "Already have an account?",
        login_sign_in: "Sign in",
        login_check_email: "Check your email for a confirmation link.",
        auth_failed: "Authentication failed. Please try again.",
        generic_error: "Something went wrong",
        login_lock_warning: "Username and email cannot be changed after account creation. If you ever need to update them, you'll need to contact support.",
        login_choose_carefully: "Choose carefully.",
        service_final_desc: "Tell us what you need and we will scope architecture, timeline, and delivery.",
        nexus_badge: "AUTOMATION INFRASTRUCTURE",
        nexus_title: "NEXUS",
        nexus_hero_desc: "Custom automation systems engineered to eliminate repetitive tasks, connect your tools, and scale your operations 24/7.",
        nexus_cta: "Start Your NEXUS System",
        nexus_jump_cta: "See automation capabilities ↓",
        nexus_what_title: "What is NEXUS?",
        nexus_what_desc1: "NEXUS is our flagship automation infrastructure. We build custom bots, scripts, and background workers that talk to your APIs, manage your data, and handle the heavy lifting so your team doesn't have to.",
        nexus_benefits_title: "Core Capabilities",
        nexus_capability_1_title: "Workflow Automation",
        nexus_capability_1_desc: "Connect disparate SaaS tools (CRM, Slack, Email) into one seamless pipeline.",
        nexus_capability_2_title: "Data Extraction & Processing",
        nexus_capability_2_desc: "Automated web scraping, data formatting, and automated reporting systems.",
        nexus_capability_3_title: "AI Integration",
        nexus_capability_3_desc: "Embed custom LLMs into your workflows to categorize, respond, and process natural language automatically.",
        nexus_stat_1_value: "Custom",
        nexus_stat_1_label: "Tailored Architecture",
        nexus_stat_2_label: "Cloud Hosted",
        nexus_stat_3_label: "Seamless Integrations",
        nexus_ready: "Ready to automate?",
        nexus_cta_bottom: "Request NEXUS Quote",
        nexus_final_title: "Ready to build with NEXUS?",
        nexus_final_button: "Request NEXUS",
        atlas_badge: "WEB INFRASTRUCTURE",
        atlas_title: "ATLAS",
        atlas_hero_desc: "Modern websites and web systems, landing pages, business sites, dashboards, and custom web platforms.",
        atlas_cta: "Start Your ATLAS Project",
        atlas_jump_cta: "See platform features ↓",
        atlas_what_title: "What is ATLAS?",
        atlas_what_desc1: "ATLAS handles everything web. From high-converting landing pages to complex secure dashboards and custom SaaS products, we engineer web experiences that perform under pressure.",
        atlas_benefits_title: "Core Capabilities",
        atlas_capability_1_title: "Business Sites & Landing Pages",
        atlas_capability_1_desc: "Blazing fast, SEO-optimized, pixel-perfect sites designed to convert visitors into clients.",
        atlas_capability_2_title: "Custom Web Platforms",
        atlas_capability_2_desc: "Internal tools, CMS, and specialized SaaS architectures built specifically for your needs.",
        atlas_capability_3_title: "Client Dashboards",
        atlas_capability_3_desc: "Secure, data-driven interfaces for your clients to track metrics or interact with your service.",
        atlas_stat_1_value: "Custom",
        atlas_stat_1_label: "Tailored Delivery",
        atlas_stat_2_label: "Ultra Fast Performance",
        atlas_stat_3_label: "Search Optimized",
        atlas_ready: "Ready to build your web presence?",
        atlas_cta_bottom: "Request ATLAS Quote",
        atlas_final_title: "Ready to build with ATLAS?",
        atlas_final_button: "Request ATLAS",
        genos_badge: "MOBILE INFRASTRUCTURE",
        genos_title: "GENOS",
        genos_hero_desc: "Native and cross-platform mobile applications, built from the ground up, deployed to app stores, and maintained for your business.",
        genos_cta: "Build with GENOS",
        genos_jump_cta: "See capabilities ↓",
        genos_what_title: "What is GENOS?",
        genos_what_desc1: "GENOS is our mobile application unit. Whether it's iOS or Android, we develop sleek, high-performing apps that keep your users engaged on the devices they carry every day.",
        genos_benefits_title: "Core Capabilities",
        genos_capability_1_title: "Cross-Platform Mastery",
        genos_capability_1_desc: "Write once, deploy everywhere. High-performance apps for both iOS and Android simultaneously.",
        genos_capability_2_title: "Native Experiences",
        genos_capability_2_desc: "Smooth, intuitive UIs that feel right at home on massive tablets and compact phones.",
        genos_capability_3_title: "Store Deployment & Updates",
        genos_capability_3_desc: "We navigate Apple and Google's complex review systems to push your app and updates live seamlessly.",
        genos_stat_1_value: "Custom",
        genos_stat_1_label: "Tailored Development",
        genos_stat_2_label: "Cross Platform",
        genos_stat_3_label: "Cloud Backend Ready",
        genos_ready: "Ready to launch your app?",
        genos_cta_bottom: "Request GENOS Quote",
        genos_final_title: "Ready to build with GENOS?",
        genos_final_button: "Request GENOS"
    },
    ar: { // Saudi Formal / Modern Standard
        nav_nexus: "نيكسوس",
        nav_atlas: "أطلس", nav_home: "الرئيسية",
        nav_services: "الخدمات",
        nav_about: "عنّا",
        nav_contact: "تواصل معنا",
        nav_bots: "روبوتاتك",
        nav_login: "تسجيل الدخول",
        hero_open_systems: "فتح الأنظمة",
        nav_dashboard: "لوحة التحكم",
        nav_navigation: "التنقل",
        nav_account: "الحساب",
        nav_preferences: "التفضيلات",
        nav_account_settings: "إعدادات الحساب",
        nav_signout: "تسجيل الخروج",
        hero_title: "\u0627\u0628\u0646\u0650. \u0623\u062a\u0645\u062a. \u0648\u0633\u0650\u0651\u0639.",
        hero_desc: "محركات أتمتة مخصصة وأنظمة ويب حديثة، مصممة للعمل على مدار الساعة والتوسع بكفاءة.",
        hero_btn_explore: "استكشف الخدمات",
        hero_btn_login: "ابدأ الآن",
        hero_btn_learn: "إطلاق أطلس",
        services_title: "انشر بنيتك التحتية",
        services_desc: "اختر نيكسوس للأتمتة أو أطلس لأنظمة الويب أو جينوس للموبايل، مبنية ومنشورة ومصانة لك.",
        card_nexus_title: "نيكسوس",
        card_nexus_sub: "بنية الأتمتة",
        card_nexus_desc: "أنظمة أتمتة مخصصة لسير عملك، مستضافة ومراقبة ومصانة.",
        card_nexus_cta: "اطلب نيكسوس",
        card_atlas_title: "أطلس",
        card_atlas_sub: "بنية الويب",
        card_atlas_desc: "مواقع ويب وأنظمة حديثة، صفحات هبوط وأعمال ولوحات تحكم ومنصات مخصصة.",
        card_atlas_cta: "ابدأ مع أطلس",
        card_genos_title: "جينوس",
        card_genos_sub: "بنية الموبايل",
        card_genos_desc: "تطبيقات موبايل أصلية ومتعددة المنصات، مبنية ومنشورة ومصانة لعملك.",
        card_genos_cta: "ابنِ مع جينوس",
        about_title: "بنية رقمية. مصممة لك.",
        about_desc1: `تبني TURTLESHELL بنية رقمية متكاملة تشمل الأتمتة (<span class="text-glow-blue">نيكسوس</span>)، وأنظمة الويب (<span class="text-glow-blue">أطلس</span>)، وتطبيقات الجوال (<span class="text-glow-blue">جينوس</span>). من سير العمل الداخلي إلى المنتجات الموجهة للعملاء، نقوم بالتصميم والنشر والإدارة لمنصات تعمل <span class="text-glow-blue">24/7</span>.`,
        about_desc2: "بأولوية للأداء والأمان والموثوقية، تساعد TURTLESHELL الفرق على أتمتة العمليات، وإطلاق تجارب ويب حديثة، وتطوير منتجات جوال بدون عبء إدارة بنية تحتية معقدة.",
        about_founder: "تأسست بواسطة",
        stat_bots: "طول الوقت عندك",
        stat_custom: "تصميم مخصص",
        stat_security: "الأمان أولاً",
        stat_potential: "فرص لا نهائية",
        footer_copy: "© 2026 TURTLESHELL. جميع الحقوق محفوظة.",
        footer_contact: "تواصل معنا",
        footer_demo: "⚙ تجربة",

        // Modals
        modal_login_title: "أهلاً بعودتك",
        modal_login_desc: "سجل الدخول للوصول إلى لوحة التحكم وإدارة روبوتاتك.",
        btn_google: "المتابعة باستخدام Google",
        modal_divider: "أو سجل الدخول بالبريد الإلكتروني",
        label_email: "البريد الإلكتروني",
        label_password: "كلمة المرور",
        btn_signin: "تسجيل الدخول",

        modal_contact_title: "اطلب روبوت مخصص",
        modal_contact_desc: "أخبرنا باحتياجاتك للأتمتة. سنرد عليك خلال 24 ساعة بخطة وعرض سعر.",
        label_name: "الاسم",
        label_message: "ماذا تريد أن تؤتمت؟",
        btn_send_request: "أرسل الطلب",
        contact_footer_email: "أو راسلنا مباشرة على",
        contact_footer_dm: "تواصل معنا عبر X:",

        // Placeholders
        ph_name: "الاسم الكامل",
        ph_email: "example@mail.com",
        ph_message: "صف احتياجاتك بالتفصيل...",

        // Nexus Dashboard
        nexus_subtitle: "إعادة نشر / رد تلقائي",
        status_stopped: "متوقف",
        section_controls: "التحكم",
        btn_start: "▶ تشغيل الروبوت",
        btn_stop: "■ إيقاف الروبوت",
        error_title: "واجه الروبوت خطأ.",
        error_detail: "إذا استمرت المشكلة، يرجى الاتصال بالدعم.",
        section_google: "حساب جوجل",
        google_desc: "يسجل الروبوت الدخول إلى تويتر باستخدام حساب جوجل الخاص بك. أدخل بياناتك هنا. يتم حفظها محلياً في الإعدادات الخاصة بك فقط.",
        label_google_email: "البريد الإلكتروني لجوجل",
        ph_google_email: "you@gmail.com",
        label_google_password: "كلمة مرور جوجل",
        ph_google_password: "••••••••",
        btn_save_account: "حفظ الحساب",
        section_settings: "الإعدادات",
        label_keyword: "الكلمة المفتاحية",
        ph_keyword: "مثال: تم",
        label_reply: "رسالة الرد",
        ph_reply: "مثال: تم",
        label_interval: "الفترة (بالثواني)",
        ph_interval: "مثال: 20",
        label_passcode: "رمز الدخول",
        ph_passcode: "••••",
        label_allowed: "الحسابات المسموحة",
        allowed_desc: "الرد على هذه الحسابات فقط. اتركه فارغاً للرد على أي شخص.",
        ph_allowed: "@username1, @username2 ...",
        section_allowed: "الحسابات المسموحة",
        btn_save_accounts: "حفظ الحسابات",
        btn_save_settings: "حفظ الإعدادات",
        section_log: "سجل النشاط",
        log_empty: "لا يوجد نشاط بعد. قم بتشغيل الروبوت لرؤية السجل هنا.",
        status_online: "متصل",
        btn_starting: "▶ جاري التشغيل",
        btn_running: '<span class="btn-running-dot"></span> قيد التشغيل',
        btn_stopping: "■ جاري الإيقاف",
        btn_saving: "جاري الحفظ...",
        btn_saved: "تم الحفظ!",
        nexus_loading: "جاري التحميل...",
        nexus_back: "→ العودة إلى الأنظمة",
        nexus_title: "بنية الأتمتة",
        nexus_page_subtitle: "روبوتاتك النشطة وسير العمل الخاص بك.",
        nexus_empty_title: "لا توجد روبوتات مخصصة بعد",
        nexus_empty_desc: "ستظهر روبوتات الأتمتة هنا بعد إعدادها.",
        nexus_bot_tag: "روبوت نيكسوس",
        nexus_bot_desc_fallback: "روبوت أتمتة مخصص يعمل على مدار الساعة.",
        nexus_status_active: "نشط",
        nexus_status_paused: "متوقف مؤقتًا",
        nexus_open_bot: "فتح",

        // Systems Dashboard
        dash_label: "لوحة التحكم",
        dash_welcome: "أهلاً بعودتك",
        dash_subtitle: "بنيتك التحتية النشطة أدناه. تواصل معنا لإضافة المزيد من الخدمات.",
        svc_nexus_sub: "بنية الأتمتة",
        svc_nexus_desc: "أنظمة الأتمتة المخصصة لك وتشمل روبوتات وسير عمل ومهام مجدولة تعمل على مدار الساعة.",
        svc_atlas_sub: "بنية الويب",
        svc_atlas_desc: "مواقعك ولوحات تحكمك ومنصات الويب، مبنية ومنشورة ومصانة.",
        svc_genos_sub: "بنية الموبايل",
        svc_genos_desc: "تطبيقات موبايل أصلية ومتعددة المنصات مبنية لعملك.",
        svc_access: "الوصول",
        svc_locked: "🔒 غير متاح",

        // Account Page
        acct_title: "الحساب",
        acct_subtitle: "إدارة ملفك الشخصي وإعدادات الأمان.",
        acct_back: "→ العودة إلى لوحة التحكم",
        acct_profile: "الملف الشخصي",
        acct_lock_msg: "لا يمكن تغيير اسم المستخدم والبريد الإلكتروني.",
        acct_lock_support: "التواصل مع الدعم",
        acct_lock_detail: "إذا كنت بحاجة إلى تحديثهما، يرجى",
        acct_email: "البريد الإلكتروني",
        acct_username: "اسم المستخدم",
        acct_locked_badge: "مقفل",
        acct_fullname: "الاسم الكامل",
        acct_fullname_hint: "(قابل للتعديل)",
        acct_fullname_ph: "اسمك الكامل",
        acct_save: "حفظ",
        acct_password: "كلمة المرور",
        acct_new_pass: "كلمة المرور الجديدة",
        acct_new_pass_ph: "٨ أحرف على الأقل",
        acct_confirm_pass: "تأكيد كلمة المرور الجديدة",
        acct_confirm_pass_ph: "أعد كتابة كلمة المرور",
        acct_update_pass: "تحديث كلمة المرور",
        acct_forgot: "نسيت كلمة المرور؟ سنرسل رابط إعادة تعيين إلى بريدك الإلكتروني.",
        acct_send_reset: "إرسال رابط الإعادة",
        acct_sending: "جاري الإرسال...",
        acct_saving: "جاري الحفظ...",
        acct_account_section: "الحساب",
        acct_contact_note: "تريد حذف حسابك أو تغيير بريدك الإلكتروني؟ تواصل مع فريق الدعم.",
        acct_contact_btn: "تواصل مع الدعم",
        acct_oauth_note: "سجلت الدخول باستخدام Google. تتم إدارة كلمة المرور عبر Google.",
        acct_loading: "جاري التحميل...",
        acct_pass_mismatch: "كلمتا المرور غير متطابقتين.",
        acct_pass_short: "يجب أن تكون كلمة المرور ٨ أحرف على الأقل.",
        acct_name_saved: "تم تحديث الاسم بنجاح.",
        acct_pass_saved: "تم تحديث كلمة المرور بنجاح.",
        acct_reset_sent: "تم إرسال رابط الإعادة إلى",

        // Login Page
        login_title: "أهلاً بعودتك",
        login_desc: "سجل الدخول للوصول إلى أنظمتك.",
        signup_title: "إنشاء حساب",
        signup_desc: "انضم إلى TURTLESHELL لإدارة بنيتك التحتية.",
        login_fullname: "الاسم الكامل",
        login_fullname_ph: "turtle123",
        login_email: "البريد الإلكتروني",
        login_password: "كلمة المرور",
        login_pass_ph_signup: "٨ أحرف على الأقل",
        login_pass_ph: "••••••••",
        login_or: "أو",
        login_btn: "تسجيل الدخول",
        signup_btn: "إنشاء الحساب",
        login_loading: "يرجى الانتظار...",
        login_no_account: "ليس لديك حساب؟",
        login_sign_up: "إنشاء حساب",
        login_have_account: "لديك حساب بالفعل؟",
        login_sign_in: "تسجيل الدخول",
        login_check_email: "تحقق من بريدك الإلكتروني للحصول على رابط التأكيد.",
        auth_failed: "فشلت عملية المصادقة. حاول مرة أخرى.",
        generic_error: "حدث خطأ ما",
        login_lock_warning: "لا يمكن تغيير اسم المستخدم والبريد الإلكتروني بعد إنشاء الحساب. إذا احتجت إلى تحديثهما، ستحتاج إلى التواصل مع الدعم.",
        login_choose_carefully: "اختر بعناية.",
        service_final_desc: "أخبرنا بما تحتاجه وسنحدد البنية، والجدول الزمني، وخطة التنفيذ.",
        nexus_badge: "البنية التحتية للأتمتة",
        nexus_title: "نيكسوس",
        nexus_hero_desc: "أنظمة أتمتة مخصصة مصممة للقضاء على المهام المتكررة، وربط أدواتك، وتوسيع نطاق عملياتك على مدار الساعة.",
        nexus_cta: "ابدأ نظام نيكسوس الخاص بك",
        nexus_jump_cta: "شاهد قدرات الأتمتة ↓",
        nexus_what_title: "ما هو نيكسوس؟",
        nexus_what_desc1: "نيكسوس هو بنيتنا التحتية الأساسية للأتمتة. نحن نبني روبوتات مخصصة ونصوص برمجية وعمال خلفية تتحدث إلى واجهات برمجة التطبيقات الخاصة بك، وتدير بياناتك، وتتولى المهام الشاقة حتى لا يضطر فريقك لذلك.",
        nexus_benefits_title: "القدرات الأساسية",
        nexus_capability_1_title: "أتمتة سير العمل",
        nexus_capability_1_desc: "اربط أدوات SaaS المختلفة (CRM وSlack والبريد الإلكتروني) في مسار عمل واحد سلس.",
        nexus_capability_2_title: "استخراج ومعالجة البيانات",
        nexus_capability_2_desc: "أتمتة جمع البيانات من الويب، وتنسيقها، وإعداد التقارير تلقائياً.",
        nexus_capability_3_title: "تكامل الذكاء الاصطناعي",
        nexus_capability_3_desc: "ادمج نماذج لغوية مخصصة داخل سير العمل للتصنيف والرد ومعالجة اللغة الطبيعية تلقائياً.",
        nexus_stat_1_value: "مخصص",
        nexus_stat_1_label: "هندسة مصممة لك",
        nexus_stat_2_label: "استضافة سحابية",
        nexus_stat_3_label: "تكاملات سلسة",
        nexus_ready: "جاهز للأتمتة؟",
        nexus_cta_bottom: "اطلب تسعيرة نيكسوس",
        nexus_final_title: "جاهز للبناء مع نيكسوس؟",
        nexus_final_button: "اطلب نيكسوس",
        atlas_badge: "البنية التحتية للويب",
        atlas_title: "أطلس",
        atlas_hero_desc: "مواقع وأنظمة ويب حديثة، صفحات هبوط، مواقع تجارية، لوحات تحكم، ومنصات ويب مخصصة.",
        atlas_cta: "ابدأ مشروع أطلس الخاص بك",
        atlas_jump_cta: "شاهد ميزات المنصة ↓",
        atlas_what_title: "ما هو أطلس؟",
        atlas_what_desc1: "يدير أطلس كل ما يخص الويب. من صفحات الهبوط عالية التحويل إلى لوحات التحكم المعقدة والآمنة ومنتجات البرمجيات كخدمة (SaaS) المخصصة، نقوم بهندسة تجارب ويب تقدم أداءً عالياً.",
        atlas_benefits_title: "القدرات الأساسية",
        atlas_capability_1_title: "مواقع الأعمال وصفحات الهبوط",
        atlas_capability_1_desc: "مواقع سريعة ومحسنة لمحركات البحث ومصممة لتحويل الزوار إلى عملاء.",
        atlas_capability_2_title: "منصات ويب مخصصة",
        atlas_capability_2_desc: "أدوات داخلية وأنظمة إدارة محتوى وهياكل SaaS متخصصة مبنية خصيصاً لاحتياجاتك.",
        atlas_capability_3_title: "لوحات تحكم للعملاء",
        atlas_capability_3_desc: "واجهات آمنة مدفوعة بالبيانات ليتابع عملاؤك المؤشرات أو يتفاعلوا مع خدمتك.",
        atlas_stat_1_value: "مخصص",
        atlas_stat_1_label: "تسليم مصمم لك",
        atlas_stat_2_label: "أداء فائق السرعة",
        atlas_stat_3_label: "محسن لمحركات البحث",
        atlas_ready: "جاهز لبناء تواجدك على الويب؟",
        atlas_cta_bottom: "اطلب تسعيرة أطلس",
        atlas_final_title: "جاهز للبناء مع أطلس؟",
        atlas_final_button: "اطلب أطلس",
        genos_badge: "البنية التحتية للموبايل",
        genos_title: "جينوس",
        genos_hero_desc: "تطبيقات هواتف محمولة أصلية ومتعددة المنصات، تُبنى من الصفر، وتُنشر في متاجر التطبيقات، وتُدار لعملك.",
        genos_cta: "ابنِ مع جينوس",
        genos_jump_cta: "شاهد القدرات ↓",
        genos_what_title: "ما هو جينوس؟",
        genos_what_desc1: "جينوس هي وحدة تطبيقات الهاتف المحمول لدينا. سواء كان iOS أو Android، نقوم بتطوير تطبيقات أنيقة وعالية الأداء تحافظ على تفاعل المستخدمين.",
        genos_benefits_title: "القدرات الأساسية",
        genos_capability_1_title: "إتقان متعدد المنصات",
        genos_capability_1_desc: "اكتب مرة واحدة وانشر في كل مكان. تطبيقات عالية الأداء لكل من iOS وAndroid.",
        genos_capability_2_title: "تجارب أصلية",
        genos_capability_2_desc: "واجهات سلسة وبديهية تبدو طبيعية على الأجهزة اللوحية الكبيرة والهواتف المدمجة.",
        genos_capability_3_title: "نشر المتاجر والتحديثات",
        genos_capability_3_desc: "نتولى تعقيدات مراجعات Apple وGoogle لنشر تطبيقك وتحديثاته بسلاسة.",
        genos_stat_1_value: "مخصص",
        genos_stat_1_label: "تطوير مخصص",
        genos_stat_2_label: "متعدد المنصات",
        genos_stat_3_label: "جاهز لخلفية سحابية",
        genos_ready: "جاهز لإطلاق تطبيقك؟",
        genos_cta_bottom: "اطلب تسعيرة جينوس",
        genos_final_title: "جاهز للبناء مع جينوس؟",
        genos_final_button: "اطلب جينوس"
    },
    de: {
        nav_nexus: "NEXUS",
        nav_atlas: "ATLAS",
        nav_home: "Startseite",
        nav_services: "Dienstleistungen",
        nav_about: "Über Uns",
        nav_contact: "Kontakt",
        nav_bots: "Deine Bots",
        nav_login: "Anmelden",
        hero_open_systems: "Systeme öffnen",
        nav_dashboard: "Dashboard",
        nav_navigation: "Navigation",
        nav_account: "Konto",
        nav_preferences: "Einstellungen",
        nav_account_settings: "Kontoeinstellungen",
        nav_signout: "Abmelden",
        hero_badge: "Jetzt Verfügbar",
        hero_title: "Bauen. Automatisieren. Skalieren.",
        hero_desc: "Maßgeschneiderte Automatisierungssysteme und moderne Web-Infrastruktur, entwickelt um 24/7 zu laufen, sauber zu skalieren und sicher zu bleiben.",
        hero_btn_explore: "Dienste entdecken",
        hero_btn_login: "Loslegen",
        hero_btn_learn: "Mehr erfahren",
        services_title: "Infrastruktur Bereitstellen",
        services_desc: "Wählen Sie NEXUS für Automatisierung oder ATLAS für Websysteme, gebaut, bereitgestellt und gewartet für Sie.",
        card_nexus_title: "NEXUS",
        card_nexus_sub: "Automatisierungsinfrastruktur",
        card_nexus_desc: "Maßgeschneiderte Automatisierungssysteme für Ihren Workflow, gehostet, überwacht und gewartet.",
        card_nexus_cta: "NEXUS Anfragen",
        card_atlas_title: "ATLAS",
        card_atlas_sub: "Web-Infrastruktur",
        card_atlas_desc: "Moderne Websites und Websysteme, Landingpages, Unternehmensseiten, Dashboards und individuelle Plattformen.",
        card_atlas_cta: "ATLAS Starten",
        about_title: "Digitale Infrastruktur. Für Sie gebaut.",
        about_desc1: `TURTLESHELL baut digitale Infrastruktur für Automatisierung (<span class="text-glow-blue">NEXUS</span>), Websysteme (<span class="text-glow-blue">ATLAS</span>) und mobile Apps (<span class="text-glow-blue">GENOS</span>). Von internen Workflows bis zu kundenorientierten Produkten entwerfen, deployen und betreiben wir Plattformen, die <span class="text-glow-blue">24/7</span> laufen.`,
        about_desc2: "Mit Fokus auf Performance, Sicherheit und Zuverlässigkeit hilft TURTLESHELL Teams dabei, Abläufe zu automatisieren, moderne Web-Erlebnisse bereitzustellen und mobile Produkte ohne komplexe Infrastrukturverwaltung zu starten.",
        about_founder: "Gegründet von",
        stat_bots: "System-Betriebszeit",
        stat_custom: "Maßgefertigt",
        stat_security: "Sicherheit zuerst",
        stat_potential: "Skalierbar",
        footer_copy: "© 2026 TURTLESHELL. Alle Rechte vorbehalten.",
        footer_contact: "Kontakt",
        footer_demo: "⚙ Demo",

        // Modals
        modal_login_title: "Willkommen zurück",
        modal_login_desc: "Melden Sie sich an, um auf Ihr Dashboard zuzugreifen.",
        btn_google: "Weiter mit Google",
        modal_divider: "oder mit Email anmelden",
        label_email: "Email",
        label_password: "Passwort",
        btn_signin: "Anmelden",

        modal_contact_title: "Bot Anfragen",
        modal_contact_desc: "Sagen Sie uns, was Sie automatisieren möchten. Wir melden uns innerhalb von 24 Stunden.",
        label_name: "Ihr Name",
        label_message: "Was möchten Sie automatisieren?",
        btn_send_request: "Anfrage Senden",
        contact_footer_email: "Oder Email direkt an",
        contact_footer_dm: "DM auf X:",

        // Placeholders
        ph_name: "Max Mustermann",
        ph_email: "sie@beispiel.de",
        ph_message: "Beschreiben Sie Ihre Bedürfnisse...",

        // Nexus Dashboard
        nexus_subtitle: "Benutzerdefinierter Repost / Antwort auf Befehl",
        status_stopped: "Gestoppt",
        section_controls: "Steuerung",
        btn_start: "▶ Bot Starten",
        btn_stop: "■ Bot Stoppen",
        error_title: "Bot hat einen Fehler festgestellt.",
        error_detail: "Wenn das Problem weiterhin besteht, wenden Sie sich bitte an den Support.",
        section_google: "Google-Konto",
        google_desc: "Der Bot meldet sich mit Ihrem Google-Konto bei Twitter an. Geben Sie hier Ihre Anmeldedaten ein. Sie werden nur lokal in Ihrer Konfiguration gespeichert.",
        label_google_email: "Google E-Mail",
        ph_google_email: "sie@gmail.com",
        label_google_password: "Google Passwort",
        ph_google_password: "••••••••",
        btn_save_account: "Konto Speichern",
        section_settings: "Einstellungen",
        label_keyword: "Schlüsselwort",
        ph_keyword: "z.B. Ja",
        label_reply: "Antwortnachricht",
        ph_reply: "z.B. Danke",
        label_interval: "Intervall (Sekunden)",
        ph_interval: "z.B. 20",
        label_passcode: "Passcode",
        ph_passcode: "••••",
        label_allowed: "Erlaubte Konten",
        allowed_desc: "Nur auf diese Konten antworten. Leer lassen, um jedem zu antworten.",
        ph_allowed: "@benutzer1, @benutzer2 ...",
        section_allowed: "Erlaubte Konten",
        btn_save_accounts: "Konten Speichern",
        btn_save_settings: "Einstellungen Speichern",
        section_log: "Aktivitätsprotokoll",
        log_empty: "Noch keine Aktivität. Starten Sie den Bot, um hier Protokolle zu sehen.",
        status_online: "Online",
        btn_starting: "▶ Starten",
        btn_running: '<span class="btn-running-dot"></span> Läuft',
        btn_stopping: "■ Stoppen",
        btn_saving: "Speichern…",
        btn_saved: "Gespeichert!",
        nexus_loading: "Laden...",
        nexus_back: "← Zurück zu den Systemen",
        nexus_title: "Automatisierungsinfrastruktur",
        nexus_page_subtitle: "Ihre aktiven Automatisierungs-Bots und Workflows.",
        nexus_empty_title: "Noch keine Bots zugewiesen",
        nexus_empty_desc: "Ihre Automatisierungs-Bots erscheinen hier, sobald sie eingerichtet sind.",
        nexus_bot_tag: "NEXUS BOT",
        nexus_bot_desc_fallback: "Benutzerdefinierter Automatisierungs-Bot, der rund um die Uhr läuft.",
        nexus_status_active: "Aktiv",
        nexus_status_paused: "Pausiert",
        nexus_open_bot: "Öffnen",

        // Systems Dashboard
        dash_label: "Dashboard",
        dash_welcome: "Willkommen zurück",
        dash_subtitle: "Ihre aktive Infrastruktur ist unten. Kontaktieren Sie uns, um weitere Dienste hinzuzufügen.",
        svc_nexus_sub: "Automatisierungsinfrastruktur",
        svc_nexus_desc: "Ihre benutzerdefinierten Automatisierungssysteme, Bots, Workflows und geplante Aufgaben rund um die Uhr.",
        svc_atlas_sub: "Web-Infrastruktur",
        svc_atlas_desc: "Ihre Websites, Dashboards und Webplattformen, gebaut, bereitgestellt und gewartet.",
        svc_genos_sub: "Mobile Infrastruktur",
        svc_genos_desc: "Native und plattformübergreifende mobile Anwendungen für Ihr Unternehmen.",
        svc_access: "Zugriff",
        svc_locked: "🔒 Nicht verfügbar",

        // Account Page
        acct_title: "Konto",
        acct_subtitle: "Verwalten Sie Ihr Profil und Ihre Sicherheitseinstellungen.",
        acct_back: "← Zurück zum Dashboard",
        acct_profile: "PROFIL",
        acct_lock_msg: "Benutzername und E-Mail können nicht geändert werden.",
        acct_lock_support: "Support kontaktieren",
        acct_lock_detail: "Wenn Sie sie aktualisieren müssen, wenden Sie sich bitte an den",
        acct_email: "E-Mail",
        acct_username: "Benutzername",
        acct_locked_badge: "gesperrt",
        acct_fullname: "Vollständiger Name",
        acct_fullname_hint: "(bearbeitbar)",
        acct_fullname_ph: "Ihr vollständiger Name",
        acct_save: "Speichern",
        acct_password: "PASSWORT",
        acct_new_pass: "Neues Passwort",
        acct_new_pass_ph: "Mind. 8 Zeichen",
        acct_confirm_pass: "Neues Passwort bestätigen",
        acct_confirm_pass_ph: "Passwort wiederholen",
        acct_update_pass: "Passwort aktualisieren",
        acct_forgot: "Passwort vergessen? Wir senden Ihnen einen Reset-Link per E-Mail.",
        acct_send_reset: "Reset-E-Mail senden",
        acct_sending: "Wird gesendet...",
        acct_saving: "Wird gespeichert...",
        acct_account_section: "KONTO",
        acct_contact_note: "Möchten Sie Ihr Konto löschen oder Ihre E-Mail ändern? Kontaktieren Sie unser Support-Team.",
        acct_contact_btn: "Support kontaktieren",
        acct_oauth_note: "Sie haben sich mit Google angemeldet. Die Passwortverwaltung erfolgt über Google.",
        acct_loading: "Wird geladen...",
        acct_pass_mismatch: "Passwörter stimmen nicht überein.",
        acct_pass_short: "Das Passwort muss mindestens 8 Zeichen lang sein.",
        acct_name_saved: "Name erfolgreich aktualisiert.",
        acct_pass_saved: "Passwort erfolgreich aktualisiert.",
        acct_reset_sent: "Reset-Link gesendet an",

        // Login Page
        login_title: "Willkommen zurück",
        login_desc: "Melden Sie sich an, um auf Ihre Systeme zuzugreifen.",
        signup_title: "Konto erstellen",
        signup_desc: "Treten Sie TURTLESHELL bei, um Ihre Infrastruktur zu verwalten.",
        login_fullname: "Vollständiger Name",
        login_fullname_ph: "turtle123",
        login_email: "E-Mail",
        login_password: "Passwort",
        login_pass_ph_signup: "Mind. 8 Zeichen",
        login_pass_ph: "••••••••",
        login_or: "oder",
        login_btn: "Anmelden",
        signup_btn: "Konto erstellen",
        login_loading: "Bitte warten...",
        login_no_account: "Noch kein Konto?",
        login_sign_up: "Registrieren",
        login_have_account: "Bereits ein Konto?",
        login_sign_in: "Anmelden",
        login_check_email: "Prüfen Sie Ihre E-Mails auf einen Bestätigungslink.",
        auth_failed: "Authentifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.",
        generic_error: "Etwas ist schiefgelaufen",
        login_lock_warning: "Benutzername und E-Mail können nach der Kontoerstellung nicht mehr geändert werden. Wenn Sie sie aktualisieren müssen, wenden Sie sich an den Support.",
        login_choose_carefully: "Wählen Sie sorgfältig.",
        service_final_desc: "Teilen Sie uns mit, was Sie brauchen. Wir definieren Architektur, Zeitplan und Lieferung.",
        nexus_badge: "AUTOMATISIERUNGSINFRASTRUKTUR",
        nexus_title: "NEXUS",
        nexus_hero_desc: "Maßgeschneiderte Automatisierungssysteme, die wiederkehrende Aufgaben eliminieren, Ihre Tools verbinden und Ihre Prozesse rund um die Uhr skalieren.",
        nexus_cta: "Starten Sie Ihr NEXUS System",
        nexus_jump_cta: "Automationsfunktionen ansehen ↓",
        nexus_what_title: "Was ist NEXUS?",
        nexus_what_desc1: "NEXUS ist unsere Automatisierungsinfrastruktur. Wir entwickeln maßgeschneiderte Bots, Skripte und Hintergrunddienste für Sie.",
        nexus_benefits_title: "Kernfunktionen",
        nexus_capability_1_title: "Workflow-Automatisierung",
        nexus_capability_1_desc: "Verbinden Sie verschiedene SaaS-Tools (CRM, Slack, E-Mail) zu einer nahtlosen Pipeline.",
        nexus_capability_2_title: "Datenextraktion und Verarbeitung",
        nexus_capability_2_desc: "Automatisiertes Web-Scraping, Datenaufbereitung und Reporting-Systeme.",
        nexus_capability_3_title: "KI-Integration",
        nexus_capability_3_desc: "Integrieren Sie benutzerdefinierte LLMs in Ihre Abläufe, um Sprache automatisch zu klassifizieren und zu verarbeiten.",
        nexus_stat_1_value: "Individuell",
        nexus_stat_1_label: "Maßgeschneiderte Architektur",
        nexus_stat_2_label: "Cloud gehostet",
        nexus_stat_3_label: "Nahtlose Integrationen",
        nexus_ready: "Bereit zu automatisieren?",
        nexus_cta_bottom: "NEXUS Angebot anfordern",
        nexus_final_title: "Bereit, mit NEXUS zu bauen?",
        nexus_final_button: "NEXUS anfragen",
        atlas_badge: "WEB INFRASTRUKTUR",
        atlas_title: "ATLAS",
        atlas_hero_desc: "Moderne Webseiten, Systeme, Landing-Pages, Dashboards und maßgeschneiderte Plattformen.",
        atlas_cta: "Starten Sie Ihr ATLAS Projekt",
        atlas_jump_cta: "Plattformfunktionen ansehen ↓",
        atlas_what_title: "Was ist ATLAS?",
        atlas_what_desc1: "ATLAS deckt alles im Web ab. Von konvertierungsstarken Landingpages bis zu komplexen sicheren Webportalen.",
        atlas_benefits_title: "Kernfunktionen",
        atlas_capability_1_title: "Business-Websites und Landingpages",
        atlas_capability_1_desc: "Schnelle, SEO-optimierte und pixelgenaue Seiten, die Besucher in Kunden verwandeln.",
        atlas_capability_2_title: "Individuelle Web-Plattformen",
        atlas_capability_2_desc: "Interne Tools, CMS und spezialisierte SaaS-Architekturen, exakt für Ihre Anforderungen gebaut.",
        atlas_capability_3_title: "Kunden-Dashboards",
        atlas_capability_3_desc: "Sichere, datengetriebene Oberflächen, damit Kunden Metriken verfolgen und mit Ihrem Service arbeiten können.",
        atlas_stat_1_value: "Individuell",
        atlas_stat_1_label: "Maßgeschneiderte Umsetzung",
        atlas_stat_2_label: "Sehr hohe Performance",
        atlas_stat_3_label: "SEO-optimiert",
        atlas_ready: "Bereit für Ihre Web-Präsenz?",
        atlas_cta_bottom: "ATLAS Angebot anfordern",
        atlas_final_title: "Bereit, mit ATLAS zu bauen?",
        atlas_final_button: "ATLAS anfragen",
        genos_badge: "MOBILE INFRASTRUKTUR",
        genos_title: "GENOS",
        genos_hero_desc: "Native und plattformübergreifende mobile Anwendungen, von Grund auf entwickelt und gewartet.",
        genos_cta: "Mit GENOS bauen",
        genos_jump_cta: "Funktionen ansehen ↓",
        genos_what_title: "Was ist GENOS?",
        genos_what_desc1: "GENOS ist unsere Abteilung für mobile Apps. Wir entwickeln flüssige, leistungsstarke Apps für iOS und Android.",
        genos_benefits_title: "Kernfunktionen",
        genos_capability_1_title: "Plattformübergreifende Stärke",
        genos_capability_1_desc: "Einmal entwickeln, überall ausrollen. Hochleistungs-Apps für iOS und Android.",
        genos_capability_2_title: "Native Erlebnisse",
        genos_capability_2_desc: "Flüssige, intuitive Oberflächen, die auf Tablets und Smartphones natürlich wirken.",
        genos_capability_3_title: "Store-Release und Updates",
        genos_capability_3_desc: "Wir navigieren durch Apple- und Google-Review-Prozesse, damit App und Updates zuverlässig live gehen.",
        genos_stat_1_value: "Individuell",
        genos_stat_1_label: "Maßgeschneiderte Entwicklung",
        genos_stat_2_label: "Cross-Platform",
        genos_stat_3_label: "Cloud-Backend bereit",
        genos_ready: "Bereit für Ihre App?",
        genos_cta_bottom: "GENOS Angebot anfordern",
        genos_final_title: "Bereit, mit GENOS zu bauen?",
        genos_final_button: "GENOS anfragen"
    },
    ja: {
        nav_nexus: "NEXUS",
        nav_atlas: "ATLAS",
        nav_home: "ホーム",
        nav_services: "サービス",
        nav_about: "概要",
        nav_contact: "お問い合わせ",
        nav_bots: "ボット管理",
        nav_login: "ログイン",
        hero_open_systems: "システムを開く",
        nav_dashboard: "ダッシュボード",
        nav_navigation: "ナビゲーション",
        nav_account: "アカウント",
        nav_preferences: "設定",
        nav_account_settings: "アカウント設定",
        nav_signout: "サインアウト",
        hero_badge: "現在利用可能",
        hero_title: "\u69cb\u7bc9\u3059\u308b\u3002 \u81ea\u52d5\u5316\u3059\u308b\u3002 \u62e1\u5f35\u3059\u308b\u3002",
        hero_desc: "カスタム自動化エンジンとモダンなWebシステム。24時間稼働し、クリーンにスケールし、セキュアに保つよう設計。",
        hero_btn_explore: "サービスを見る",
        hero_btn_login: "始める",
        hero_btn_learn: "詳細を見る",

        services_title: "インフラをデプロイする",
        services_desc: "自動化にはNEXUS、WebシステムにはATLASを選択。構築、デプロイ、保守をすべて行います。",

        card_nexus_title: "NEXUS",
        card_nexus_sub: "自動化インフラ",
        card_nexus_desc: "ワークフローに合わせた自動化システム。ホスティング、監視、保守込み。",
        card_nexus_cta: "NEXUSを依頼する",

        card_atlas_title: "ATLAS",
        card_atlas_sub: "Webインフラ",
        card_atlas_desc: "モダンなウェブサイトとウェブシステム。ランディングページ、ビジネスサイト、ダッシュボード、カスタムプラットフォーム。",
        card_atlas_cta: "ATLASを開始する",

        about_title: "デジタルインフラ。あなたのために。",
        about_desc1: `TURTLESHELLは、自動化（<span class="text-glow-blue">NEXUS</span>）、Webシステム（<span class="text-glow-blue">ATLAS</span>）、モバイルアプリ（<span class="text-glow-blue">GENOS</span>）にわたるデジタル基盤を構築します。社内ワークフローから顧客向けプロダクトまで、<span class="text-glow-blue">24/7</span>で動くプラットフォームを設計・展開・運用します。`,
        about_desc2: "パフォーマンス、セキュリティ、信頼性を最優先に、TURTLESHELLは業務の自動化、モダンなWeb体験の提供、モバイルプロダクトの立ち上げをインフラ負担を抑えて実現します。",

        about_founder: "創設者",

        stat_bots: "システム稼働時間",
        stat_custom: "カスタム構築",
        stat_security: "暗号化",
        stat_potential: "自動化能力",

        footer_copy: "© 2026 TURTLESHELL. 全著作権所有。",
        footer_contact: "連絡",
        footer_demo: "⚙ デモ",

        modal_login_title: "ログイン",
        modal_login_desc: "ボット管理にアクセスします。",
        btn_google: "Googleで続行",
        modal_divider: "またはメールでログイン",
        label_email: "メール",
        label_password: "パスワード",
        btn_signin: "ログイン",

        modal_contact_title: "カスタムボットをリクエスト",
        modal_contact_desc: "要件を入力してください。",
        label_name: "名前",
        label_message: "プロジェクトの詳細",
        btn_send_request: "送信",

        contact_footer_email: "メールで連絡",
        contact_footer_dm: "Xで連絡:",

        ph_name: "名前",
        ph_email: "example@email.com",
        ph_message: "詳細を入力してください...",

        // Nexus Dashboard
        nexus_subtitle: "カスタムリポスト / コマンドで返信",
        status_stopped: "停止中",
        section_controls: "コントロール",
        btn_start: "▶ ボットを開始",
        btn_stop: "■ ボットを停止",
        error_title: "ボットにエラーが発生しました。",
        error_detail: "問題が解決しない場合は、サポートにお問い合わせください。",
        section_google: "Googleアカウント",
        google_desc: "ボットはGoogleアカウントを使用してTwitterにログインします。ここに認証情報を入力してください。設定にローカルにのみ保存されます。",
        label_google_email: "Googleメール",
        ph_google_email: "you@gmail.com",
        label_google_password: "Googleパスワード",
        ph_google_password: "••••••••",
        btn_save_account: "アカウントを保存",
        section_settings: "設定",
        label_keyword: "キーワード",
        ph_keyword: "例：はい",
        label_reply: "返信メッセージ",
        ph_reply: "例：ありがとう",
        label_interval: "間隔（秒）",
        ph_interval: "例：20",
        label_passcode: "パスコード",
        ph_passcode: "••••",
        label_allowed: "許可されたアカウント",
        allowed_desc: "これらのアカウントにのみ返信します。誰にでも返信するには空のままにしてください。",
        ph_allowed: "@username1, @username2 ...",
        section_allowed: "許可されたアカウント",
        btn_save_accounts: "アカウントを保存",
        btn_save_settings: "設定を保存",
        section_log: "アクティビティログ",
        log_empty: "アクティビティはまだありません。ログを表示するにはボットを開始してください。",
        status_online: "オンライン",
        btn_starting: "▶ 開始中",
        btn_running: '<span class="btn-running-dot"></span> 実行中',
        btn_stopping: "■ 停止中",
        btn_saving: "保存中…",
        btn_saved: "保存しました！",
        nexus_loading: "読み込み中...",
        nexus_back: "← システムに戻る",
        nexus_title: "自動化インフラ",
        nexus_page_subtitle: "稼働中の自動化ボットとワークフローです。",
        nexus_empty_title: "まだボットが割り当てられていません",
        nexus_empty_desc: "設定が完了すると、ここに自動化ボットが表示されます。",
        nexus_bot_tag: "NEXUS BOT",
        nexus_bot_desc_fallback: "24時間稼働するカスタム自動化ボットです。",
        nexus_status_active: "稼働中",
        nexus_status_paused: "一時停止",
        nexus_open_bot: "開く",

        // Systems Dashboard
        dash_label: "ダッシュボード",
        dash_welcome: "おかえりなさい",
        dash_subtitle: "アクティブなインフラは下記の通りです。サービスを追加するにはお問い合わせください。",
        svc_nexus_sub: "自動化インフラ",
        svc_nexus_desc: "カスタム自動化システム。ボット、ワークフロー、スケジュールタスクが24時間稼働。",
        svc_atlas_sub: "Webインフラ",
        svc_atlas_desc: "ウェブサイト、ダッシュボード、Webプラットフォーム。構築・デプロイ・保守込み。",
        svc_genos_sub: "モバイルインフラ",
        svc_genos_desc: "ネイティブおよびクロスプラットフォームのモバイルアプリをビジネス向けに構築。",
        svc_access: "アクセス",
        svc_locked: "🔒 利用不可",

        // Account Page
        acct_title: "アカウント",
        acct_subtitle: "プロフィールとセキュリティ設定を管理します。",
        acct_back: "← ダッシュボードに戻る",
        acct_profile: "プロフィール",
        acct_lock_msg: "ユーザー名とメールアドレスは変更できません。",
        acct_lock_support: "サポートに連絡",
        acct_lock_detail: "更新が必要な場合は、",
        acct_email: "メールアドレス",
        acct_username: "ユーザー名",
        acct_locked_badge: "ロック済み",
        acct_fullname: "フルネーム",
        acct_fullname_hint: "（編集可能）",
        acct_fullname_ph: "フルネームを入力",
        acct_save: "保存",
        acct_password: "パスワード",
        acct_new_pass: "新しいパスワード",
        acct_new_pass_ph: "8文字以上",
        acct_confirm_pass: "新しいパスワードの確認",
        acct_confirm_pass_ph: "パスワードを再入力",
        acct_update_pass: "パスワードを更新",
        acct_forgot: "パスワードをお忘れですか？メールにリセットリンクをお送りします。",
        acct_send_reset: "リセットメールを送信",
        acct_sending: "送信中...",
        acct_saving: "保存中...",
        acct_account_section: "アカウント",
        acct_contact_note: "アカウントの削除またはメール変更は、サポートチームにお問い合わせください。",
        acct_contact_btn: "サポートに連絡",
        acct_oauth_note: "Googleでサインインしました。パスワード管理はGoogleが行います。",
        acct_loading: "読み込み中...",
        acct_pass_mismatch: "パスワードが一致しません。",
        acct_pass_short: "パスワードは8文字以上にしてください。",
        acct_name_saved: "名前が正常に更新されました。",
        acct_pass_saved: "パスワードが正常に更新されました。",
        acct_reset_sent: "リセットリンクを送信しました：",

        // Login Page
        login_title: "おかえりなさい",
        login_desc: "システムにアクセスするにはサインインしてください。",
        signup_title: "アカウント作成",
        signup_desc: "TURTLESHELLに参加してインフラを管理しましょう。",
        login_fullname: "フルネーム",
        login_fullname_ph: "turtle123",
        login_email: "メールアドレス",
        login_password: "パスワード",
        login_pass_ph_signup: "8文字以上",
        login_pass_ph: "••••••••",
        login_or: "または",
        login_btn: "サインイン",
        signup_btn: "アカウントを作成",
        login_loading: "お待ちください...",
        login_no_account: "アカウントをお持ちでないですか？",
        login_sign_up: "新規登録",
        login_have_account: "すでにアカウントをお持ちですか？",
        login_sign_in: "サインイン",
        login_check_email: "確認リンクをメールで送信しました。受信箱を確認してください。",
        auth_failed: "認証に失敗しました。もう一度お試しください。",
        generic_error: "問題が発生しました",
        login_lock_warning: "アカウント作成後はユーザー名とメールアドレスを変更できません。変更が必要な場合はサポートにお問い合わせください。",
        login_choose_carefully: "慎重に選んでください。",
        service_final_desc: "必要な内容をお知らせください。構成、スケジュール、納品計画をご提案します。",
        nexus_badge: "自動化インフラストラクチャー",
        nexus_title: "NEXUS",
        nexus_hero_desc: "繰り返しタスクを排除し、ツールを接続し、24時間業務を拡張するカスタム自動化.",
        nexus_cta: "NEXUSシステムを開始",
        nexus_jump_cta: "自動化機能を見る ↓",
        nexus_what_title: "NEXUSとは何ですか？",
        nexus_what_desc1: "NEXUSは当社の主力自動化インフラです。APIと連携するカスタムボット、スクリプト、バックグラウンドワーカーを構築します。",
        nexus_benefits_title: "機能",
        nexus_capability_1_title: "ワークフロー自動化",
        nexus_capability_1_desc: "CRM、Slack、メールなどのSaaSツールを1本のシームレスなパイプラインに統合します。",
        nexus_capability_2_title: "データ抽出と処理",
        nexus_capability_2_desc: "Webスクレイピング、データ整形、レポート作成を自動化します。",
        nexus_capability_3_title: "AI統合",
        nexus_capability_3_desc: "カスタムLLMを業務フローに組み込み、分類・応答・自然言語処理を自動化します。",
        nexus_stat_1_value: "カスタム",
        nexus_stat_1_label: "専用アーキテクチャ",
        nexus_stat_2_label: "クラウド運用",
        nexus_stat_3_label: "シームレス連携",
        nexus_ready: "自動化の準備はできましたか？",
        nexus_cta_bottom: "NEXUS見積もりをリクエスト",
        nexus_final_title: "NEXUSで構築を始めますか？",
        nexus_final_button: "NEXUSを依頼",
        atlas_badge: "WEBインフラストラクチャー",
        atlas_title: "ATLAS",
        atlas_hero_desc: "最新のウェブシステム、ランディングページ、ダッシュボード、カスタムウェブプラットフォーム。",
        atlas_cta: "ATLASプロジェクトを開始",
        atlas_jump_cta: "プラットフォーム機能を見る ↓",
        atlas_what_title: "ATLASとは何ですか？",
        atlas_what_desc1: "ATLASはWebに関するすべてを処理します。コンバージョン率の高いLPから複雑なSaaS製品まで。",
        atlas_benefits_title: "機能",
        atlas_capability_1_title: "企業サイトとLP",
        atlas_capability_1_desc: "高速・SEO最適化・高品質なサイトで、訪問者を顧客へ転換します。",
        atlas_capability_2_title: "カスタムWebプラットフォーム",
        atlas_capability_2_desc: "社内ツール、CMS、専用SaaSアーキテクチャを要件に合わせて構築します。",
        atlas_capability_3_title: "クライアント向けダッシュボード",
        atlas_capability_3_desc: "安全でデータ駆動のUIにより、顧客が指標確認やサービス操作を行えます。",
        atlas_stat_1_value: "カスタム",
        atlas_stat_1_label: "専用デリバリー",
        atlas_stat_2_label: "高速パフォーマンス",
        atlas_stat_3_label: "SEO最適化",
        atlas_ready: "Webプレゼンスを構築しますか？",
        atlas_cta_bottom: "ATLAS見積もりをリクエスト",
        atlas_final_title: "ATLASで構築を始めますか？",
        atlas_final_button: "ATLASを依頼",
        genos_badge: "モバイルインフラストラクチャー",
        genos_title: "GENOS",
        genos_hero_desc: "ネイティブおよびクロスプラットフォームのモバイルアプリケーションを開発、運用保守。",
        genos_cta: "GENOSで構築",
        genos_jump_cta: "機能を見る ↓",
        genos_what_title: "GENOSとは何ですか？",
        genos_what_desc1: "GENOSはモバイルアプリケーション部門です。iOS・Android向けに高性能なアプリを開発します。",
        genos_benefits_title: "機能",
        genos_capability_1_title: "クロスプラットフォーム開発",
        genos_capability_1_desc: "一度の開発でiOSとAndroidの両方へ展開します。",
        genos_capability_2_title: "ネイティブ体験",
        genos_capability_2_desc: "タブレットでもスマートフォンでも自然に使える、滑らかなUIを提供します。",
        genos_capability_3_title: "ストア公開と更新",
        genos_capability_3_desc: "Apple/Googleの審査フローを管理し、公開とアップデートを円滑に進めます。",
        genos_stat_1_value: "カスタム",
        genos_stat_1_label: "専用開発",
        genos_stat_2_label: "クロスプラットフォーム",
        genos_stat_3_label: "クラウドバックエンド対応",
        genos_ready: "アプリをリリースしますか？",
        genos_cta_bottom: "GENOS見積もりをリクエスト",
        genos_final_title: "GENOSで構築を始めますか？",
        genos_final_button: "GENOSを依頼"
    }
};

// Expose globally for nexus.js and re-apply after navigation
window.translations = translations;
window.setLanguage = setLanguage;

let languageApplyInProgress = false;
let languageRefreshScheduled = false;
let languageRefreshBindingsReady = false;

function scheduleLanguageRefresh() {
    if (languageRefreshScheduled) return;
    languageRefreshScheduled = true;

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            languageRefreshScheduled = false;
            const nextLang = localStorage.getItem('turtleshell-lang') || document.documentElement.getAttribute('lang') || 'en';
            setLanguage(nextLang);
        });
    });
}

function setLanguage(lang) {
    // Fallback to English if lang not found
    if (!translations[lang]) lang = 'en';
    languageApplyInProgress = true;

    // Update Text
    const keys = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (keys[key]) {
            // Preserve HTML structure if translation contains tags (like <br>)
            if (keys[key].includes('<') || key === 'hero_title') {
                el.innerHTML = keys[key];
                if (key === 'hero_title') {
                    el.setAttribute('data-hero-source', keys[key]);
                }
            } else {
                el.textContent = keys[key];
            }
        }
    });

    // Update Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (keys[key]) {
            el.placeholder = keys[key];
        }
    });
    // Also handle data-i18n-ph (used by account/login pages)
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (keys[key]) {
            el.placeholder = keys[key];
        }
    });

    // Keep layout LTR; only text direction is adjusted via CSS class for Arabic
    document.documentElement.setAttribute('lang', lang === 'ar' ? 'ar' : lang);
    document.documentElement.setAttribute('dir', 'ltr');
    document.body?.classList.toggle('lang-ar', lang === 'ar');

    const heroTitleEl = document.querySelector('.hero h1[data-i18n="hero_title"]');
    const heroDescEl = document.querySelector('.hero p[data-i18n="hero_desc"]');
    if (heroTitleEl) heroTitleEl.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    if (heroDescEl) heroDescEl.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    // Save Preference
    localStorage.setItem('turtleshell-lang', lang);

    // Notify React components listening for language changes
    window.dispatchEvent(new CustomEvent('turtleshell-lang-change', { detail: lang }));

    // Sync custom language picker
    syncLanguagePicker(lang);

    // Keep hero title split into words for the word-light intro effect
    resetHeroTitleWordLight();

    requestAnimationFrame(() => {
        refreshRevealObserverTargets();
    });
    setTimeout(() => {
        refreshRevealObserverTargets();
    }, 220);

    // Reveal content now that the correct language is painted.
    // For English this is a no-op (lang-loading already removed by the
    // inline script). For all other languages this is the gate
    // that prevents the English->Arabic flash.
    document.documentElement.classList.remove('lang-loading');

    Promise.resolve().then(() => {
        languageApplyInProgress = false;
    });
}

function bindLanguageRefresh() {
    if (languageRefreshBindingsReady) return;
    languageRefreshBindingsReady = true;

    const wrapHistoryMethod = (methodName) => {
        const original = history[methodName];
        history[methodName] = function (...args) {
            const result = original.apply(this, args);
            scheduleLanguageRefresh();
            return result;
        };
    };

    wrapHistoryMethod('pushState');
    wrapHistoryMethod('replaceState');
    window.addEventListener('popstate', scheduleLanguageRefresh);

    const startObserver = () => {
        if (!document.body || typeof MutationObserver !== 'function') return;

        const observer = new MutationObserver((mutations) => {
            if (languageApplyInProgress) return;

            const shouldRefresh = mutations.some((mutation) => {
                if (mutation.type === 'attributes') return true;

                return Array.from(mutation.addedNodes).some((node) => {
                    if (node.nodeType !== 1) return false;
                    return node.matches?.('[data-i18n], [data-i18n-placeholder], [data-i18n-ph]') ||
                        node.querySelector?.('[data-i18n], [data-i18n-placeholder], [data-i18n-ph]');
                });
            });

            if (shouldRefresh) scheduleLanguageRefresh();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-i18n', 'data-i18n-placeholder', 'data-i18n-ph'],
        });
    };

    if (document.body) startObserver();
    else document.addEventListener('DOMContentLoaded', startObserver, { once: true });
}

function initLanguage() {
    const saved = localStorage.getItem('turtleshell-lang');
    if (saved) {
        setLanguage(saved);
    } else {
        // Auto-detect based on FIRST preference, typically simplest
        const browserLang = navigator.language.slice(0, 2);
        const supported = ['en', 'ar', 'de', 'ja'];
        if (supported.includes(browserLang)) {
            setLanguage(browserLang);
        } else {
            setLanguage('en');
        }
    }
}

// Run init — call immediately so language applies on every page load/nav,
// not just on DOMContentLoaded (which may already have fired in Next.js).
initLanguage();
bindLanguageRefresh();

document.addEventListener('DOMContentLoaded', () => {
    initLanguage(); // re-run in case DOM wasn't ready yet on first call
    scheduleLanguageRefresh();
    // Restore session if previously signed in
    try {
        const session = JSON.parse(localStorage.getItem('ts_session'));
        if (session) setLoggedIn(session.email, session.username, session.fullName);
    } catch (e) { }

    if (!isIntroRunning() && !heroTitleAnimating && !heroTitleHasPlayed) {
        playHeroTitleWordLight();
    }
});


// ---------- 3D Rotating Carousel ----------
function initCarousel() {
    const ring = document.getElementById('carouselRing');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const dotsContainer = document.getElementById('carouselDots');

    if (ring && dotsContainer) {
        dotsContainer.innerHTML = '';

        const cards = Array.from(ring.querySelectorAll('.flyer-card'));
        const n = cards.length;
        if (n === 0) return;
        let activeIndex = 0;
        let resizeTimeout = null;

        function attachPressFeedback(element) {
            if (!element) return;

            const pressOn = () => element.classList.add('is-pressing');
            const pressOff = () => element.classList.remove('is-pressing');

            element.addEventListener('pointerdown', pressOn);
            element.addEventListener('pointerup', pressOff);
            element.addEventListener('pointercancel', pressOff);
            element.addEventListener('pointerleave', pressOff);
            element.addEventListener('blur', pressOff);
        }

        function wrapIndex(index) {
            return (index % n + n) % n;
        }

        function getRelativeOffset(index) {
            let offset = index - activeIndex;
            if (offset > n / 2) offset -= n;
            if (offset < -n / 2) offset += n;
            return offset;
        }

        function getLayoutMetrics() {
            const scene = ring.parentElement;
            const sceneWidth = scene?.clientWidth || 920;
            const cardWidth = cards[0]?.offsetWidth || 260;
            const compact = window.innerWidth <= 768;

            return {
                sideX: Math.min(sceneWidth * (compact ? 0.29 : 0.34), cardWidth * (compact ? 0.96 : 1.26)),
                frontDepth: compact ? 36 : 64,
                sideDepth: compact ? -24 : -52,
                farDepth: compact ? -86 : -130,
                sideAngle: compact ? 24 : 30,
                sideScale: compact ? 0.91 : 0.9,
                farScale: compact ? 0.78 : 0.76,
            };
        }

        cards.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => goTo(i));
            attachPressFeedback(dot);
            dotsContainer.appendChild(dot);
        });
        const dots = dotsContainer.querySelectorAll('.carousel-dot');

        function updateDots() {
            dots.forEach((dot, i) => dot.classList.toggle('active', i === activeIndex));
        }

        function applyTransforms() {
            const layout = getLayoutMetrics();

            cards.forEach((card, index) => {
                const offset = getRelativeOffset(index);
                const absOffset = Math.abs(offset);
                let translateX = 0;
                let translateZ = layout.frontDepth;
                let rotateY = 0;
                let scale = 1;
                let opacity = 1;
                let zIndex = 160;

                if (absOffset === 1) {
                    translateX = offset > 0 ? layout.sideX : -layout.sideX;
                    translateZ = layout.sideDepth;
                    rotateY = offset > 0 ? -layout.sideAngle : layout.sideAngle;
                    scale = layout.sideScale;
                    opacity = 0.9;
                    zIndex = 120;
                } else if (absOffset > 1) {
                    translateX = offset > 0 ? layout.sideX * 1.4 : -layout.sideX * 1.4;
                    translateZ = layout.farDepth;
                    rotateY = offset > 0 ? -(layout.sideAngle + 10) : (layout.sideAngle + 10);
                    scale = layout.farScale;
                    opacity = 0.24;
                    zIndex = 90;
                }

                card.style.transform =
                    `translate(-50%, -50%) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
                card.style.opacity = String(opacity);
                card.style.zIndex = String(zIndex);
                card.classList.toggle('is-front', absOffset === 0);
                card.classList.toggle('is-side', absOffset === 1);
                card.classList.toggle('is-far', absOffset > 1);
            });

            ring.style.transform = 'translateZ(0)';
            updateDots();
        }

        function goTo(index) {
            activeIndex = wrapIndex(index);
            applyTransforms();
        }

        cards.forEach((card, i) => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            cards[i] = newCard;
            attachPressFeedback(newCard);

            newCard.addEventListener('click', (event) => {
                event.stopPropagation();
                const offset = getRelativeOffset(i);
                if (offset === 0) {
                    const cardId = newCard.id;
                    if (cardId === 'cardNexus') window.location.href = '/services/nexus';
                    else if (cardId === 'cardAtlas') window.location.href = '/services/atlas';
                    else if (cardId === 'cardGenos') window.location.href = '/services/genos';
                    return;
                }
                goTo(i);
            });
        });

        const scene = ring.parentElement;
        if (scene) {
            scene.onclick = (event) => {
                if (!(event.target instanceof Element)) return;
                if (event.target.closest('.carousel-arrow, .carousel-dot')) return;
                if (event.target.closest('.flyer-card.is-front')) return;

                const rect = scene.getBoundingClientRect();
                const clickX = event.clientX - rect.left;
                if (clickX < rect.width * 0.5) goTo(activeIndex - 1);
                else goTo(activeIndex + 1);
            };
        }

        const newPrevBtn = prevBtn.cloneNode(true);
        const newNextBtn = nextBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        attachPressFeedback(newPrevBtn);
        attachPressFeedback(newNextBtn);
        newPrevBtn?.addEventListener('click', () => goTo(activeIndex - 1));
        newNextBtn?.addEventListener('click', () => goTo(activeIndex + 1));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') goTo(activeIndex - 1);
            if (e.key === 'ArrowRight') goTo(activeIndex + 1);
        });

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                applyTransforms();
            }, 120);
        });

        applyTransforms();

        window.carouselGoTo = function (index) {
            goTo(index);
        };
    }
}

document.addEventListener('DOMContentLoaded', initCarousel);
// Also run on next router changes if next is present
if (typeof window !== 'undefined') {
    let lastPath = window.location.pathname;
    const observer = new MutationObserver(() => {
        if (window.location.pathname !== lastPath) {
            lastPath = window.location.pathname;
            setTimeout(initCarousel, 100);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
// Run immediately in case elements already exist when script loads
initCarousel();





// ─── AUTO-REFRESH ON DEPLOY ──────────────────────────────────────────────────
// Polls /api/version every 60s. Version = server start timestamp, changes on
// every PM2 restart / deploy. When detected, reloads silently on next idle tick.
(function() {
    var _knownVersion = null;
    var _reloadPending = false;

    function _checkVersion() {
        if (_reloadPending) return;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/version?_=' + Date.now(), true);
        xhr.timeout = 6000;
        xhr.onload = function() {
            if (xhr.status !== 200) return;
            try {
                var data = JSON.parse(xhr.responseText);
                var v = data && data.v;
                if (!v) return;
                if (_knownVersion === null) { _knownVersion = v; return; }
                if (v !== _knownVersion) {
                    _reloadPending = true;
                    var _doReload = function() { window.location.reload(true); };
                    if ('requestIdleCallback' in window) {
                        requestIdleCallback(_doReload, { timeout: 2000 });
                    } else {
                        setTimeout(_doReload, 800);
                    }
                }
            } catch(e) {}
        };
        xhr.onerror = xhr.ontimeout = function() {};
        xhr.send();
    }

    // First check after 15s (let page fully load), then every 60s
    setTimeout(function() {
        _checkVersion();
        setInterval(_checkVersion, 60000);
    }, 15000);
})();
