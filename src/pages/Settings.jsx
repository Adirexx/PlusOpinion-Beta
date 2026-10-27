/**
 * Settings.jsx — Global Settings Panel
 * Route: /settings (Protected)
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useActions } from '../context/ActionsContext'
import { getBlockedUsers, unblockUser } from '../lib/api/moderation'
import { DEFAULT_AVATAR } from '../lib/constants'
import * as inboxCrypto from '../lib/inbox/inboxCrypto'
import EditProfile from '../components/profile/EditProfile'
import { sendPinChangedNotification } from '../lib/api/notificationsService'

// ── Local-storage helpers ─────────────────────────────────────────
const LS_KEY = 'po_settings_v1'
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
function savePrefs(prefs) {
  localStorage.setItem(LS_KEY, JSON.stringify(prefs))
}

const toast = (msg, icon = 'Check', isSuccess = true) =>
  window.dispatchEvent(new CustomEvent('toast', { detail: { message: msg, icon, isSuccess } }))

// ── Sub-components ────────────────────────────────────────────────

function SectionHeader({ children }) {
  return (
    <div style={{ paddingBottom: 6, marginBottom: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {children}
      </span>
    </div>
  )
}

function SettingsRow({ icon, label, sublabel, right, onClick, danger, borderTop }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 0', background: 'none', border: 'none',
        borderTop: borderTop ? '1px solid rgba(255,255,255,0.06)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        textAlign: 'left',
        transition: 'opacity 0.15s',
        opacity: hov && onClick ? 0.75 : 1,
      }}
    >
      {icon && (
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: danger ? '#ef4444' : 'rgba(255,255,255,0.6)',
        }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: danger ? '#ef4444' : '#fff', lineHeight: 1.2 }}>{label}</p>
        {sublabel && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.3 }}>{sublabel}</p>}
      </div>
      {right !== undefined ? right : (
        onClick && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )
      )}
    </button>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 46, height: 26, borderRadius: 13, border: 'none',
        background: value ? '#2563eb' : 'rgba(255,255,255,0.15)',
        position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: value ? 23 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

/** Native in-app confirmation dialog — Portal mounted directly to body for 100% accessibility */
function ConfirmDialog({ isOpen, title, body, confirmLabel, confirmDanger, onConfirm, onCancel, loading, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null
  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onCancel}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 420,
          background: 'linear-gradient(135deg, #0d1117, #161b27)',
          border: confirmDanger ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.12)',
          borderRadius: 22,
          padding: '24px 20px 20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
          animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-heading)' }}>{title}</h3>
        {body && <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{body}</p>}
        {children}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              background: confirmDanger ? '#ef4444' : '#2563eb',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Icons (inline SVGs, minimal) ──────────────────────────────────
const icons = {
  user:    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  lock:    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  logout:  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bell:    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  mail:    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  msg:     <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  eye:     <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  slash:   <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  shield:  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  info:    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  trash:   <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  pause:   <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  count:   <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  check:   <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  keyLock: <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  clock:   <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  archive: <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
}

// ═════════════════════════════════════════════════════════════════
export default function Settings() {
  const navigate = useNavigate()
  const { user, profile, logout, refreshProfile } = useAuth()

  // ── Preferences ────────────────────────────────────────────────
  const [prefs, setPrefs] = useState(() => ({
    notifShowCount:    true,
    notifPush:         true,
    notifEmail:        false,
    inboxReadReceipts: true,
    inboxRequests:     true,
    feedAnonymous:     false,
    ...loadPrefs(),
  }))

  const setPref = useCallback((key, val) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: val }
      savePrefs(next)
      return next
    })
  }, [])

  // ── Blocked users ──────────────────────────────────────────────
  const [blockedUsers,         setBlockedUsers]         = useState([])
  const [blockedLoading,       setBlockedLoading]       = useState(false)
  const [showBlockedList,      setShowBlockedList]      = useState(false)
  const [showBlockedMessages,  setShowBlockedMessages]  = useState(false)
  const [unblockingId,         setUnblockingId]         = useState(null)

  useEffect(() => {
    if (!user || (!showBlockedList && !showBlockedMessages)) return
    setBlockedLoading(true)
    getBlockedUsers()
      .then(setBlockedUsers)
      .finally(() => setBlockedLoading(false))
  }, [user, showBlockedList, showBlockedMessages])

  useEffect(() => {
    const onBlocksChanged = () => {
      if (user) {
        getBlockedUsers().then(setBlockedUsers).catch(() => {})
      }
    }
    window.addEventListener('user_blocks_changed', onBlocksChanged)
    return () => window.removeEventListener('user_blocks_changed', onBlocksChanged)
  }, [user])

  const handleUnblock = async (targetId) => {
    setUnblockingId(targetId)
    try {
      await unblockUser(targetId)
      setBlockedUsers(prev => prev.filter(u => u.id !== targetId))
      toast('User unblocked')
    } catch { /* silently ignore */ }
    finally { setUnblockingId(null) }
  }

  // ── Deleted posts ──────────────────────────────────────────────
  const [deletedPosts,      setDeletedPosts]      = useState([])
  const [showDeletedPosts,  setShowDeletedPosts]  = useState(false)
  const [deletedLoading,    setDeletedLoading]    = useState(false)

  useEffect(() => {
    if (!user || !showDeletedPosts) return
    setDeletedLoading(true)
    supabase
      .from('deleted_posts')
      .select('id, text_content, category, product_name, deleted_at')
      .eq('user_id', user.id)
      .order('deleted_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!error && data) setDeletedPosts(data)
      })
      .finally(() => setDeletedLoading(false))
  }, [user, showDeletedPosts])

  const getDaysLeft = (deletedAt) => {
    if (!deletedAt) return 30
    const deleted = new Date(deletedAt)
    const expiry  = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000)
    const diff    = Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  // ── Full Edit Profile (mirrors MyProfile) ──────────────────────
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  // ── Inbox PIN Change ───────────────────────────────────────────
  const [showPinChange,   setShowPinChange]   = useState(false)
  const [pinStep,         setPinStep]         = useState(1) // 1=old, 2=new, 3=confirm
  const [oldPin,          setOldPin]          = useState('')
  const [newPin,          setNewPin]          = useState('')
  const [confirmNewPin,   setConfirmNewPin]   = useState('')
  const [pinLoading,      setPinLoading]      = useState(false)
  const [pinError,        setPinError]        = useState('')

  const resetPinState = () => {
    setShowPinChange(false)
    setPinStep(1)
    setOldPin('')
    setNewPin('')
    setConfirmNewPin('')
    setPinLoading(false)
    setPinError('')
  }

  const handlePinChange = async () => {
    setPinError('')
    if (pinStep === 1) {
      if (oldPin.length !== 6) { setPinError('PIN must be 6 digits'); return }
      setPinLoading(true)
      try {
        const backup = await inboxCrypto.checkCloudBackup(user.id)
        if (backup && backup.hasBackup) {
          const success = await inboxCrypto.recoverE2EE(
            user.id,
            oldPin,
            backup.encryptedBlob,
            backup.iv,
            backup.salt
          )
          if (!success) {
            setPinError('Incorrect current PIN. Please enter your valid 6-digit PIN.')
            setPinLoading(false)
            return
          }
        }
        setPinStep(2)
      } catch (err) {
        console.error('PIN verification error:', err)
        setPinError('Incorrect current PIN or unable to verify. Try again.')
      } finally {
        setPinLoading(false)
      }
    } else if (pinStep === 2) {
      if (newPin.length !== 6) { setPinError('New PIN must be 6 digits'); return }
      setPinStep(3)
    } else if (pinStep === 3) {
      if (newPin !== confirmNewPin) { setPinError('PINs do not match'); setConfirmNewPin(''); return }
      setPinLoading(true)
      try {
        await inboxCrypto.setupE2EE(user.id, newPin)
        sendPinChangedNotification(user.id).catch(() => {})
        toast('Inbox PIN updated successfully', 'ShieldCheck', true)
        resetPinState()
      } catch (e) {
        setPinError('Failed to update PIN. Please try again.')
        setPinLoading(false)
      }
    }
  }

  // ── Dialogs ────────────────────────────────────────────────────
  const [logoutDialog,     setLogoutDialog]     = useState(false)
  const [deactivateDialog, setDeactivateDialog] = useState(false)
  const [deleteDialog,     setDeleteDialog]     = useState(false)
  const [deleteLoading,    setDeleteLoading]    = useState(false)
  const [deactivateLoading, setDeactivateLoading] = useState(false)

  const handleLogout = async () => {
    setLogoutDialog(false)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (e) {
      toast('Logout failed. Please try again.', 'AlertTriangle', false)
    }
  }

  const handleDeactivate = async () => {
    setDeactivateLoading(true)
    try {
      // 1. Flag the profile as deactivated — hides it from public views
      const { error } = await supabase
        .from('profiles')
        .update({
          is_deactivated: true,
          deactivated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      // 2. Sign out — next login auto-reactivates via AuthContext._loadProfile
      await logout()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('[Settings] Deactivation failed:', err)
      setDeactivateLoading(false)
      setDeactivateDialog(false)
      toast('Failed to deactivate. Please try again or contact support.', 'AlertTriangle', false)
    }
  }

  const handleDelete = async () => {
    if (!user?.id) return
    setDeleteLoading(true)
    try {
      // Permanently delete user from auth.users (cascades throughout the database)
      const { error: rpcErr } = await supabase.rpc('delete_own_account')
      if (rpcErr) throw rpcErr

      setDeleteLoading(false)
      setDeleteDialog(false)
      toast('Your account has been deleted.', 'Check', true)
      try {
        await logout()
      } catch (logoutErr) {
        console.warn('[Settings] logout after deletion:', logoutErr)
      }
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('[Settings] Account deletion failed:', err)
      setDeleteLoading(false)
      setDeleteDialog(false)
      toast('Failed to delete account. Please try again.', 'AlertTriangle', false)
    }
  }




  // ── Card style ─────────────────────────────────────────────────
  const card = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: '4px 16px',
    marginBottom: 12,
  }

  const { openOpinion } = useActions()

  // ── Full screen edit profile ────────────────────────────────────
  if (isEditingProfile) {
    return (
      <EditProfile
        currentProfile={profile || user || {}}
        onClose={() => setIsEditingProfile(false)}
        onSave={async () => {
          setIsEditingProfile(false)
          if (refreshProfile) await refreshProfile()
          toast('Profile updated!', 'Check', true)
        }}
      />
    )
  }

  return (
    <div className="settings-page-root" style={{ minHeight: '100%', background: '#020205', color: '#fff', fontFamily: 'var(--font-body)', overflowY: 'auto' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="header-glass sticky top-0 z-50 transition-transform duration-400 ease-out">
        <div className="w-full h-14 flex items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Settings</span>
        </div>
      </div>

      <div style={{ padding: '16px 16px 100px', maxWidth: 480, margin: '0 auto' }}>

        {/* ═══════════════════════════════════════════════════════
            PROFILE SNAPSHOT
        ═══════════════════════════════════════════════════════ */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18, padding: '16px', marginBottom: 20,
        }}>
          {/* Avatar — uses DEFAULT_AVATAR fallback */}
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)',
          }}>
            <img
              src={profile?.avatar_url || DEFAULT_AVATAR}
              alt="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.src = DEFAULT_AVATAR }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
              {profile?.full_name || 'Your Name'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              @{profile?.username || user?.email}
            </p>
            {profile?.bio && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.bio}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsEditingProfile(true)}
            style={{ background: 'rgba(47,139,255,0.12)', border: '1px solid rgba(47,139,255,0.25)', borderRadius: 12, padding: '8px 16px', color: '#2f8bff', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
          >
            Edit Profile
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 1 — ACCOUNT
        ═══════════════════════════════════════════════════════ */}
        <SectionHeader>Account</SectionHeader>
        <div style={card}>
          <SettingsRow
            icon={icons.lock}
            label="Change Password"
            sublabel="Update your login credentials"
            onClick={() => navigate('/change-password')}
          />
          <SettingsRow
            icon={icons.logout}
            label="Log Out"
            sublabel="Sign out of this device"
            onClick={() => setLogoutDialog(true)}
            borderTop
          />
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 2 — NOTIFICATIONS
        ═══════════════════════════════════════════════════════ */}
        <SectionHeader>Notifications</SectionHeader>
        <div style={card}>
          <SettingsRow
            icon={icons.count}
            label="Show Unread Count"
            sublabel="Badge in notification header"
            right={<Toggle value={prefs.notifShowCount} onChange={v => { setPref('notifShowCount', v); toast(v ? 'Badge enabled' : 'Badge disabled') }} />}
          />
          <SettingsRow
            icon={icons.bell}
            label="Push Notifications"
            sublabel="Real-time alerts"
            right={<Toggle value={prefs.notifPush} onChange={v => setPref('notifPush', v)} />}
            borderTop
          />
          <SettingsRow
            icon={icons.mail}
            label="Email Digest"
            sublabel="Weekly activity summary"
            right={<Toggle value={prefs.notifEmail} onChange={v => setPref('notifEmail', v)} />}
            borderTop
          />
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 3 — INBOX
        ═══════════════════════════════════════════════════════ */}
        <SectionHeader>Messages &amp; Inbox</SectionHeader>
        <div style={card}>
          <SettingsRow
            icon={icons.msg}
            label="Message Requests"
            sublabel="Allow non-followers to message you"
            right={<Toggle value={prefs.inboxRequests} onChange={v => setPref('inboxRequests', v)} />}
          />
          <SettingsRow
            icon={icons.check}
            label="Read Receipts"
            sublabel="Let others know when you've read their message"
            right={<Toggle value={prefs.inboxReadReceipts} onChange={v => setPref('inboxReadReceipts', v)} />}
            borderTop
          />
          <SettingsRow
            icon={icons.keyLock}
            label="Change Inbox PIN"
            sublabel="Update your E2EE encryption PIN"
            onClick={() => { setShowPinChange(true); setPinStep(1); setPinError('') }}
            borderTop
          />
          <SettingsRow
            icon={icons.slash}
            label="Blocked Messages"
            sublabel={blockedUsers.length > 0 ? `${blockedUsers.length} users blocked from messaging` : 'Manage users blocked from messaging'}
            onClick={() => setShowBlockedMessages(v => !v)}
            borderTop
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {blockedUsers.length > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>{blockedUsers.length}</span>}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showBlockedMessages ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
              </div>
            }
          />
          {showBlockedMessages && (
            <div style={{ paddingBottom: 8, paddingLeft: 16, paddingRight: 16 }}>
              {blockedLoading ? (
                <p style={{ padding: '12px 0', fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>Loading…</p>
              ) : blockedUsers.length === 0 ? (
                <p style={{ padding: '12px 0', fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>No blocked message users</p>
              ) : (
                blockedUsers.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden' }}>
                      <img src={u.avatar_url || DEFAULT_AVATAR} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = DEFAULT_AVATAR }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>{u.full_name || u.username}</p>
                      {u.username && <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>@{u.username}</p>}
                    </div>
                    <button
                      onClick={() => handleUnblock(u.id)}
                      disabled={unblockingId === u.id}
                      style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, padding: '6px 12px', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, opacity: unblockingId === u.id ? 0.5 : 1 }}
                    >
                      {unblockingId === u.id ? '…' : 'Unblock'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Inline PIN Change Panel */}
        {showPinChange && (
          <div style={{ ...card, padding: '16px', marginBottom: 12, border: '1px solid rgba(47,139,255,0.25)', background: 'rgba(47,139,255,0.05)' }}>
            {/* Warning alert */}
            <div style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 14 }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(245,158,11,0.9)', lineHeight: 1.5 }}>
                <strong>Warning:</strong> After changing or resetting your PIN, your encryption keys will be re-generated. Old messages will remain encrypted with the previous key and will be inaccessible forever.
              </p>
            </div>

            <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#fff' }}>
              {pinStep === 1 ? 'Enter Current PIN' : pinStep === 2 ? 'Enter New PIN' : 'Confirm New PIN'}
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              {pinStep === 1 ? 'Verify your identity first' : pinStep === 2 ? 'Choose a 6-digit PIN' : 'Re-enter your new PIN'}
            </p>

            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pinStep === 1 ? oldPin : pinStep === 2 ? newPin : confirmNewPin}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '')
                if (pinStep === 1) setOldPin(val)
                else if (pinStep === 2) setNewPin(val)
                else setConfirmNewPin(val)
                setPinError('')
              }}
              placeholder="••••••"
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${pinError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 12, padding: '13px 14px', color: '#fff', fontSize: 20,
                letterSpacing: '0.3em', outline: 'none', fontFamily: 'var(--font-body)',
                textAlign: 'center', marginBottom: pinError ? 6 : 14,
              }}
            />
            {pinError && <p style={{ margin: '0 0 12px', fontSize: 12, color: '#ef4444' }}>{pinError}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={resetPinState} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handlePinChange}
                disabled={pinLoading}
                style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 700, cursor: pinLoading ? 'not-allowed' : 'pointer', opacity: pinLoading ? 0.7 : 1 }}
              >
                {pinLoading ? 'Verifying…' : pinStep === 3 ? 'Update PIN' : 'Next'}
              </button>
            </div>

            {pinStep === 1 && (
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = window.appConfirm
                      ? await window.appConfirm(
                          'Warning: This will permanently delete your old chat history keys and start fresh. Old messages will be inaccessible forever. Continue?',
                          'Reset Keys?',
                          true
                        )
                      : confirm('Warning: This will permanently delete your old chat history keys and start fresh. Old messages will be inaccessible forever. Continue?')
                    if (ok) {
                      setPinStep(2)
                      setPinError('')
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2f8bff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    textDecoration: 'underline',
                  }}
                >
                  Forgot PIN? Reset Keys
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            SECTION 4 — PRIVACY
        ═══════════════════════════════════════════════════════ */}
        <SectionHeader>Privacy</SectionHeader>
        <div style={card}>
          <SettingsRow
            icon={icons.eye}
            label="Anonymous Mode"
            sublabel="Post opinions without showing your name"
            right={<Toggle value={prefs.feedAnonymous} onChange={v => setPref('feedAnonymous', v)} />}
          />
          <SettingsRow
            icon={icons.slash}
            label="Blocked Users"
            sublabel={blockedUsers.length > 0 ? `${blockedUsers.length} blocked` : 'Manage your block list'}
            onClick={() => setShowBlockedList(v => !v)}
            borderTop
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {blockedUsers.length > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>{blockedUsers.length}</span>}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showBlockedList ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                </svg>
              </div>
            }
          />
          {showBlockedList && (
            <div style={{ paddingBottom: 8 }}>
              {blockedLoading ? (
                <p style={{ padding: '12px 0', fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>Loading…</p>
              ) : blockedUsers.length === 0 ? (
                <p style={{ padding: '12px 0', fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>No blocked users</p>
              ) : (
                blockedUsers.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden' }}>
                      <img src={u.avatar_url || DEFAULT_AVATAR} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = DEFAULT_AVATAR }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>{u.full_name || u.username}</p>
                      {u.username && <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>@{u.username}</p>}
                    </div>
                    <button
                      onClick={() => handleUnblock(u.id)}
                      disabled={unblockingId === u.id}
                      style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, padding: '6px 12px', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, opacity: unblockingId === u.id ? 0.5 : 1 }}
                    >
                      {unblockingId === u.id ? '…' : 'Unblock'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 5 — DELETED POSTS
        ═══════════════════════════════════════════════════════ */}
        <SectionHeader>Content</SectionHeader>
        <div style={card}>
          <SettingsRow
            icon={icons.archive}
            label="Deleted Opinions"
            sublabel="Recently deleted posts (auto-purged after 30 days)"
            onClick={() => setShowDeletedPosts(v => !v)}
            right={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showDeletedPosts ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
              </svg>
            }
          />
          {showDeletedPosts && (
            <div style={{ paddingBottom: 12 }}>
              {/* Warning banner */}
              <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', marginBottom: 12 }}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(239,68,68,0.9)', lineHeight: 1.5 }}>
                  Deleted opinions will be completely deleted within <strong>30 days</strong>. If you want to repost it then it's on you, otherwise it will be completely deleted after 30 days.
                </p>
              </div>

              {deletedLoading ? (
                <p style={{ padding: '12px 0', fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>Loading…</p>
              ) : deletedPosts.length === 0 ? (
                <p style={{ padding: '12px 0', fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>No deleted opinions</p>
              ) : (
                deletedPosts.map(p => {
                  const daysLeft = getDaysLeft(p.deleted_at)
                  return (
                    <div key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {p.category && <span style={{ fontSize: 10, fontWeight: 700, color: '#2f8bff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p.category}</span>}
                          {p.product_name && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>/ {p.product_name}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (openOpinion) {
                              openOpinion({
                                text: p.text_content || '',
                                product: p.product_name || '',
                                category: p.category || ''
                              });
                              toast('Loaded into opinion composer', 'FileText', true);
                            }
                          }}
                          style={{
                            background: 'rgba(47,139,255,0.12)',
                            border: '1px solid rgba(47,139,255,0.25)',
                            borderRadius: 8,
                            padding: '3px 8px',
                            color: '#2f8bff',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Repost
                        </button>
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.text_content}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke={daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#f59e0b' : 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span style={{ fontSize: 11, color: daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#f59e0b' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                          {daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 6 — ABOUT & LEGAL
        ═══════════════════════════════════════════════════════ */}
        <SectionHeader>About</SectionHeader>
        <div style={card}>
          <SettingsRow icon={icons.info} label="About PlusOpinion" sublabel="Our mission and story" onClick={() => navigate('/about')} />
          <SettingsRow icon={icons.shield} label="Privacy Policy" onClick={() => navigate('/privacy-policy')} borderTop />
          <SettingsRow icon={icons.info} label="Terms &amp; Conditions" onClick={() => navigate('/t&c')} borderTop />
          <SettingsRow icon={icons.info} label="Cookie Policy" onClick={() => navigate('/cookies-policy')} borderTop />
          <SettingsRow icon={icons.msg} label="Help &amp; Support" sublabel="Contact us or read FAQs" onClick={() => navigate('/support')} borderTop />
          <div style={{ paddingTop: 12, paddingBottom: 8, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 2 }}>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
              PlusOpinion Beta — Version 1.0.0
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 7 — DANGER ZONE
        ═══════════════════════════════════════════════════════ */}
        <SectionHeader>Account Actions</SectionHeader>
        <div style={{ ...card, border: '1px solid rgba(239,68,68,0.15)' }}>
          <SettingsRow
            icon={icons.pause}
            label="Deactivate Account"
            sublabel="Temporarily disable your profile"
            onClick={() => setDeactivateDialog(true)}
            danger
          />
          <SettingsRow
            icon={icons.trash}
            label="Delete Account"
            sublabel="Permanently delete all your data"
            onClick={() => setDeleteDialog(true)}
            danger
            borderTop
          />
        </div>
      </div>

      {/* ── In-App Dialogs (no native browser popups) ─────────── */}
      <ConfirmDialog
        isOpen={logoutDialog}
        title="Log Out?"
        body="You'll need to sign in again to access your account."
        confirmLabel="Log Out"
        onConfirm={handleLogout}
        onCancel={() => setLogoutDialog(false)}
      />

      <ConfirmDialog
        isOpen={deactivateDialog}
        title="Deactivate Account?"
        confirmLabel={deactivateLoading ? 'Deactivating…' : 'Deactivate'}
        confirmDanger
        loading={deactivateLoading}
        onConfirm={handleDeactivate}
        onCancel={() => { if (!deactivateLoading) setDeactivateDialog(false) }}
      >
        <div style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', marginBottom: 4 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#fff', fontWeight: 600 }}>Your profile will be hidden from others.</p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>You can reactivate anytime by logging back in. Your data is preserved.</p>
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={deleteDialog}
        title="Delete Account Permanently?"
        confirmLabel={deleteLoading ? 'Deleting…' : 'Delete Permanently'}
        confirmDanger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => { if (!deleteLoading) setDeleteDialog(false) }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
          <div style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: '#ef4444', fontWeight: 700 }}>This cannot be undone.</p>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                Your account, opinions, profile, and all associated data will be permanently deleted from the platform. Logging back in with this email will start a completely fresh account.
              </p>
            </div>
          </div>
        </div>
      </ConfirmDialog>


      <style>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
