'use client'

import { type FormEvent, type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRuntimeLanguage } from '@/lib/use-runtime-language'
import {
  OPEN_SUPPORT_MODAL_EVENT,
  type OpenSupportModalOptions,
  type SupportCategory,
} from '@/lib/support-modal-manager'
import styles from './SupportModal.module.css'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const COPY = {
  en: {
    title: 'Contact Support',
    subtitle: "We'll reply within 24 hours.",
    close: 'Close support modal',
    email: 'Email',
    category: 'Category',
    subject: 'Subject',
    message: 'Message',
    diagnostics: 'Include diagnostics',
    diagnosticsHint: 'Adds URL, browser, locale, viewport, and app version.',
    categoryOptions: {
      account_profile: 'Account / Profile',
      security_password: 'Security / Password',
      billing: 'Billing',
      bug: 'Bug / Something broken',
      other: 'Other',
    } satisfies Record<SupportCategory, string>,
    subjectPlaceholder: 'Short summary of your issue',
    messagePlaceholder: 'Describe what happened, what you expected, and any steps to reproduce.',
    cancel: 'Cancel',
    send: 'Send to Support',
    sending: 'Sending...',
    submitError: 'Something went wrong. Please email support@turtleshell.dev.',
    validationError: 'Please fill in all required fields.',
    successToast: 'Support ticket sent. We will reply soon.',
    successInline: 'Support ticket sent. We will reply soon.',
  },
  ar: {
    title: '\u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u062f\u0639\u0645',
    subtitle: '\u0633\u0646\u0631\u062f \u0639\u0644\u064a\u0643 \u062e\u0644\u0627\u0644 24 \u0633\u0627\u0639\u0629.',
    close: '\u0625\u063a\u0644\u0627\u0642 \u0646\u0627\u0641\u0630\u0629 \u0627\u0644\u062f\u0639\u0645',
    email: '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a',
    category: '\u0627\u0644\u0641\u0626\u0629',
    subject: '\u0627\u0644\u0645\u0648\u0636\u0648\u0639',
    message: '\u0627\u0644\u0631\u0633\u0627\u0644\u0629',
    diagnostics: '\u062a\u0636\u0645\u064a\u0646 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0634\u062e\u064a\u0635',
    diagnosticsHint:
      '\u064a\u062a\u0636\u0645\u0646 \u0627\u0644\u0631\u0627\u0628\u0637 \u0648\u0627\u0644\u0645\u062a\u0635\u0641\u062d \u0648\u0627\u0644\u0644\u063a\u0629 \u0648\u062d\u062c\u0645 \u0627\u0644\u0634\u0627\u0634\u0629 \u0648\u0625\u0635\u062f\u0627\u0631 \u0627\u0644\u062a\u0637\u0628\u064a\u0642.',
    categoryOptions: {
      account_profile: '\u0627\u0644\u062d\u0633\u0627\u0628 / \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a',
      security_password: '\u0627\u0644\u0623\u0645\u0627\u0646 / \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
      billing: '\u0627\u0644\u0641\u0648\u062a\u0631\u0629',
      bug: '\u062e\u0644\u0644 / \u0634\u064a\u0621 \u0644\u0627 \u064a\u0639\u0645\u0644',
      other: '\u0623\u062e\u0631\u0649',
    } satisfies Record<SupportCategory, string>,
    subjectPlaceholder: '\u0645\u0644\u062e\u0635 \u0642\u0635\u064a\u0631 \u0644\u0644\u0645\u0634\u0643\u0644\u0629',
    messagePlaceholder:
      '\u0627\u0634\u0631\u062d \u0645\u0627 \u062d\u062f\u062b\u060c \u0648\u0645\u0627 \u0627\u0644\u0645\u062a\u0648\u0642\u0639\u060c \u0648\u062e\u0637\u0648\u0627\u062a \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u0625\u0646 \u0623\u0645\u0643\u0646.',
    cancel: '\u0625\u0644\u063a\u0627\u0621',
    send: '\u0625\u0631\u0633\u0627\u0644 \u0625\u0644\u0649 \u0627\u0644\u062f\u0639\u0645',
    sending: '\u062c\u0627\u0631\u064d \u0627\u0644\u0625\u0631\u0633\u0627\u0644...',
    submitError: '\u062d\u062f\u062b \u062e\u0637\u0623. \u064a\u0631\u062c\u0649 \u0645\u0631\u0627\u0633\u0644\u062a\u0646\u0627 \u0639\u0644\u0649 support@turtleshell.dev.',
    validationError: '\u064a\u0631\u062c\u0649 \u062a\u0639\u0628\u0626\u0629 \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629.',
    successToast: '\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u0627\u0644\u062f\u0639\u0645. \u0633\u0646\u0631\u062f \u0639\u0644\u064a\u0643 \u0642\u0631\u064a\u0628\u064b\u0627.',
    successInline: '\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u0627\u0644\u062f\u0639\u0645. \u0633\u0646\u0631\u062f \u0639\u0644\u064a\u0643 \u0642\u0631\u064a\u0628\u064b\u0627.',
  },
} as const

type Feedback = { type: 'success' | 'error'; text: string } | null

export default function SupportModal() {
  const lang = useRuntimeLanguage()
  const isArabic = lang === 'ar'
  const copy = isArabic ? COPY.ar : COPY.en

  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState<SupportCategory>('account_profile')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true)
  const [source, setSource] = useState('account')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  const overlayRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const previousBodyOverflowRef = useRef<string>('')
  const previousHtmlOverflowRef = useRef<string>('')
  const previousBodyPaddingRef = useRef<string>('')

  const categoryOptions = useMemo(
    () =>
      (Object.keys(copy.categoryOptions) as SupportCategory[]).map((value) => ({
        value,
        label: copy.categoryOptions[value],
      })),
    [copy.categoryOptions]
  )

  const resetForm = useCallback(() => {
    setCategory('account_profile')
    setSubject('')
    setMessage('')
    setIncludeDiagnostics(true)
    setSource('account')
    setSending(false)
    setFeedback(null)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setSending(false)
    setFeedback(null)
  }, [])

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<OpenSupportModalOptions>).detail || {}
      setEmail(detail.prefillEmail || '')
      setSource(detail.source || 'account')
      setCategory(detail.categoryDefault || 'account_profile')
      setSubject('')
      setMessage('')
      setIncludeDiagnostics(true)
      setFeedback(null)
      setSending(false)
      setIsOpen(true)
    }

    window.addEventListener(OPEN_SUPPORT_MODAL_EVENT, onOpen as EventListener)
    return () => window.removeEventListener(OPEN_SUPPORT_MODAL_EVENT, onOpen as EventListener)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement | null
    previousBodyOverflowRef.current = document.body.style.overflow
    previousHtmlOverflowRef.current = document.documentElement.style.overflow
    previousBodyPaddingRef.current = document.body.style.paddingRight

    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth)
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    const focusFirst = () => {
      const focusable = dialogRef.current
        ? Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        : []
      if (focusable.length > 0) {
        focusable[0].focus()
      }
    }

    const frameId = window.requestAnimationFrame(focusFirst)

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      if (event.key === 'Escape') {
        event.preventDefault()
        closeModal()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (node) => node.offsetParent !== null
      )

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.cancelAnimationFrame(frameId)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousBodyOverflowRef.current
      document.documentElement.style.overflow = previousHtmlOverflowRef.current
      document.body.style.paddingRight = previousBodyPaddingRef.current
      previousFocusRef.current?.focus()
    }
  }, [closeModal, isOpen])

  useEffect(() => {
    if (!isOpen) return

    return () => {
      resetForm()
    }
  }, [isOpen, resetForm])

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) {
      closeModal()
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedSubject = subject.trim()
    const trimmedMessage = message.trim()

    if (!email || !trimmedSubject || !trimmedMessage) {
      setFeedback({ type: 'error', text: copy.validationError })
      return
    }

    setSending(true)
    setFeedback(null)

    const normalizedSubject = trimmedSubject.startsWith('[Support]') ? trimmedSubject : `[Support] ${trimmedSubject}`
    const payload: Record<string, unknown> = {
      type: 'support',
      source,
      email,
      category,
      subject: normalizedSubject,
      message: trimmedMessage,
    }

    if (includeDiagnostics) {
      payload.diagnostics = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        locale: navigator.language || document.documentElement.lang || 'en',
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        appVersion: window.__TS_APP_VERSION || 'unknown',
      }
    }

    const endpoint = window.__TS_CONTACT_ENDPOINT || ''

    try {
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`${response.status}`)
        }
      }

      if (typeof window.showToast === 'function') {
        window.showToast(copy.successToast)
        closeModal()
      } else {
        setFeedback({ type: 'success', text: copy.successInline })
        setTimeout(() => {
          closeModal()
        }, 1200)
      }
    } catch {
      setFeedback({ type: 'error', text: copy.submitError })
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className={`${styles.overlay} ${styles.overlayOpen}`}
      onClick={handleOverlayClick}
      aria-hidden={false}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-modal-title"
        aria-describedby="support-modal-subtitle"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <button type="button" className={styles.closeButton} onClick={closeModal} aria-label={copy.close}>
          {'\u2715'}
        </button>

        <div className={styles.header}>
          <h2 id="support-modal-title" className={styles.title}>
            {copy.title}
          </h2>
          <p id="support-modal-subtitle" className={styles.subtitle}>
            {copy.subtitle}
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formBody}>
            <div className={styles.field}>
              <label htmlFor="support-email" className={styles.label}>
                {copy.email}
              </label>
              <input id="support-email" type="email" value={email} readOnly required className={styles.input} />
            </div>

            <div className={styles.field}>
              <label htmlFor="support-category" className={styles.label}>
                {copy.category}
              </label>
              <div className={styles.selectWrap}>
                <select
                  id="support-category"
                  className={`${styles.input} ${styles.select}`}
                  value={category}
                  onChange={(event) => setCategory(event.target.value as SupportCategory)}
                  required
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="support-subject" className={styles.label}>
                {copy.subject}
              </label>
              <input
                id="support-subject"
                type="text"
                className={styles.input}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={copy.subjectPlaceholder}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="support-message" className={styles.label}>
                {copy.message}
              </label>
              <textarea
                id="support-message"
                className={`${styles.input} ${styles.textarea}`}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={copy.messagePlaceholder}
                rows={6}
                required
              />
            </div>

            <label className={styles.diagnosticsRow}>
              <input
                type="checkbox"
                checked={includeDiagnostics}
                onChange={(event) => setIncludeDiagnostics(event.target.checked)}
              />
              <span className={styles.diagnosticsText}>
                <strong>{copy.diagnostics}</strong>
                <small>{copy.diagnosticsHint}</small>
              </span>
            </label>

            {feedback && (
              <div className={`${styles.feedback} ${feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess}`}>
                {feedback.text}
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button type="button" className={`${styles.button} ${styles.cancelButton}`} onClick={closeModal} disabled={sending}>
              {copy.cancel}
            </button>
            <button type="submit" className={`${styles.button} ${styles.submitButton}`} disabled={sending}>
              {sending ? copy.sending : copy.send}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
