'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import type { UserIdentity } from '@supabase/auth-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import SupportModal from '@/components/modals/SupportModal'
import { openSupportModal } from '@/lib/support-modal-manager'
import styles from './page.module.css'

const EN_COPY = {
  loading: 'Loading...',
  back: '\u2190 Back to dashboard',
  back_home: '\u2190 Back to home',
  title: 'Account',
  subtitle: 'Manage your profile and security settings.',
  profile: 'PROFILE',
  profile_section: 'Profile',
  security_section: 'Security',
  danger_zone: 'Danger Zone',
  lock_msg: 'Username and email cannot be changed.',
  lock_detail: 'If you need to update them, please',
  lock_support: 'contact support',
  email: 'Email',
  username: 'Username',
  locked_badge: 'locked',
  fullname: 'Full Name',
  fullname_hint: '(editable)',
  fullname_ph: 'Your full name',
  save: 'Save',
  saving: 'Saving...',
  password: 'PASSWORD',
  new_pass: 'New Password',
  new_pass_ph: 'Min. 8 characters',
  confirm_pass: 'Confirm New Password',
  confirm_pass_ph: 'Repeat new password',
  update_pass: 'Update Password',
  forgot: "Forgot your password? We'll send a reset link to your email.",
  send_reset: 'Send Reset Email',
  sending: 'Sending...',
  account_section: 'ACCOUNT',
  contact_note: 'Need to delete your account or change your email? Contact our support team.',
  contact_btn: 'Contact Support',
  delete_title: 'Deletion Request',
  delete_note: 'Tell us why you want to delete your account. We will review your request.',
  delete_email_for: 'Request for',
  delete_reason: 'Why are you leaving?',
  delete_reason_none: 'No reason',
  delete_reason_privacy: 'Privacy concerns',
  delete_reason_issues: 'Too many bugs/issues',
  delete_reason_not_needed: 'No longer needed',
  delete_reason_switch: 'Moving to another platform',
  delete_reason_other: 'Other',
  delete_details: 'Extra details (optional)',
  delete_details_ph: 'Anything you want us to know before deleting your account.',
  delete_confirm: 'I understand this may permanently remove my account.',
  delete_confirm_needed: 'Please confirm before sending your request.',
  delete_send: 'Send Account Deletion Request',
  delete_sending: 'Sending request...',
  delete_sent: 'Request sent! We will follow up on your email shortly.',
  oauth_note: 'You signed in with Google. Password management is handled by Google.',
  google_link_note: 'Add Google to your account for faster sign in.',
  google_link_btn: 'Add Google account',
  google_linking: 'Redirecting...',
  google_link_redirect: 'Redirecting to Google...',
  google_linked: 'Google account is already linked.',
  google_unlink_btn: 'Unlink Google account',
  google_unlinking: 'Unlinking...',
  google_unlinked: 'Google account unlinked.',
  google_unlink_missing: 'Google account link was not found.',
  pass_mismatch: 'Passwords do not match.',
  pass_short: 'Password must be at least 8 characters.',
  name_saved: 'Name updated successfully.',
  pass_saved: 'Password updated successfully.',
  reset_sent: 'Reset link sent to',
  error_prefix: 'Error:',
}

const AR_COPY = {
  loading: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...',
  back: '\u2192 \u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645',
  back_home: '\u2192 \u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629',
  title: '\u0627\u0644\u062d\u0633\u0627\u0628',
  subtitle: '\u0625\u062f\u0627\u0631\u0629 \u0645\u0644\u0641\u0643 \u0627\u0644\u0634\u062e\u0635\u064a \u0648\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0623\u0645\u0627\u0646.',
  profile: '\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a',
  profile_section: '\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a',
  security_section: '\u0627\u0644\u0623\u0645\u0627\u0646',
  danger_zone: '\u0645\u0646\u0637\u0642\u0629 \u062e\u0637\u0631\u0629',
  lock_msg: '\u0644\u0627 \u064a\u0645\u0643\u0646 \u062a\u063a\u064a\u064a\u0631 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0648\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a.',
  lock_detail: '\u0625\u0630\u0627 \u0643\u0646\u062a \u0628\u062d\u0627\u062c\u0629 \u0625\u0644\u0649 \u062a\u062d\u062f\u064a\u062b\u0647\u0645\u0627\u060c \u064a\u0631\u062c\u0649',
  lock_support: '\u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u062f\u0639\u0645',
  email: '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a',
  username: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645',
  locked_badge: '\u0645\u0642\u0641\u0644',
  fullname: '\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644',
  fullname_hint: '(\u0642\u0627\u0628\u0644 \u0644\u0644\u062a\u0639\u062f\u064a\u0644)',
  fullname_ph: '\u0627\u0633\u0645\u0643 \u0627\u0644\u0643\u0627\u0645\u0644',
  save: '\u062d\u0641\u0638',
  saving: '\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638...',
  password: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
  new_pass: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062c\u062f\u064a\u062f\u0629',
  new_pass_ph: '\u062d\u062f \u0623\u062f\u0646\u0649 8 \u0623\u062d\u0631\u0641',
  confirm_pass: '\u062a\u0623\u0643\u064a\u062f \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062c\u062f\u064a\u062f\u0629',
  confirm_pass_ph: '\u0623\u0639\u062f \u0643\u062a\u0627\u0628\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
  update_pass: '\u062a\u062d\u062f\u064a\u062b \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
  forgot: '\u0646\u0633\u064a\u062a \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631\u061f \u0633\u0646\u0631\u0633\u0644 \u0631\u0627\u0628\u0637 \u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0625\u0644\u0649 \u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a.',
  send_reset: '\u0625\u0631\u0633\u0627\u0644 \u0631\u0627\u0628\u0637 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0639\u064a\u064a\u0646',
  sending: '\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0631\u0633\u0627\u0644...',
  account_section: '\u0627\u0644\u062d\u0633\u0627\u0628',
  contact_note: '\u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u062d\u0633\u0627\u0628\u0643 \u0623\u0648 \u062a\u063a\u064a\u064a\u0631 \u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u061f \u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0641\u0631\u064a\u0642 \u0627\u0644\u062f\u0639\u0645.',
  contact_btn: '\u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u062f\u0639\u0645',
  delete_title: '\u0637\u0644\u0628 \u062d\u0630\u0641 \u0627\u0644\u062d\u0633\u0627\u0628',
  delete_note: '\u0623\u062e\u0628\u0631\u0646\u0627 \u0633\u0628\u0628 \u0631\u063a\u0628\u062a\u0643 \u0641\u064a \u062d\u0630\u0641 \u0627\u0644\u062d\u0633\u0627\u0628\u060c \u0648\u0633\u0646\u0631\u0627\u062c\u0639 \u0637\u0644\u0628\u0643.',
  delete_email_for: '\u0637\u0644\u0628 \u0644\u0640',
  delete_reason: '\u0645\u0627 \u0633\u0628\u0628 \u0627\u0644\u0645\u063a\u0627\u062f\u0631\u0629\u061f',
  delete_reason_none: '\u0628\u062f\u0648\u0646 \u0633\u0628\u0628',
  delete_reason_privacy: '\u0645\u062e\u0627\u0648\u0641 \u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629',
  delete_reason_issues: '\u0645\u0634\u0627\u0643\u0644 \u0623\u0648 \u0623\u062e\u0637\u0627\u0621 \u0645\u062a\u0643\u0631\u0631\u0629',
  delete_reason_not_needed: '\u0644\u0645 \u0623\u0639\u062f \u0628\u062d\u0627\u062c\u0629 \u0625\u0644\u064a\u0647',
  delete_reason_switch: '\u0627\u0644\u0627\u0646\u062a\u0642\u0627\u0644 \u0625\u0644\u0649 \u0645\u0646\u0635\u0629 \u0623\u062e\u0631\u0649',
  delete_reason_other: '\u0623\u0633\u0628\u0627\u0628 \u0623\u062e\u0631\u0649',
  delete_details: '\u062a\u0641\u0627\u0635\u064a\u0644 \u0625\u0636\u0627\u0641\u064a\u0629 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)',
  delete_details_ph: '\u0623\u064a \u0645\u0644\u0627\u062d\u0638\u0627\u062a \u062a\u0648\u062f \u0625\u0636\u0627\u0641\u062a\u0647\u0627 \u0642\u0628\u0644 \u062d\u0630\u0641 \u0627\u0644\u062d\u0633\u0627\u0628.',
  delete_confirm: '\u0623\u062a\u0641\u0642 \u0639\u0644\u0649 \u0623\u0646 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628 \u0642\u062f \u064a\u0624\u062f\u064a \u0625\u0644\u0649 \u062d\u0630\u0641 \u062d\u0633\u0627\u0628\u064a \u0646\u0647\u0627\u0626\u064a\u064b\u0627.',
  delete_confirm_needed: '\u064a\u0631\u062c\u0649 \u062a\u0623\u0643\u064a\u062f \u0645\u0648\u0627\u0641\u0642\u062a\u0643 \u0642\u0628\u0644 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628.',
  delete_send: '\u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u062d\u0630\u0641 \u0627\u0644\u062d\u0633\u0627\u0628',
  delete_sending: '\u062c\u0627\u0631\u064a \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628...',
  delete_sent: '\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628! \u0633\u0646\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0643 \u0639\u0628\u0631 \u0628\u0631\u064a\u062f\u0643 \u0642\u0631\u064a\u0628\u064b\u0627.',
  oauth_note: '\u0633\u062c\u0644\u062a \u0627\u0644\u062f\u062e\u0648\u0644 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 Google. \u0625\u062f\u0627\u0631\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u062a\u062a\u0645 \u0639\u0628\u0631 Google.',
  google_link_note: '\u0623\u0636\u0641 Google \u0625\u0644\u0649 \u062d\u0633\u0627\u0628\u0643 \u0644\u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644 \u0623\u0633\u0631\u0639.',
  google_link_btn: '\u0625\u0636\u0627\u0641\u0629 \u062d\u0633\u0627\u0628 Google',
  google_linking: '\u062c\u0627\u0631\u064a \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0648\u062c\u064a\u0647...',
  google_link_redirect: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0648\u062c\u064a\u0647 \u0625\u0644\u0649 Google...',
  google_linked: '\u062d\u0633\u0627\u0628 Google \u0645\u0631\u0628\u0648\u0637 \u0645\u0633\u0628\u0642\u064b\u0627.',
  google_unlink_btn: '\u0625\u0644\u063a\u0627\u0621 \u0631\u0628\u0637 \u062d\u0633\u0627\u0628 Google',
  google_unlinking: '\u062c\u0627\u0631\u064a \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0631\u0628\u0637...',
  google_unlinked: '\u062a\u0645 \u0625\u0644\u063a\u0627\u0621 \u0631\u0628\u0637 \u062d\u0633\u0627\u0628 Google.',
  google_unlink_missing: '\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0631\u0628\u0637 \u062d\u0633\u0627\u0628 Google.',
  pass_mismatch: '\u0643\u0644\u0645\u062a\u0627 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0645\u062a\u0637\u0627\u0628\u0642\u062a\u064a\u0646.',
  pass_short: '\u064a\u062c\u0628 \u0623\u0646 \u062a\u0643\u0648\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 8 \u0623\u062d\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.',
  name_saved: '\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0627\u0633\u0645 \u0628\u0646\u062c\u0627\u062d.',
  pass_saved: '\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0628\u0646\u062c\u0627\u062d.',
  reset_sent: '\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0627\u0628\u0637 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0639\u064a\u064a\u0646 \u0625\u0644\u0649',
  error_prefix: '\u062e\u0637\u0623:',
}

const TR: Record<string, Record<string, string>> = {
  en: EN_COPY,
  ar: AR_COPY,
  de: EN_COPY,
  ja: EN_COPY,
}

function useLang() {
  const [lang, setLang] = useState<string>(() => {
    if (typeof window === 'undefined') return 'en'
    const stored = localStorage.getItem('turtleshell-lang') || 'en'
    return TR[stored] ? stored : 'en'
  })

  useEffect(() => {
    const handler = () => {
      const next = localStorage.getItem('turtleshell-lang') || 'en'
      setLang(TR[next] ? next : 'en')
    }

    window.addEventListener('turtleshell-lang-change', handler)
    return () => window.removeEventListener('turtleshell-lang-change', handler)
  }, [])

  const t = useCallback((key: string) => TR[lang]?.[key] ?? TR.en[key] ?? key, [lang])
  return { lang, t }
}

export default function AccountPage() {
  const supabase = createClient()
  const router = useRouter()
  const { lang, t } = useLang()

  const [user, setUser] = useState<User | null>(null)
  const [backHref] = useState(() => {
    if (typeof window === 'undefined') return '/systems'
    const prev = sessionStorage.getItem('ts_prev_path')
    return prev && prev !== '/account' ? prev : '/systems'
  })
  const [fullName, setFullName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState('')
  const [nameError, setNameError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPass, setSavingPass] = useState(false)
  const [passMsg, setPassMsg] = useState('')
  const [passError, setPassError] = useState('')
  const [sendingReset, setSendingReset] = useState(false)
  const [resetMsg, setResetMsg] = useState('')
  const [resetMsgType, setResetMsgType] = useState<'success' | 'error' | null>(null)
  const [unlinkingGoogle, setUnlinkingGoogle] = useState(false)
  const [googleMsg, setGoogleMsg] = useState('')
  const [googleMsgType, setGoogleMsgType] = useState<'success' | 'error' | null>(null)
  const [isGoogleLinked, setIsGoogleLinked] = useState(false)
  const [googleIdentity, setGoogleIdentity] = useState<UserIdentity | null>(null)
  const [deleteReason, setDeleteReason] = useState('none')
  const [deleteDetails, setDeleteDetails] = useState('')
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [sendingDelete, setSendingDelete] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState('')
  const [deleteMsgType, setDeleteMsgType] = useState<'success' | 'error' | null>(null)
  const [deleteReasonOpen, setDeleteReasonOpen] = useState(false)
  const deleteReasonRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    sessionStorage.setItem('ts_prev_path', window.location.pathname)
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!active) return

      if (!user) {
        router.push('/login?redirect=/account')
        return
      }

      setUser(user)
      setFullName(user.user_metadata?.full_name || '')
      setIsGoogleLinked(user.app_metadata?.provider === 'google')

      const { data, error } = await supabase.auth.getUserIdentities()
      if (!active || error || !data?.identities) return
      const google = data.identities.find((identity) => identity.provider === 'google') || null
      setGoogleIdentity(google)
      setIsGoogleLinked(Boolean(google))
    })

    return () => {
      active = false
    }
  }, [router, supabase])

  useEffect(() => {
    if (!deleteReasonOpen) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (deleteReasonRef.current?.contains(target)) return
      setDeleteReasonOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDeleteReasonOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown, { passive: true })
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [deleteReasonOpen])

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return
    setSavingName(true)
    setNameMsg('')
    setNameError('')
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName.trim() } })
    setSavingName(false)
    if (error) setNameError(error.message)
    else setNameMsg(t('name_saved'))
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassMsg('')
    setPassError('')

    if (newPassword !== confirmPassword) {
      setPassError(t('pass_mismatch'))
      return
    }

    if (newPassword.length < 8) {
      setPassError(t('pass_short'))
      return
    }

    setSavingPass(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPass(false)

    if (error) {
      setPassError(error.message)
      return
    }

    setPassMsg(t('pass_saved'))
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleForgotPassword = async () => {
    if (!user?.email) return
    setSendingReset(true)
    setResetMsg('')
    setResetMsgType(null)

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${location.origin}/auth/callback?next=/account`,
    })

    setSendingReset(false)

    if (error) {
      setResetMsg(`${t('error_prefix')} ${error.message}`)
      setResetMsgType('error')
      return
    }

    setResetMsg(`${t('reset_sent')} ${user.email}`)
    setResetMsgType('success')
  }

  const handleAddGoogleAccount = () => {
    if (!user || unlinkingGoogle || isGoogleLinked) return

    setGoogleMsg('')
    setGoogleMsgType(null)
    router.push('/auth/google?mode=link&next=/account')
  }

  const handleUnlinkGoogleAccount = async () => {
    if (unlinkingGoogle || !isGoogleLinked) return

    setGoogleMsg('')
    setGoogleMsgType(null)

    if (!googleIdentity) {
      setGoogleMsg(t('google_unlink_missing'))
      setGoogleMsgType('error')
      return
    }

    setUnlinkingGoogle(true)
    const { error } = await supabase.auth.unlinkIdentity(googleIdentity)
    setUnlinkingGoogle(false)

    if (error) {
      setGoogleMsg(`${t('error_prefix')} ${error.message}`)
      setGoogleMsgType('error')
      return
    }

    setGoogleIdentity(null)
    setIsGoogleLinked(false)
    setGoogleMsg(t('google_unlinked'))
    setGoogleMsgType('success')
  }

  const handleDeleteRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeleteMsg('')
    setDeleteMsgType(null)

    if (!deleteConfirmed) {
      setDeleteMsg(t('delete_confirm_needed'))
      setDeleteMsgType('error')
      return
    }

    setSendingDelete(true)

    try {
      const res = await fetch('/api/account/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason, details: deleteDetails }),
      })
      if (!res.ok) throw new Error('Request failed')
    } catch {
      setSendingDelete(false)
      setDeleteMsg('Failed to submit request. Please try again.')
      setDeleteMsgType('error')
      return
    }

    setSendingDelete(false)
    setDeleteReason('none')
    setDeleteDetails('')
    setDeleteConfirmed(false)
    setDeleteMsg(t('delete_sent'))
    setDeleteMsgType('success')
  }

  const handleSupportContact = () => {
    openSupportModal({
      prefillEmail: user?.email || '',
      source: 'account',
      categoryDefault: 'account_profile',
    })
  }

  if (!user) {
    return (
      <div className={`systems-page systems-page--account ${styles.accountPage}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="systems-page-orb systems-page-orb--one" aria-hidden="true" />
        <div className="systems-page-orb systems-page-orb--two" aria-hidden="true" />
        <div className={styles.pageWrap}>
          <div className={styles.loadingCard}>{t('loading')}</div>
        </div>
      </div>
    )
  }

  const email = user.email || ''
  const username = user.user_metadata?.username || email.split('@')[0]
  const isOAuth = user.app_metadata?.provider === 'google'
  const isRTL = lang === 'ar'
  const backLabel = backHref === '/' ? t('back_home') : t('back')
  const deleteReasonOptions = [
    { value: 'none', label: t('delete_reason_none') },
    { value: 'privacy', label: t('delete_reason_privacy') },
    { value: 'issues', label: t('delete_reason_issues') },
    { value: 'not_needed', label: t('delete_reason_not_needed') },
    { value: 'switch', label: t('delete_reason_switch') },
    { value: 'other', label: t('delete_reason_other') },
  ] as const
  const selectedDeleteReason =
    deleteReasonOptions.find((opt) => opt.value === deleteReason)?.label || t('delete_reason_none')

  return (
    <>
      <div className={`systems-page systems-page--account ${styles.accountPage}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="systems-page-orb systems-page-orb--one" aria-hidden="true" />
        <div className="systems-page-orb systems-page-orb--two" aria-hidden="true" />

        <div className={styles.pageWrap}>
          <AccountHeader title={t('title')} subtitle={t('subtitle')} backHref={backHref} backLabel={backLabel} />

          <div className={styles.grid}>
            <div className={styles.leftColumn}>
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.sectionTitle}>{t('profile_section')}</h2>
                  <p className={`${styles.sectionText} ${styles.warningText}`}>
                    <strong>{t('lock_msg')}</strong> {t('lock_detail')}{' '}
                    <button type="button" onClick={handleSupportContact} className={styles.inlineLink}>
                      {t('lock_support')}
                    </button>
                    .
                  </p>
                </div>

                <div className={styles.readOnlyGrid}>
                  <LockedField label={t('email')} value={email} badge={t('locked_badge')} />
                  <LockedField label={t('username')} value={username} badge={t('locked_badge')} />
                </div>

                <form onSubmit={handleSaveName} className={styles.form}>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      {t('fullname')} <span className={styles.hint}>{t('fullname_hint')}</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('fullname_ph')}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.actionRow}>
                    <button type="submit" disabled={savingName} className={styles.primaryButton}>
                      {savingName ? t('saving') : t('save')}
                    </button>
                  </div>
                  {nameMsg && <Msg type="success">{nameMsg}</Msg>}
                  {nameError && <Msg type="error">{nameError}</Msg>}
                </form>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.sectionTitle}>{t('security_section')}</h2>
                </div>

                <div className={styles.resetBlock}>
                  <p className={styles.mutedText}>{isGoogleLinked ? t('google_linked') : t('google_link_note')}</p>
                  <div className={styles.actionRow}>
                    {isGoogleLinked ? (
                      <button
                        type="button"
                        onClick={handleUnlinkGoogleAccount}
                        disabled={unlinkingGoogle}
                        className={styles.googleButton}
                      >
                        <GoogleIcon />
                        {unlinkingGoogle ? t('google_unlinking') : t('google_unlink_btn')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAddGoogleAccount}
                        disabled={unlinkingGoogle}
                        className={styles.googleButton}
                      >
                        <GoogleIcon />
                        {t('google_link_btn')}
                      </button>
                    )}
                  </div>
                  {googleMsg && googleMsgType && <Msg type={googleMsgType}>{googleMsg}</Msg>}
                </div>
                <div className={styles.divider} />

                {isOAuth ? (
                  <p className={styles.mutedText}>{t('oauth_note')}</p>
                ) : (
                  <>
                    <form onSubmit={handleChangePassword} className={`${styles.form} ${styles.stack}`}>
                      <div className={styles.field}>
                        <label className={styles.label}>{t('new_pass')}</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={t('new_pass_ph')}
                          minLength={8}
                          required
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>{t('confirm_pass')}</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={t('confirm_pass_ph')}
                          required
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.actionRow}>
                        <button type="submit" disabled={savingPass} className={styles.primaryButton}>
                          {savingPass ? t('saving') : t('update_pass')}
                        </button>
                      </div>
                    </form>

                    {passMsg && <Msg type="success">{passMsg}</Msg>}
                    {passError && <Msg type="error">{passError}</Msg>}

                    <div className={styles.divider} />

                    <div className={styles.resetBlock}>
                      <p className={styles.mutedText}>{t('forgot')}</p>
                      <div className={styles.actionRow}>
                        <button type="button" onClick={handleForgotPassword} disabled={sendingReset} className={styles.secondaryButton}>
                          {sendingReset ? t('sending') : t('send_reset')}
                        </button>
                      </div>
                      {resetMsg && resetMsgType && <Msg type={resetMsgType}>{resetMsg}</Msg>}
                    </div>
                  </>
                )}
              </section>
            </div>

            <section className={`${styles.card} ${styles.dangerCard}`}>
              <div className={styles.cardHeader}>
                <h2 className={styles.sectionTitle}>{t('danger_zone')}</h2>
                <p className={`${styles.sectionText} ${styles.warningText}`}>{t('delete_note')}</p>
              </div>

              <div className={styles.deleteEmail}>
                <span>{t('delete_email_for')}</span>
                <strong>{email}</strong>
              </div>

              <form onSubmit={handleDeleteRequest} className={`${styles.form} ${styles.stack}`}>
                <div className={styles.field}>
                  <label className={styles.label}>{t('delete_reason')}</label>
                  <input type="hidden" name="delete_reason" value={deleteReason} />
                  <div className={`${styles.reasonSelect} ${deleteReasonOpen ? styles.reasonSelectOpen : ''}`} ref={deleteReasonRef}>
                    <button
                      type="button"
                      className={styles.reasonTrigger}
                      aria-haspopup="listbox"
                      aria-expanded={deleteReasonOpen}
                      onClick={() => setDeleteReasonOpen((open) => !open)}
                    >
                      <span className={styles.reasonCurrent}>{selectedDeleteReason}</span>
                      <span className={styles.reasonChevron} aria-hidden="true">{'\u25be'}</span>
                    </button>
                    <div className={styles.reasonMenu} role="listbox" aria-label={t('delete_reason')}>
                      {deleteReasonOptions.map((opt) => {
                        const selected = deleteReason === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            className={`${styles.reasonItem} ${selected ? styles.reasonItemSelected : ''}`}
                            onClick={() => {
                              setDeleteReason(opt.value)
                              setDeleteReasonOpen(false)
                            }}
                          >
                            <span className={styles.reasonDot} aria-hidden="true" />
                            <span>{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>{t('delete_details')}</label>
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    rows={4}
                    placeholder={t('delete_details_ph')}
                    value={deleteDetails}
                    onChange={(e) => setDeleteDetails(e.target.value)}
                  />
                </div>

                <label className={`${styles.check} ${styles.warningText}`}>
                  <input
                    type="checkbox"
                    checked={deleteConfirmed}
                    onChange={(e) => setDeleteConfirmed(e.target.checked)}
                  />
                  <span>{t('delete_confirm')}</span>
                </label>

                <div className={styles.actionRow}>
                  <button type="submit" disabled={sendingDelete || !deleteConfirmed} className={styles.dangerButton}>
                    {sendingDelete ? t('delete_sending') : t('delete_send')}
                  </button>
                </div>

                {deleteMsg && deleteMsgType && <Msg type={deleteMsgType}>{deleteMsg}</Msg>}
              </form>
            </section>
          </div>
        </div>
      </div>

      <SupportModal />
    </>
  )
}

function LockedField({ label, value, badge }: { label: string; value: string; badge: string }) {
  return (
    <div className={styles.lockedField}>
      <label className={styles.label}>
        {label}
        <span className={styles.fieldBadge}>{badge}</span>
      </label>
      <div className={styles.fieldValue}>{value}</div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function Msg({ type, children }: { type: 'success' | 'error'; children: React.ReactNode }) {
  return <div className={`${styles.msg} ${type === 'success' ? styles.msgSuccess : styles.msgError}`}>{children}</div>
}

function AccountHeader({
  title,
  subtitle,
  backHref,
  backLabel,
}: {
  title: string
  subtitle: string
  backHref: string
  backLabel: string
}) {
  return (
    <header className={styles.header}>
      <a href={backHref} className={styles.backLink}>
        {backLabel}
      </a>
      <h1 className={styles.pageTitle}>{title}</h1>
      <p className={styles.pageSubtitle}>{subtitle}</p>
    </header>
  )
}

