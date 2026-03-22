'use client'

import { useRuntimeLanguage } from '@/lib/use-runtime-language'
import PageHeader from '@/components/PageHeader'

type SystemsPageClientProps = {
  name: string
  ownedKeys: string[]
}

const COPY = {
  en: {
    dashLabel: 'Dashboard',
    dashWelcome: 'Welcome back',
    dashSubtitle: 'Your active infrastructure is below. Contact us to add more services.',
    dashLine1: 'Manage.',
    dashLine2: 'Monitor.',
    dashLine3: 'Scale.',
    dashStatServices: 'Active services',
    dashStatCoverage: 'Infrastructure coverage',
    dashStatSupport: 'Support window',
    access: 'Access',
    locked: 'Not Available',
    svcNexusSub: 'Automation Infrastructure',
    svcNexusDesc: 'Your custom automation systems, bots, workflows, and scheduled tasks running 24/7.',
    svcAtlasSub: 'Web Infrastructure',
    svcAtlasDesc: 'Your websites, dashboards, and web platforms, built, deployed, and maintained.',
    svcGenosSub: 'Mobile Infrastructure',
    svcGenosDesc: 'Native and cross-platform mobile applications built for your business.',
  },
  ar: {
    dashLabel: 'لوحة التحكم',
    dashWelcome: 'أهلاً بعودتك',
    dashSubtitle: 'بنيتك التحتية النشطة أدناه. تواصل معنا لإضافة المزيد من الخدمات.',
    dashLine1: 'إدارة.',
    dashLine2: 'مراقبة.',
    dashLine3: 'توسيع.',
    dashStatServices: 'الخدمات النشطة',
    dashStatCoverage: 'تغطية البنية',
    dashStatSupport: 'نافذة الدعم',
    access: 'الوصول',
    locked: 'غير متاح',
    svcNexusSub: 'بنية الأتمتة',
    svcNexusDesc: 'أنظمة الأتمتة المخصصة لك، والروبوتات، وسير العمل، والمهام المجدولة التي تعمل على مدار الساعة.',
    svcAtlasSub: 'بنية الويب',
    svcAtlasDesc: 'مواقعك الإلكترونية ولوحات التحكم ومنصات الويب الخاصة بك، مبنية ومنشورة ومدارة بالكامل.',
    svcGenosSub: 'بنية الجوال',
    svcGenosDesc: 'تطبيقات جوال أصلية ومتعددة المنصات مبنية خصيصاً لعملك.',
  },
  de: {
    dashLabel: 'Dashboard',
    dashWelcome: 'Willkommen zurück',
    dashSubtitle: 'Ihre aktive Infrastruktur ist unten. Kontaktieren Sie uns, um weitere Dienste hinzuzufügen.',
    dashLine1: 'Steuern.',
    dashLine2: 'Überwachen.',
    dashLine3: 'Skalieren.',
    dashStatServices: 'Aktive Dienste',
    dashStatCoverage: 'Infrastruktur-Abdeckung',
    dashStatSupport: 'Support-Fenster',
    access: 'Zugriff',
    locked: 'Nicht verfügbar',
    svcNexusSub: 'Automatisierungsinfrastruktur',
    svcNexusDesc: 'Ihre benutzerdefinierten Automatisierungssysteme, Bots, Workflows und geplanten Aufgaben laufen rund um die Uhr.',
    svcAtlasSub: 'Web-Infrastruktur',
    svcAtlasDesc: 'Ihre Websites, Dashboards und Web-Plattformen, erstellt, bereitgestellt und gewartet.',
    svcGenosSub: 'Mobile Infrastruktur',
    svcGenosDesc: 'Native und plattformübergreifende mobile Anwendungen für Ihr Unternehmen.',
  },
  ja: {
    dashLabel: 'ダッシュボード',
    dashWelcome: 'おかえりなさい',
    dashSubtitle: 'アクティブなインフラは下記の通りです。サービスを追加するにはお問い合わせください。',
    dashLine1: '管理.',
    dashLine2: '監視.',
    dashLine3: '拡張.',
    dashStatServices: '稼働中のサービス',
    dashStatCoverage: 'インフラ範囲',
    dashStatSupport: 'サポート時間',
    access: 'アクセス',
    locked: '利用不可',
    svcNexusSub: '自動化インフラ',
    svcNexusDesc: 'カスタム自動化システム、ボット、ワークフロー、定期実行タスクが24時間稼働します。',
    svcAtlasSub: 'Webインフラ',
    svcAtlasDesc: 'Webサイト、ダッシュボード、Webプラットフォームを構築・公開・保守します。',
    svcGenosSub: 'モバイルインフラ',
    svcGenosDesc: 'お客様のビジネス向けに構築されたネイティブおよびクロスプラットフォームのモバイルアプリです。',
  },
} as const

export default function SystemsPageClient({ name, ownedKeys }: SystemsPageClientProps) {
  const lang = useRuntimeLanguage()
  const isRTL = lang === 'ar'
  const copy = COPY[lang as keyof typeof COPY] ?? COPY.en
  const owned = new Set(ownedKeys)

  const services = [
    {
      key: 'nexus',
      label: 'NEXUS',
      subtitle: copy.svcNexusSub,
      description: copy.svcNexusDesc,
      icon: '🤖',
      accent: 'var(--accent)',
      href: '/systems/nexus',
    },
    {
      key: 'atlas',
      label: 'ATLAS',
      subtitle: copy.svcAtlasSub,
      description: copy.svcAtlasDesc,
      icon: '🌐',
      accent: '#8b5cf6',
      href: '/systems/atlas',
    },
    {
      key: 'genos',
      label: 'GENOS',
      subtitle: copy.svcGenosSub,
      description: copy.svcGenosDesc,
      icon: '📱',
      accent: '#10b981',
      href: '/systems/genos',
    },
  ]

  const activeCount = services.filter((svc) => owned.has(svc.key)).length

  return (
    <div className="systems-page systems-page--dashboard" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="systems-page-orb systems-page-orb--one" aria-hidden="true" />
      <div className="systems-page-orb systems-page-orb--two" aria-hidden="true" />

      <div className="systems-shell">
        <aside className="systems-brand-panel" aria-hidden="true">
          <span className="systems-brand-badge">{copy.dashLabel}</span>
          <div className="systems-brand-lockup">
            <img className="systems-brand-logo" src="/TURTLESHELL-LOGO.png" alt="" />
            <span className="systems-brand-wordmark">TURTLESHELL</span>
          </div>

          <div className="systems-brand-display">
            <span>{copy.dashLine1}</span>
            <span>{copy.dashLine2}</span>
            <span>{copy.dashLine3}</span>
          </div>

          <p className="systems-brand-copy">{copy.dashSubtitle}</p>

          <div className="systems-brand-stats">
            <div className="systems-brand-stat">
              <strong>{activeCount}/3</strong>
              <span>{copy.dashStatServices}</span>
            </div>
            <div className="systems-brand-stat">
              <strong>24/7</strong>
              <span>{copy.dashStatSupport}</span>
            </div>
            <div className="systems-brand-stat">
              <strong>100%</strong>
              <span>{copy.dashStatCoverage}</span>
            </div>
          </div>
        </aside>

        <section className="systems-main-panel">
          <PageHeader
            variant="hero"
            badge={copy.dashLabel}
            title={
              <>
                {copy.dashWelcome}
                {!isRTL ? ', ' : ' '}
                {name}
              </>
            }
            description={copy.dashSubtitle}
          />

          <div className="systems-carousel-wrap">
            {services.map((svc) => {
              const active = owned.has(svc.key)
          return (
                active ? (
                  <a
                    key={svc.key}
                    href={svc.href}
                    className="systems-card systems-card--active systems-card-link"
                    style={{ '--svc-accent': svc.accent } as React.CSSProperties}
                  >
                    <div className="systems-card-accent-line" />
                    <div className="systems-card-icon">{svc.icon}</div>
                    <div className="systems-card-tag">{svc.label}</div>
                    <h3 className="systems-card-title">{svc.subtitle}</h3>
                    <p className="systems-card-desc">{svc.description}</p>
                    <span className="systems-card-btn systems-card-btn--active glass-btn glass-btn-primary">
                      {copy.access} {svc.label}{' '}
                      <span className={`arrow ${isRTL ? 'arrow--left' : 'arrow--right'}`}>{isRTL ? '\u2190' : '\u2192'}</span>
                    </span>
                  </a>
                ) : (
                  <div
                    key={svc.key}
                    className="systems-card systems-card--locked"
                    style={{ '--svc-accent': svc.accent } as React.CSSProperties}
                  >
                    <div className="systems-card-accent-line" />
                    <div className="systems-card-icon">{svc.icon}</div>
                    <div className="systems-card-tag">{svc.label}</div>
                    <h3 className="systems-card-title">{svc.subtitle}</h3>
                    <p className="systems-card-desc">{svc.description}</p>
                    <div className="systems-card-btn systems-card-btn--locked">
                      {'\u{1F512}'} {copy.locked}
                    </div>
                  </div>
                )
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}


