/**
 * useMySpaceTarget.js — Determine which My Space tab to show
 *
 * Ported from checkMySpaceRedirect logic in the old pages.
 * MY SPACE FINAL (USER).HTML shows the user's personal dashboard.
 * MY SPACE FINAL(COMPANIES).HTML shows the company/partner dashboard.
 *
 * The old code checked window._partnerStatus or called getPartnerStatus()
 * to decide which tab to activate. We replicate that here.
 *
 * Returns: 'user' | 'company' | 'loading'
 */

import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getPartnerStatus } from '../lib/api/earnings.js'

export function useMySpaceTarget() {
  const { user, loading: authLoading } = useAuth()
  const [target, setTarget] = useState('loading')

  useEffect(() => {
    if (authLoading || !user) {
      setTarget(user ? 'loading' : 'user')
      return
    }

    let cancelled = false

    getPartnerStatus()
      .then(status => {
        if (cancelled) return
        const isApproved = (typeof status === 'string' ? status : status?.status) === 'approved'
        setTarget(isApproved ? 'company' : 'user')
      })
      .catch(() => {
        if (!cancelled) setTarget('user')
      })

    return () => { cancelled = true }
  }, [user, authLoading])

  return target
}
