'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LightButton from '@/components/LightButton'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => router.push('/systems'), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page-orb auth-page-orb--one" aria-hidden="true" />
      <div className="auth-page-orb auth-page-orb--two" aria-hidden="true" />
      <div className="auth-shell">
        <section className="auth-card" style={{ maxWidth: 420, margin: '0 auto' }}>
          <div className="auth-card-glow" aria-hidden="true" />
          <div className="auth-card-header">
            <span className="auth-eyebrow">TURTLESHELL ACCESS</span>
            <div className="auth-card-mark">
              <img src="/TURTLESHELL-LOGO.png" alt="" />
            </div>
            <h1>Set new password</h1>
            <p>Choose a strong password for your account.</p>
          </div>

          {error && <div className="auth-alert auth-alert--error">{error}</div>}
          {done && <div className="auth-alert auth-alert--success">Password updated! Redirecting…</div>}

          {!done && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">New password</label>
                <input
                  className="auth-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  disabled={loading}
                  required
                  minLength={8}
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Confirm password</label>
                <input
                  className="auth-input"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  disabled={loading}
                  required
                />
              </div>
              <LightButton type="submit" disabled={loading} variant="hollow" className="auth-submit-btn">
                <span>{loading ? 'Updating…' : 'Update password'}</span>
              </LightButton>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
