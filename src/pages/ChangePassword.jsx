/**
 * ChangePassword.jsx
 * Ported from change-password.html.
 * Authenticated users can change their password from within the app.
 * Accessible via /change-password (also linked from Settings panel).
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { sendPasswordChangedNotification } from '../lib/api/notificationsService'

export default function ChangePassword() {
  const navigate   = useNavigate()
  const { user }   = useAuth()

  const [newPwd,     setNewPwd]     = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showNew,    setShowNew]    = useState(false)
  const [showConf,   setShowConf]   = useState(false)

  const [status,   setStatus]   = useState('idle')   // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  // Redirect if not logged in
  if (!user) {
    navigate('/login', { replace: true })
    return null
  }

  // ── Strength ───────────────────────────────────────────────────
  const strength = (() => {
    if (!newPwd) return null
    let s = 0
    if (newPwd.length >= 8) s++
    if (/[A-Z]/.test(newPwd)) s++
    if (/[0-9]/.test(newPwd)) s++
    if (/[^A-Za-z0-9]/.test(newPwd)) s++
    if (s <= 1) return { label: 'Weak',   color: '#ef4444', pct: 25  }
    if (s === 2) return { label: 'Fair',   color: '#f59e0b', pct: 50  }
    if (s === 3) return { label: 'Good',   color: '#3b82f6', pct: 75  }
    return              { label: 'Strong', color: '#22c55e', pct: 100 }
  })()

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPwd !== confirmPwd) {
      setErrorMsg('Passwords do not match.')
      setStatus('error')
      return
    }
    if (newPwd.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) throw error
      if (user?.id) sendPasswordChangedNotification(user.id).catch(() => {})
      setStatus('success')
      setTimeout(() => navigate('/myspace', { replace: true }), 2000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password. Please try again.')
      setStatus('error')
    }
  }

  // ── Input style helper ─────────────────────────────────────────
  const inputStyle = (extra = {}) => ({
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, padding: '14px 44px 14px 16px',
    color: '#fff', fontSize: 15, outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'var(--font-body)',
    ...extra,
  })

  const eyeBtn = {
    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
    cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center',
  }

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
        <div style={{ position: 'absolute', top: '5%', left: '25%', width: 300, height: 300, background: 'rgba(59,130,246,0.1)', borderRadius: '50%', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '25%', width: 300, height: 300, background: 'rgba(124,58,237,0.08)', borderRadius: '50%', filter: 'blur(90px)' }} />
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 400,
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 28,
        padding: '32px 28px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'var(--font-heading)', letterSpacing: '-0.5px' }}>
              Change Password
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>
              Update your account security settings.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Success */}
        {status === 'success' && (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, background: 'rgba(34,197,94,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{ fontWeight: 700, color: '#4ade80', marginBottom: 4 }}>Password Updated!</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Redirecting…</p>
          </div>
        )}

        {/* Form */}
        {status !== 'success' && (
          <form onSubmit={handleSubmit}>
            {/* Error */}
            {status === 'error' && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>{errorMsg}</p>
              </div>
            )}

            {/* New Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  disabled={status === 'loading'}
                  style={inputStyle()}
                  onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowNew(v => !v)} style={eyeBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    {showNew ? (
                      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
                    ) : (
                      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                    )}
                  </svg>
                </button>
              </div>
              {strength && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: strength.color, marginTop: 3, display: 'block', fontWeight: 600 }}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConf ? 'text' : 'password'}
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  disabled={status === 'loading'}
                  style={inputStyle({
                    borderColor: confirmPwd && confirmPwd !== newPwd ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)',
                  })}
                />
                <button type="button" onClick={() => setShowConf(v => !v)} style={eyeBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    {showConf ? (
                      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
                    ) : (
                      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                    )}
                  </svg>
                </button>
              </div>
              {confirmPwd && confirmPwd !== newPwd && (
                <p style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>Passwords don't match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || !newPwd || !confirmPwd}
              style={{
                width: '100%',
                background: (status === 'loading' || !newPwd || !confirmPwd)
                  ? 'rgba(59,130,246,0.35)'
                  : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: 'none', borderRadius: 14, padding: '14px 0',
                color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '0.05em',
                cursor: (status === 'loading' || !newPwd || !confirmPwd) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', fontFamily: 'var(--font-body)',
                boxShadow: '0 8px 20px rgba(37,99,235,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {status === 'loading' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              )}
              {status === 'loading' ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
