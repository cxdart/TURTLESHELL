'use client'
import React from 'react'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRuntimeLanguage } from '@/lib/use-runtime-language'
import styles from './MeliodasBotPageClient.module.css'

type Bot = {
  id: string
  bot_name: string
  bot_slug: string
  status: string
  description?: string | null
}

type MeliodasStatus = {
  running: boolean
  pid: number | null
  uptime_seconds: number | null
}

type MeliodasSettings = {
  keyword: string
  reply_message: string
  check_interval: number
  passcode: string
  allowed_accounts: string
}

type MeliodasCredentials = {
  username: string
  password: string
}

type FlashState = {
  type: 'success' | 'error' | 'info'
  message: string
}

const DEFAULT_SETTINGS: MeliodasSettings = {
  keyword: '',
  reply_message: '',
  check_interval: 15,
  passcode: '',
  allowed_accounts: '',
}

const DEFAULT_CREDENTIALS: MeliodasCredentials = {
  username: '',
  password: '',
}

function sameSettings(a: MeliodasSettings, b: MeliodasSettings) {
  return (
    a.keyword === b.keyword &&
    a.reply_message === b.reply_message &&
    a.check_interval === b.check_interval &&
    a.passcode === b.passcode &&
    a.allowed_accounts === b.allowed_accounts
  )
}

function sameCredentials(a: MeliodasCredentials, b: MeliodasCredentials) {
  return a.username === b.username && a.password === b.password
}

const COPY = {
  en: {
    back: '\u2190 Back to NEXUS',
    badge: 'MELIODAS XBOT',
    brandBadge: 'Automation Node',
    title: 'Meliodas Control Room',
    subtitle: 'Manage the NEXUS automation system',
    line1: 'Launch.',
    line2: 'Tune.',
    line3: 'Monitor.',
    statusOnline: 'Running',
    statusOffline: 'Stopped',
    statusLabel: 'Live status',
    slugLabel: 'Bot slug',
    runtimeLabel: 'Uptime',
    pidLabel: 'Process ID',
    controlsLabel: 'Controls',
    controlsTitle: 'Bot power',
    controlsBody:
      'Start or stop the live bot process. The page polls the original NEXUS backend and mirrors its current state here.',
    start: 'Start Bot',
    stop: 'Stop Bot',
    starting: 'Starting...',
    stopping: 'Stopping...',
    allowedLabel: 'Allowed accounts',
    allowedTitle: 'Allowed Accounts',
    allowedBody:
      'Only respond to these accounts. Leave this blank if NEXUS should react to anyone that matches the keyword.',
    allowedPlaceholder: '@username1, @username2',
    saveAccounts: 'Save Accounts',
    credentialsTitle: 'Google Account',
    credentialsBody:
      'NEXUS signs into X/Twitter through your Google account. These values are sent to the original bot backend.',
    emailLabel: 'Google Email',
    emailPlaceholder: 'you@gmail.com',
    passwordLabel: 'Google Password',
    passwordPlaceholder: 'Account password',
    saveAccount: 'Save Account',
    settingsTitle: 'Settings',
    settingsBody:
      'Tune the keyword, reply message, polling interval, and passcode used by the original bot process.',
    keywordLabel: 'Keyword',
    keywordPlaceholder: 'e.g. launch',
    replyLabel: 'Reply Message',
    replyPlaceholder: 'e.g. Task received.',
    intervalLabel: 'Interval (seconds)',
    intervalPlaceholder: 'e.g. 20',
    passcodeLabel: 'Passcode',
    passcodePlaceholder: 'Optional passcode',
    saveSettings: 'Save Settings',
    logsTitle: 'Activity Log',
    logsBody: 'Latest backend lines from the NEXUS runtime.',
    logsEmpty: 'No activity yet. Start the bot to see live logs.',
    backendOffline:
      'NEXUS backend is unreachable. Start the original Flask API to enable live controls.',
    saveSuccess: 'Saved successfully.',
    accountsSaved: 'Allowed accounts saved.',
    accountSaved: 'Google account saved.',
    settingsSaved: 'Bot settings saved.',
    startSuccess: 'Meliodas is starting.',
    stopSuccess: 'Meliodas stopped.',
    requestFailed: 'Request failed.',
    saving: 'Saving...',
    saved: 'Saved',
    yes: 'Yes',
    no: 'No',
  },
  ar: {
    back: '\u2192 \u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0646\u064a\u0643\u0633\u0648\u0633',
    badge: '\u0645\u064a\u0644\u064a\u0648\u062f\u0627\u0633 XBOT',
    brandBadge: '\u0639\u0642\u062f\u0629 \u0623\u062a\u0645\u062a\u0629',
    title: '\u063a\u0631\u0641\u0629 \u062a\u062d\u0643\u0645 \u0645\u064a\u0644\u064a\u0648\u062f\u0627\u0633',
    subtitle:
      '\u0625\u062f\u0627\u0631\u0629 \u0646\u0638\u0627\u0645 \u0623\u062a\u0645\u062a\u0629 Meliodas',
    line1: '\u062a\u0634\u063a\u064a\u0644.',
    line2: '\u0636\u0628\u0637.',
    line3: '\u0645\u0631\u0627\u0642\u0628\u0629.',
    statusOnline: '\u064a\u0639\u0645\u0644',
    statusOffline: '\u0645\u062a\u0648\u0642\u0641',
    statusLabel: '\u0627\u0644\u062d\u0627\u0644\u0629 \u0627\u0644\u062d\u064a\u0629',
    slugLabel: '\u0645\u0639\u0631\u0641 \u0627\u0644\u0631\u0648\u0628\u0648\u062a',
    runtimeLabel: '\u0648\u0642\u062a \u0627\u0644\u062a\u0634\u063a\u064a\u0644',
    pidLabel: '\u0631\u0642\u0645 \u0627\u0644\u0639\u0645\u0644\u064a\u0629',
    controlsLabel: '\u0627\u0644\u062a\u062d\u0643\u0645',
    controlsTitle: '\u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0631\u0648\u0628\u0648\u062a',
    controlsBody:
      '\u0627\u0628\u062f\u0623 \u0623\u0648 \u0623\u0648\u0642\u0641 \u0639\u0645\u0644\u064a\u0629 \u0627\u0644\u0631\u0648\u0628\u0648\u062a. \u062a\u0642\u0648\u0645 \u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062d\u0629 \u0628\u0645\u0632\u0627\u0645\u0646\u0629 \u0627\u0644\u062d\u0627\u0644\u0629 \u0645\u0639 \u0627\u0644\u062e\u0644\u0641\u064a\u0629 \u0627\u0644\u0623\u0635\u0644\u064a\u0629 \u0644\u0645\u064a\u0644\u064a\u0648\u062f\u0627\u0633.',
    start: '\u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0631\u0648\u0628\u0648\u062a',
    stop: '\u0625\u064a\u0642\u0627\u0641 \u0627\u0644\u0631\u0648\u0628\u0648\u062a',
    starting: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0634\u063a\u064a\u0644...',
    stopping: '\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u064a\u0642\u0627\u0641...',
    allowedLabel: '\u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u0645\u0633\u0645\u0648\u062d \u0644\u0647\u0627',
    allowedTitle: '\u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u0645\u0633\u0645\u0648\u062d \u0644\u0647\u0627',
    allowedBody:
      '\u0631\u062f \u0641\u0642\u0637 \u0639\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a. \u0627\u062a\u0631\u0643 \u0627\u0644\u062d\u0642\u0644 \u0641\u0627\u0631\u063a\u0627\u064b \u0625\u0630\u0627 \u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u0641\u062a\u0631\u0636 \u0623\u0646 \u064a\u0633\u062a\u062c\u064a\u0628 \u0644\u0623\u064a \u062d\u0633\u0627\u0628.',
    allowedPlaceholder: '@username1, @username2',
    saveAccounts: '\u062d\u0641\u0638 \u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a',
    credentialsTitle: '\u062d\u0633\u0627\u0628 Google',
    credentialsBody:
      '\u064a\u0633\u062c\u0644 Meliodas \u0627\u0644\u062f\u062e\u0648\u0644 \u0625\u0644\u0649 X/\u062a\u0648\u064a\u062a\u0631 \u0639\u0628\u0631 \u062d\u0633\u0627\u0628 Google \u0627\u0644\u062e\u0627\u0635 \u0628\u0643. \u064a\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0647\u0630\u0647 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0625\u0644\u0649 \u0627\u0644\u062e\u0644\u0641\u064a\u0629 \u0627\u0644\u0623\u0635\u0644\u064a\u0629 \u0644\u0644\u0631\u0648\u0628\u0648\u062a.',
    emailLabel: '\u0628\u0631\u064a\u062f Google',
    emailPlaceholder: 'you@gmail.com',
    passwordLabel: '\u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 Google',
    passwordPlaceholder: '\u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0627\u0644\u062d\u0633\u0627\u0628',
    saveAccount: '\u062d\u0641\u0638 \u0627\u0644\u062d\u0633\u0627\u0628',
    settingsTitle: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a',
    settingsBody:
      '\u0636\u0628\u0637 \u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0641\u062a\u0627\u062d\u064a\u0629 \u0648\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0631\u062f \u0648\u0641\u0627\u0635\u0644 \u0627\u0644\u0641\u062d\u0635 \u0648\u0631\u0642\u0645 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0645\u0639 \u0627\u0644\u0631\u0648\u0628\u0648\u062a.',
    keywordLabel: '\u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0641\u062a\u0627\u062d\u064a\u0629',
    keywordPlaceholder: '\u0645\u062b\u0644\u0627\u064b launch',
    replyLabel: '\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0631\u062f',
    replyPlaceholder: '\u0645\u062b\u0644\u0627\u064b \u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0645\u0647\u0645\u0629.',
    intervalLabel: '\u0627\u0644\u0641\u0627\u0635\u0644 (\u0628\u0627\u0644\u062b\u0648\u0627\u0646\u064a)',
    intervalPlaceholder: '\u0645\u062b\u0644\u0627\u064b 20',
    passcodeLabel: '\u0631\u0642\u0645 \u0627\u0644\u0645\u0631\u0648\u0631',
    passcodePlaceholder: '\u0631\u0642\u0645 \u0645\u0631\u0648\u0631 \u0627\u062e\u062a\u064a\u0627\u0631\u064a',
    saveSettings: '\u062d\u0641\u0638 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a',
    logsTitle: '\u0633\u062c\u0644 \u0627\u0644\u0646\u0634\u0627\u0637',
    logsBody: '\u0622\u062e\u0631 \u0623\u0633\u0637\u0631 \u0627\u0644\u062e\u0644\u0641\u064a\u0629 \u0645\u0646 \u062a\u0634\u063a\u064a\u0644 Meliodas.',
    logsEmpty: '\u0644\u0627 \u064a\u0648\u062c\u062f \u0646\u0634\u0627\u0637 \u0628\u0639\u062f. \u0634\u063a\u0644 \u0627\u0644\u0631\u0648\u0628\u0648\u062a \u0644\u0631\u0624\u064a\u0629 \u0627\u0644\u0633\u062c\u0644\u0627\u062a.',
    backendOffline:
      '\u062e\u0644\u0641\u064a\u0629 Meliodas \u063a\u064a\u0631 \u0645\u062a\u0627\u062d\u0629. \u0634\u063a\u0644 Flask API \u0627\u0644\u0623\u0635\u0644\u064a \u0644\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u062a\u062d\u0643\u0645 \u0627\u0644\u062d\u064a.',
    saveSuccess: '\u062a\u0645 \u0627\u0644\u062d\u0641\u0638 \u0628\u0646\u062c\u0627\u062d.',
    accountsSaved: '\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u0645\u0633\u0645\u0648\u062d \u0644\u0647\u0627.',
    accountSaved: '\u062a\u0645 \u062d\u0641\u0638 \u062d\u0633\u0627\u0628 Google.',
    settingsSaved: '\u062a\u0645 \u062d\u0641\u0638 \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0631\u0648\u0628\u0648\u062a.',
    startSuccess: '\u0628\u062f\u0623 Meliodas \u0641\u064a \u0627\u0644\u062a\u0634\u063a\u064a\u0644.',
    stopSuccess: '\u062a\u0645 \u0625\u064a\u0642\u0627\u0641 Meliodas.',
    requestFailed: '\u0641\u0634\u0644 \u0627\u0644\u0637\u0644\u0628.',
    saving: '\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638...',
    saved: '\u0645\u062d\u0641\u0648\u0638',
    yes: '\u0646\u0639\u0645',
    no: '\u0644\u0627',
  },
} as const

async function requestMeliodas<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/meliodas/${endpoint}`, {
    ...init,
    cache: 'no-store',
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : {}

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.')
  }

  return payload as T
}

function formatUptime(seconds: number | null | undefined) {
  if (!seconds) return '00:00:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60

  return [hours, minutes, remainder].map((value) => String(value).padStart(2, '0')).join(':')
}

type CopyEntry = (typeof COPY)['en']

type SupportedLang = 'en' | 'ar' | 'de' | 'ja'

const CHAT_PASSWORD_COPY: Record<SupportedLang, {
  settingsBody: string
  label: string
  placeholder: string
}> = {
  en: {
    settingsBody:
      'Tune the keyword, reply message, polling interval, and chat password used by the original bot process.',
    label: 'Chat Password',
    placeholder: 'Optional chat password',
  },
  ar: {
    settingsBody:
      'اضبط الكلمة المفتاحية ورسالة الرد وفاصل الفحص وكلمة مرور الدردشة المستخدمة مع الروبوت.',
    label: 'كلمة مرور الدردشة',
    placeholder: 'كلمة مرور دردشة اختيارية',
  },
  de: {
    settingsBody:
      'Passe Keyword, Antwortnachricht, Prüfintervall und Chat-Passwort an, die vom ursprünglichen Bot-Prozess verwendet werden.',
    label: 'Chat-Passwort',
    placeholder: 'Optionales Chat-Passwort',
  },
  ja: {
    settingsBody:
      'キーワード、返信メッセージ、確認間隔、そして元のボットプロセスで使うチャットパスワードを調整します。',
    label: 'チャットパスワード',
    placeholder: '任意のチャットパスワード',
  },
}

function normalizeLang(lang: string): SupportedLang {
  const value = lang.toLowerCase()
  if (value.startsWith('ar')) return 'ar'
  if (value.startsWith('de')) return 'de'
  if (value.startsWith('ja')) return 'ja'
  return 'en'
}

function MeliodasHeader({
  backLabel,
  title,
  subtitle,
  statusText,
  running,
}: {
  backLabel: string
  title: string
  subtitle: string
  statusText: string
  running: boolean
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <Link href="/systems/nexus" className={styles.backLink}>
          {backLabel}
        </Link>
        <div className={`${styles.statusPill} ${running ? styles.statusRunning : styles.statusStopped}`}>
          <span className={`${styles.statusDot} ${running ? styles.statusDotRunning : styles.statusDotStopped}`} aria-hidden="true" />
          <span>{statusText}</span>
        </div>
      </div>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </header>
  )
}

function BotControlCard({
  copy,
  statusText,
  runtimeText,
  pid,
  slug,
  running,
  controlState,
  onStart,
  onStop,
}: {
  copy: CopyEntry
  statusText: string
  runtimeText: string
  pid: number | null
  slug: string
  running: boolean
  controlState: 'idle' | 'starting' | 'stopping'
  onStart: () => void
  onStop: () => void
}) {
  return (
    <section className={`${styles.card} ${styles.botCard}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardLabel}>{copy.controlsLabel}</div>
        <h2 className={styles.cardTitle}>{copy.controlsTitle}</h2>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>{copy.runtimeLabel}</span>
          <strong className={styles.statValue}>{runtimeText}</strong>
        </div>
      </div>

      <div className={styles.actionRow}>
        <button
          type="button"
          onClick={onStart}
          disabled={controlState !== 'idle' || running}
          className={`${styles.actionButton} ${styles.startButton}`}
        >
          {controlState === 'starting' ? copy.starting : copy.start}
        </button>
        <button
          type="button"
          onClick={onStop}
          disabled={controlState !== 'idle' || !running}
          className={`${styles.actionButton} ${styles.stopButton}`}
        >
          {controlState === 'stopping' ? copy.stopping : copy.stop}
        </button>
      </div>
    </section>
  )
}


function ActivityLogCard({
  copy,
  loading,
  logs,
}: {
  copy: CopyEntry
  loading: boolean
  logs: {text:string,ts:string}[]
}) {
  const logBoxRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight
    }
  }, [logs])

  // Group lines, insert cycle dividers after 'Cycle X complete' lines
  const grouped: ({ type: 'line'; text: string; ts: string } | { type: 'divider'; label: string })[] = []
  let cycleNum = 0
  logs.forEach(({ text, ts }) => {
    const isCycleEnd = /Cycle\s+\d+\s+complete/i.test(text)
    grouped.push({ type: 'line', text, ts })
    if (isCycleEnd) {
      cycleNum++
      grouped.push({ type: 'divider', label: `\u2500 Cycle ${cycleNum} complete \u2500` })
    }
  })

  return (
    <aside className={`${styles.card} ${styles.logCard}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardLabel}>{copy.logsTitle}</div>
        <h2 className={styles.cardTitle}>{copy.logsTitle}</h2>
        <p className={styles.cardText}>{copy.logsBody}</p>
      </div>

      <div className={styles.logBox} ref={logBoxRef}>
        {loading ? (
          <div className={styles.logEmpty}>Loading...</div>
        ) : logs.length === 0 ? (
          <div className={styles.logEmpty}>{copy.logsEmpty}</div>
        ) : (
          grouped.map((item, index) => {
            if (item.type === 'divider') {
              return <div className={styles.logDivider} key={`div-${index}`}>{item.label}</div>
            }
            const { text, ts } = item
            const isErr  = /Error|error|FAILED|Traceback|failed/.test(text)
            const isOk   = /Reply sent|Reposted|logged in|Browser ready|Bot is running|initialized|Already logged/.test(text)
            const isWarn = /skipping|Skipping|Already handled|warning|WARN/.test(text)
            const lineClass = [
              styles.logLine,
              isErr  ? styles.logLineErr  : '',
              isOk   ? styles.logLineOk   : '',
              isWarn ? styles.logLineWarn : '',
            ].filter(Boolean).join(' ')
            return (
              <div className={lineClass} key={`${index}-${text}`}>
                <span className={styles.logTs}>{ts}</span>
                <span className={styles.logText}>{text}</span>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
function AllowedAccountsCard({
  copy,
  value,
  onChange,
  onSave,
  isSaving,
  isDirty,
}: {
  copy: CopyEntry
  value: string
  onChange: (next: string) => void
  onSave: () => void
  isSaving: boolean
  isDirty: boolean
}) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardLabel}>{copy.allowedLabel}</div>
        <h2 className={styles.cardTitle}>{copy.allowedTitle}</h2>
        <p className={styles.cardText}>{copy.allowedBody}</p>
      </div>

      <textarea
        className={`${styles.input} ${styles.textarea}`}
        rows={7}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={copy.allowedPlaceholder}
      />

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || !isDirty}
        className={`${styles.primaryButton} ${!isDirty ? styles.savedButton : ''}`}
      >
        {isSaving ? copy.saving : isDirty ? copy.saveAccounts : copy.saved}
      </button>
    </section>
  )
}

function GoogleAccountCard({
  copy,
  credentials,
  onChange,
  onSave,
  isSaving,
  isDirty,
}: {
  copy: CopyEntry
  credentials: MeliodasCredentials
  onChange: (next: MeliodasCredentials) => void
  onSave: () => void
  isSaving: boolean
  isDirty: boolean
}) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardLabel}>{copy.credentialsTitle}</div>
        <h2 className={styles.cardTitle}>{copy.credentialsTitle}</h2>
        <p className={styles.cardText}>{copy.credentialsBody}</p>
      </div>

      <div className={styles.formStack}>
        <label className={styles.field}>
          <span>{copy.emailLabel}</span>
          <input
            className={styles.input}
            type="email"
            value={credentials.username}
            onChange={(event) =>
              onChange({
                ...credentials,
                username: event.target.value,
              })
            }
            placeholder={copy.emailPlaceholder}
          />
        </label>

        <label className={styles.field}>
          <span>{copy.passwordLabel}</span>
          <input
            className={styles.input}
            type="password"
            value={credentials.password}
            onChange={(event) =>
              onChange({
                ...credentials,
                password: event.target.value,
              })
            }
            placeholder={copy.passwordPlaceholder}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || !isDirty}
        className={`${styles.primaryButton} ${!isDirty ? styles.savedButton : ''}`}
      >
        {isSaving ? copy.saving : isDirty ? copy.saveAccount : copy.saved}
      </button>
    </section>
  )
}

function SettingsCard({
  copy,
  settings,
  onChange,
  onSave,
  isSaving,
  isDirty,
}: {
  copy: CopyEntry
  settings: MeliodasSettings
  onChange: (next: MeliodasSettings) => void
  onSave: () => void
  isSaving: boolean
  isDirty: boolean
}) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardLabel}>{copy.settingsTitle}</div>
        <h2 className={styles.cardTitle}>{copy.settingsTitle}</h2>
        <p className={styles.cardText}>{copy.settingsBody}</p>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>{copy.keywordLabel}</span>
          <input
            className={styles.input}
            type="text"
            value={settings.keyword}
            onChange={(event) =>
              onChange({
                ...settings,
                keyword: event.target.value,
              })
            }
            placeholder={copy.keywordPlaceholder}
          />
        </label>

        <label className={styles.field}>
          <span>{copy.replyLabel}</span>
          <input
            className={styles.input}
            type="text"
            value={settings.reply_message}
            onChange={(event) =>
              onChange({
                ...settings,
                reply_message: event.target.value,
              })
            }
            placeholder={copy.replyPlaceholder}
          />
        </label>

        <label className={styles.field}>
          <span>{copy.intervalLabel}</span>
          <input
            className={styles.input}
            type="number"
            min={5}
            value={settings.check_interval}
            onChange={(event) =>
              onChange({
                ...settings,
                check_interval: Number(event.target.value) || 15,
              })
            }
            placeholder={copy.intervalPlaceholder}
          />
        </label>

        <label className={styles.field}>
          <span>{copy.passcodeLabel}</span>
          <input
            className={styles.input}
            type="password"
            value={settings.passcode}
            onChange={(event) =>
              onChange({
                ...settings,
                passcode: event.target.value,
              })
            }
            placeholder={copy.passcodePlaceholder}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || !isDirty}
        className={`${styles.primaryButton} ${!isDirty ? styles.savedButton : ''}`}
      >
        {isSaving ? copy.saving : isDirty ? copy.saveSettings : copy.saved}
      </button>
    </section>
  )
}

export default function MeliodasBotPageClient({ bot }: { bot: Bot }) {
  const lang = useRuntimeLanguage()
  const isRTL = lang === 'ar'
  const normalizedLang = normalizeLang(lang)
  const baseCopy = COPY[normalizedLang as keyof typeof COPY] ?? COPY.en
  const chatPasswordCopy = CHAT_PASSWORD_COPY[normalizedLang]
  const copy = {
    ...baseCopy,
    settingsBody: chatPasswordCopy.settingsBody,
    passcodeLabel: chatPasswordCopy.label,
    passcodePlaceholder: chatPasswordCopy.placeholder,
  } as CopyEntry

  const [status, setStatus] = useState<MeliodasStatus>({
    running: bot.status === 'active',
    pid: null,
    uptime_seconds: null,
  })
  const [settings, setSettings] = useState<MeliodasSettings>(DEFAULT_SETTINGS)
  const [savedSettings, setSavedSettings] = useState<MeliodasSettings>(DEFAULT_SETTINGS)
  const [credentials, setCredentials] = useState<MeliodasCredentials>(DEFAULT_CREDENTIALS)
  const [savedCredentials, setSavedCredentials] = useState<MeliodasCredentials>(DEFAULT_CREDENTIALS)
  const [logs, setLogs] = useState<{text:string,ts:string}[]>([])
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState<FlashState | null>(null)
  const [savingState, setSavingState] = useState<'accounts' | 'credentials' | 'settings' | null>(null)
  const [controlState, setControlState] = useState<'idle' | 'starting' | 'stopping'>('idle')
  const flashTimerRef = useRef<number | null>(null)

  const showFlash = (type: FlashState['type'], message: string) => {
    if (flashTimerRef.current) {
      window.clearTimeout(flashTimerRef.current)
    }

    setFlash({ type, message })
    flashTimerRef.current = window.setTimeout(() => {
      setFlash(null)
    }, 3600)
  }

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        window.clearTimeout(flashTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      try {
        const [statusData, credentialsData, settingsData, logsData] = await Promise.allSettled([
          requestMeliodas<MeliodasStatus>('status'),
          requestMeliodas<{ username?: string; password?: string }>('credentials'),
          requestMeliodas<Partial<MeliodasSettings>>('settings'),
          requestMeliodas<{ lines?: string[] }>('logs'),
        ])

        if (cancelled) return

        if (statusData.status === 'fulfilled') {
          setStatus(statusData.value)
        }

        if (credentialsData.status === 'fulfilled') {
          const nextCredentials = {
            username: credentialsData.value.username || '',
            password: credentialsData.value.password || '',
          }
          setCredentials(nextCredentials)
          setSavedCredentials(nextCredentials)
        }

        if (settingsData.status === 'fulfilled') {
          const nextSettings = {
            keyword: settingsData.value.keyword || '',
            reply_message: settingsData.value.reply_message || '',
            check_interval: settingsData.value.check_interval || 15,
            passcode: settingsData.value.passcode || '',
            allowed_accounts: settingsData.value.allowed_accounts || '',
          }
          setSettings(nextSettings)
          setSavedSettings(nextSettings)
        }

        if (logsData.status === 'fulfilled') {
          const rawLines = logsData.value.lines || []
          const nowTs = new Date().toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit',second:'2-digit'})
          setLogs(rawLines.map(text => ({ text, ts: nowTs })))
        }

        const hasFailure = [statusData, credentialsData, settingsData, logsData].some(
          (result) => result.status === 'rejected'
        )

        if (hasFailure) {
          showFlash('info', copy.backendOffline)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void boot()

    return () => {
      cancelled = true
    }
  }, [copy.backendOffline])

  useEffect(() => {
    const statusTimer = window.setInterval(async () => {
      try {
        const nextStatus = await requestMeliodas<MeliodasStatus>('status')
        setStatus(nextStatus)
      } catch {
        setStatus((current) => ({ ...current, running: false }))
      }
    }, 4000)

    return () => window.clearInterval(statusTimer)
  }, [])

  useEffect(() => {
    const logTimer = window.setInterval(async () => {
      try {
        const nextLogs = await requestMeliodas<{ lines?: string[] }>('logs')
        const nextLines = nextLogs.lines || []
        setLogs(prev => {
          const nowTs = new Date().toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit',second:'2-digit'})
          return nextLines.map(text => prev.find(p => p.text === text) || { text, ts: nowTs })
        })
      } catch {
        // Keep the existing log buffer if the backend temporarily drops.
      }
    }, 3000)

    return () => window.clearInterval(logTimer)
  }, [])

  const saveAccounts = async () => {
    setSavingState('accounts')

    try {
      await requestMeliodas('settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Passcode': settings.passcode,
        },
        body: JSON.stringify(settings),
      })
      setSavedSettings(settings)
      showFlash('success', copy.accountsSaved)
    } catch (error) {
      showFlash('error', error instanceof Error ? error.message : copy.requestFailed)
    } finally {
      setSavingState(null)
    }
  }

  const saveCredentials = async () => {
    setSavingState('credentials')

    try {
      await requestMeliodas('credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })
      setSavedCredentials(credentials)
      showFlash('success', copy.accountSaved)
    } catch (error) {
      showFlash('error', error instanceof Error ? error.message : copy.requestFailed)
    } finally {
      setSavingState(null)
    }
  }

  const saveSettings = async () => {
    setSavingState('settings')

    try {
      await requestMeliodas('settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Passcode': settings.passcode,
        },
        body: JSON.stringify(settings),
      })
      setSavedSettings(settings)
      showFlash('success', copy.settingsSaved)
    } catch (error) {
      showFlash('error', error instanceof Error ? error.message : copy.requestFailed)
    } finally {
      setSavingState(null)
    }
  }

  const startBot = async () => {
    setControlState('starting')
    setLogs([]) // Clear log box immediately on start

    try {
      await requestMeliodas('start', {
        method: 'POST',
        headers: {
          'X-Passcode': settings.passcode,
        },
      })

      const nextStatus = await requestMeliodas<MeliodasStatus>('status')
      setStatus(nextStatus)
        const nextLogs = await requestMeliodas<{ lines?: string[] }>('logs')
        const nextLines = nextLogs.lines || []
        setLogs(prev => {
          const nowTs = new Date().toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit',second:'2-digit'})
          return nextLines.map(text => prev.find(p => p.text === text) || { text, ts: nowTs })
        })
      showFlash('success', copy.startSuccess)
    } catch (error) {
      showFlash('error', error instanceof Error ? error.message : copy.requestFailed)
    } finally {
      setControlState('idle')
    }
  }

  const stopBot = async () => {
    setControlState('stopping')

    try {
      await requestMeliodas('stop', {
        method: 'POST',
        headers: {
          'X-Passcode': settings.passcode,
        },
      })

      const nextStatus = await requestMeliodas<MeliodasStatus>('status')
      setStatus(nextStatus)
      showFlash('success', copy.stopSuccess)
    } catch (error) {
      showFlash('error', error instanceof Error ? error.message : copy.requestFailed)
    } finally {
      setControlState('idle')
    }
  }

  const statusText = status.running ? copy.statusOnline : copy.statusOffline
  const runtimeText = formatUptime(status.uptime_seconds)
  const accountsDirty = settings.allowed_accounts !== savedSettings.allowed_accounts
  const credentialsDirty = !sameCredentials(credentials, savedCredentials)
  const settingsDirty = !sameSettings(settings, savedSettings)

  return (
    <div className="systems-page systems-page--nexus-bot systems-page--meliodas" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="systems-page-orb systems-page-orb--one" aria-hidden="true" />
      <div className="systems-page-orb systems-page-orb--two" aria-hidden="true" />

      <div className="systems-shell systems-shell--single systems-shell--meliodas">
        <section className={`systems-main-panel systems-main-panel--meliodas ${styles.mainPanel}`}>
          <MeliodasHeader
            backLabel={copy.back}
            title={copy.title}
            subtitle={copy.subtitle}
            statusText={statusText}
            running={status.running}
          />

          {flash && (
            <div className={`${styles.flash} ${styles[`flash${flash.type[0].toUpperCase()}${flash.type.slice(1)}`]}`}>
              <strong>{flash.message}</strong>
            </div>
          )}

          <div className={styles.dashboardGrid}>
            <div className={styles.controlsArea}>
              <BotControlCard
                copy={copy}
                statusText={statusText}
                runtimeText={runtimeText}
                pid={status.pid}
                slug={bot.bot_slug}
                running={status.running}
                controlState={controlState}
                onStart={startBot}
                onStop={stopBot}
              />
            </div>

            <div className={styles.logArea}>
              <ActivityLogCard copy={copy} loading={loading} logs={logs} />
            </div>

            <div className={styles.accountsArea}>
              <div className={styles.accountsGrid}>
                <AllowedAccountsCard
                  copy={copy}
                  value={settings.allowed_accounts}
                  onChange={(allowed_accounts) =>
                    setSettings((current) => ({
                      ...current,
                      allowed_accounts,
                    }))
                  }
                  onSave={saveAccounts}
                  isSaving={savingState === 'accounts'}
                  isDirty={accountsDirty}
                />

                <GoogleAccountCard
                  copy={copy}
                  credentials={credentials}
                  onChange={setCredentials}
                  onSave={saveCredentials}
                  isSaving={savingState === 'credentials'}
                  isDirty={credentialsDirty}
                />
              </div>
            </div>

            <div className={styles.settingsArea}>
              <SettingsCard
                copy={copy}
                settings={settings}
                onChange={setSettings}
                onSave={saveSettings}
                isSaving={savingState === 'settings'}
                isDirty={settingsDirty}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
