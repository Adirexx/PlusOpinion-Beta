/**
 * AuthLayout.jsx — Layout for auth-only pages
 *
 * Login, ResetPassword, ChangePassword.
 * No bottom nav — just a centered content container.
 * Matches the old index.html body style.
 */

import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import OfflineBanner from '../components/common/OfflineBanner'

export default function AuthLayout() {
  useEffect(() => {
    document.documentElement.classList.add('auth-mode')
    document.body.classList.add('auth-mode')
    const root = document.getElementById('root')
    if (root) root.classList.add('auth-mode')

    return () => {
      document.documentElement.classList.remove('auth-mode')
      document.body.classList.remove('auth-mode')
      if (root) root.classList.remove('auth-mode')
    }
  }, [])

  return (
    <div
      className="auth-layout-frame"
      style={{
        display:         'flex',
        flexDirection:   'column',
        height:          '100%',
        minHeight:       '100vh',
        width:           '100%',
        overflow:        'hidden',
        backgroundColor: 'var(--bg-deep)',
        position:        'relative',
      }}
    >
      <OfflineBanner />
      <Outlet />
    </div>
  )
}

