/**
 * ResetPassword.jsx
 * Ported from reset-password.html.
 * Handles the Supabase magic-link recovery flow:
 *   - Reads #access_token from the URL hash
 *   - Sets the session, then calls updateUser({ password })
 *   - On success, signs out and redirects to /login
 */
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { sendPasswordChangedNotification } from '../lib/api/notificationsService'

export default function ResetPassword() {
  const navigate = useNavigate()

  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPwd, setShowPwd]           = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)

  const [status, setStatus]             = useState('idle')   // idle | loading | success | error | invalid
  const [errorMsg, setErrorMsg]         = useState('')
  const [tokenReady, setTokenReady]     = useState(false)
  const sessionSet = useRef(false)

  // ── Validate the URL hash token on mount ──────────────────────
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken   = params.get('access_token')
    const refreshToken  = params.get('refresh_token') || ''
    const type          = params.get('type')

    if (!accessToken || type !== 'recovery') {
      setStatus('invalid')
      return
    }

    // Set session once so updateUser() works
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) console.warn('[ResetPwd] Session warn:', error.message)
        sessionSet.current = true
        setTokenReady(true)
      })
  }, [])

  // ── Submit handler ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirm) {
      setErrorMsg('Passwords do not match.')
      setStatus('error')
      return
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      const { data: updateData, error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      if (updateData?.user?.id) sendPasswordChangedNotification(updateData.user.id).catch(() => {})

      setStatus('success')
      await supabase.auth.signOut()

      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password. Please try again.')
      setStatus('error')
    }
  }

  // ── Strength indicator ─────────────────────────────────────────
  const strength = (() => {
    const p = password
    if (!p) return null
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    if (score <= 1) return { label: 'Weak', color: '#ef4444', pct: 25 }
    if (score === 2) return { label: 'Fair', color: '#f59e0b', pct: 50 }
    if (score === 3) return { label: 'Good', color: '#3b82f6', pct: 75 }
    return { label: 'Strong', color: '#22c55e', pct: 100 }
  })()

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#020408',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'var(--font-body)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '5%', left: '5%', width: 320, height: 320, background: 'rgba(59,130,246,0.12)', borderRadius: '50%', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: 320, height: 320, background: 'rgba(124,58,237,0.10)', borderRadius: '50%', filter: 'blur(90px)' }} />
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 420,
        background: 'rgba(20,25,35,0.5)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 28,
        padding: '36px 32px',
        boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>PlusOpinion</span>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '8px 0 4px', fontFamily: 'var(--font-heading)', letterSpacing: '-0.5px' }}>
            Reset Password
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Enter your new password below</p>
        </div>

        {/* Invalid token state */}
        {status === 'invalid' && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: 20, marginBottom: 20, textAlign: 'center' }}>
            <p style={{ fontWeight: 700, color: '#f87171', marginBottom: 6 }}>Invalid or Expired Link</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              This password reset link has expired or is invalid.<br />
              Please request a new one from the login page.
            </p>
            <Link to="/login" style={{ display: 'inline-block', marginTop: 16, color: '#60a5fa', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              ← Back to Login
            </Link>
          </div>
        )}

        {/* Success state */}
        {status === 'success' && (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, background: 'rgba(34,197,94,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{ fontWeight: 700, color: '#4ade80', fontSize: 16, marginBottom: 6 }}>Password Updated!</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Redirecting to login…</p>
          </div>
        )}

        {/* Form — shown when token ready and not success/invalid */}
        {(status !== 'invalid' && status !== 'success') && (
          <form onSubmit={handleSubmit}>
            {/* Error message */}
            {status === 'error' && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#f87171' }}>{errorMsg}</p>
              </div>
            )}

            {/* New Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                New Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  disabled={!tokenReady || status === 'loading'}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 14, padding: '14px 44px 14px 16px',
                    color: '#fff', fontSize: 15, outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'var(--font-body)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    {showPwd ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {/* Strength bar */}
              {strength && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, borderRadius: 2, transition: 'width 0.3s, background 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: strength.color, marginTop: 4, display: 'block', fontWeight: 600 }}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Confirm Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  disabled={!tokenReady || status === 'loading'}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${confirm && confirm !== password ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 14, padding: '14px 44px 14px 16px',
                    color: '#fff', fontSize: 15, outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'var(--font-body)',
                  }}
                  onFocus={e => {
                    if (!(confirm && confirm !== password))
                      e.target.style.borderColor = 'rgba(59,130,246,0.5)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = confirm && confirm !== password
                      ? 'rgba(239,68,68,0.4)'
                      : 'rgba(255,255,255,0.1)'
                  }}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    {showConfirm ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {confirm && confirm !== password && (
                <p style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>Passwords don't match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!tokenReady || status === 'loading' || !password || !confirm}
              style={{
                width: '100%',
                background: (status === 'loading' || !tokenReady || !password || !confirm)
                  ? 'rgba(59,130,246,0.4)'
                  : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: 'none',
                borderRadius: 14,
                padding: '15px 0',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: (status === 'loading' || !tokenReady || !password || !confirm) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-body)',
                boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
              }}
            >
              {status === 'loading' ? 'UPDATING…' : 'UPDATE PASSWORD'}
            </button>
          </form>
        )}

        {/* Back to login */}
        {status !== 'success' && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#60a5fa'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
            >
              ← Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
