'use client'

import { useRuntimeLanguage } from '@/lib/use-runtime-language'
import PageHeader from '@/components/PageHeader'

type Bot = {
  id: string
  bot_name: string
  bot_slug: string
  status: string
  description?: string | null
}

type NexusBotPageClientProps = {
  bot: Bot
}

const COPY = {
  en: {
    back: 'Back to NEXUS',
    badge: 'NEXUS BOT',
    brandBadge: 'Automation Node',
    titlePrefix: 'Workspace for',
    subtitleFallback: 'This bot is live inside your NEXUS automation stack.',
    line1: 'Operate.',
    line2: 'Monitor.',
    line3: 'Refine.',
    statStatus: 'Current status',
    statSlug: 'Assigned slug',
    statRuntime: 'Runtime',
    runtimeValue: '24/7',
    overview: 'Overview',
    overviewTitle: 'Bot access point',
    overviewBody:
      'Use this page as the landing view for the assigned bot. It confirms ownership, status, and the active NEXUS workspace path.',
    detailStatus: 'Status',
    detailSlug: 'Bot slug',
    detailService: 'Service',
    detailCoverage: 'Coverage',
    coverageValue: 'Live workflows',
    notesTitle: 'Operations snapshot',
    noteOneTitle: 'Assigned to your account',
    noteOneBody: 'This bot is linked to your TURTLESHELL user and available from the NEXUS area.',
    noteTwoTitle: 'Next step',
    noteTwoBody: 'Use the NEXUS dashboard to manage additional bots or return here from the bot card.',
    primaryAction: 'Back to NEXUS',
    secondaryAction: 'Back to Dashboard',
    active: 'Active',
    paused: 'Paused',
    standby: 'Standby',
  },
  ar: {
    back: 'العودة إلى نيكسوس',
    badge: 'روبوت نيكسوس',
    brandBadge: 'عقدة أتمتة',
    titlePrefix: 'مساحة عمل',
    subtitleFallback: 'هذا الروبوت يعمل داخل بنية نيكسوس الخاصة بك.',
    line1: 'تشغيل.',
    line2: 'مراقبة.',
    line3: 'تحسين.',
    statStatus: 'الحالة الحالية',
    statSlug: 'المعرّف',
    statRuntime: 'وقت التشغيل',
    runtimeValue: '24/7',
    overview: 'نظرة عامة',
    overviewTitle: 'نقطة وصول الروبوت',
    overviewBody:
      'استخدم هذه الصفحة كنقطة دخول للروبوت المخصص لك. ستعرض الملكية والحالة ومسار مساحة عمل نيكسوس النشط.',
    detailStatus: 'الحالة',
    detailSlug: 'معرّف الروبوت',
    detailService: 'الخدمة',
    detailCoverage: 'التغطية',
    coverageValue: 'سير عمل نشط',
    notesTitle: 'لقطة تشغيلية',
    noteOneTitle: 'مرتبط بحسابك',
    noteOneBody: 'هذا الروبوت مرتبط بحسابك في ترتل شيل ومتاح من داخل قسم نيكسوس.',
    noteTwoTitle: 'الخطوة التالية',
    noteTwoBody: 'استخدم لوحة نيكسوس لإدارة الروبوتات الأخرى أو عد إلى هنا من بطاقة الروبوت.',
    primaryAction: 'العودة إلى نيكسوس',
    secondaryAction: 'العودة إلى لوحة التحكم',
    active: 'نشط',
    paused: 'متوقف',
    standby: 'جاهز',
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

export default function NexusBotPageClient({ bot }: NexusBotPageClientProps) {
  const lang = useRuntimeLanguage()
  const isRTL = lang === 'ar'
  const copy = COPY[lang as keyof typeof COPY] ?? COPY.en
  const statusLabel = getStatusLabel(bot.status, copy)

  return (
    <div className="systems-page systems-page--nexus-bot" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="systems-page-orb systems-page-orb--one" aria-hidden="true" />
      <div className="systems-page-orb systems-page-orb--two" aria-hidden="true" />

      <div className="systems-shell">
        <aside className="systems-brand-panel" aria-hidden="true">
          <span className="systems-brand-badge">{copy.brandBadge}</span>
          <div className="systems-brand-lockup">
            <img className="systems-brand-logo" src="/TURTLESHELL-LOGO.png" alt="" />
            <span className="systems-brand-wordmark">TURTLESHELL</span>
          </div>

          <div className="systems-brand-display">
            <span>{copy.line1}</span>
            <span>{copy.line2}</span>
            <span>{copy.line3}</span>
          </div>

          <p className="systems-brand-copy">{bot.description || copy.subtitleFallback}</p>

          <div className="systems-brand-stats">
            <div className="systems-brand-stat">
              <strong>{statusLabel}</strong>
              <span>{copy.statStatus}</span>
            </div>
            <div className="systems-brand-stat">
              <strong>{bot.bot_slug}</strong>
              <span>{copy.statSlug}</span>
            </div>
            <div className="systems-brand-stat">
              <strong>{copy.runtimeValue}</strong>
              <span>{copy.statRuntime}</span>
            </div>
          </div>
        </aside>

        <section className="systems-main-panel">
          <PageHeader
            variant="compact"
            backHref="/systems/nexus"
            backLabel={
              <>
                {isRTL ? '→ ' : '← '}
                {copy.back}
              </>
            }
            badge={copy.badge}
            title={
              <>
                {copy.titlePrefix}
                {isRTL ? ' ' : ': '}
                {bot.bot_name}
              </>
            }
            description={bot.description || copy.subtitleFallback}
          />

          <div className="nexus-bot-grid">
            <section className="nexus-bot-overview">
              <div className="nexus-bot-overview-topline">{copy.overview}</div>
              <h2 className="nexus-bot-overview-title">{copy.overviewTitle}</h2>
              <p className="nexus-bot-overview-body">{copy.overviewBody}</p>

              <div className="nexus-bot-metrics">
                <div className="nexus-bot-metric">
                  <span className="nexus-bot-metric-label">{copy.detailStatus}</span>
                  <span className="nexus-bot-metric-value nexus-bot-metric-value--status">
                    <span className={`status-dot status-dot--${bot.status}`}></span>
                    {statusLabel}
                  </span>
                </div>
                <div className="nexus-bot-metric">
                  <span className="nexus-bot-metric-label">{copy.detailSlug}</span>
                  <span className="nexus-bot-metric-value">{bot.bot_slug}</span>
                </div>
                <div className="nexus-bot-metric">
                  <span className="nexus-bot-metric-label">{copy.detailService}</span>
                  <span className="nexus-bot-metric-value">NEXUS</span>
                </div>
                <div className="nexus-bot-metric">
                  <span className="nexus-bot-metric-label">{copy.detailCoverage}</span>
                  <span className="nexus-bot-metric-value">{copy.coverageValue}</span>
                </div>
              </div>

              <div className="nexus-bot-actions">
                <a href="/systems/nexus" className="systems-card-btn systems-card-btn--active glass-btn glass-btn-primary">
                  {copy.primaryAction}{' '}
                  <span className={`arrow ${isRTL ? 'arrow--left' : 'arrow--right'}`}>{isRTL ? '\u2190' : '\u2192'}</span>
                </a>
                <a href="/systems" className="systems-card-btn nexus-bot-secondary-btn glass-btn">
                  {copy.secondaryAction}
                </a>
              </div>
            </section>

            <aside className="nexus-bot-notes">
              <div className="nexus-bot-note-card">
                <div className="nexus-bot-note-badge">{copy.notesTitle}</div>
                <h3>{copy.noteOneTitle}</h3>
                <p>{copy.noteOneBody}</p>
              </div>
              <div className="nexus-bot-note-card">
                <div className="nexus-bot-note-badge">{copy.badge}</div>
                <h3>{copy.noteTwoTitle}</h3>
                <p>{copy.noteTwoBody}</p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  )
}


