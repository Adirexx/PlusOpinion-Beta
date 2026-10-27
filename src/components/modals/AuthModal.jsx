/**
 * AuthModal.jsx — Guest Authentication Modal
 *
 * Uses the exact same UI, components, and logic as Login.jsx:
 *   1. Signup Step 1: Details (Name, Email, Password + AliveEye, DOB)
 *   2. Signup Step 2: OTP Verification (6 digits, countdown, resend)
 *   3. Login: Email + Password + AliveEye + Google SSO
 *   4. Forgot Password
 *   5. Profile Completion / Onboarding Overlay (Avatar, Username check, Bio, Banner)
 *
 * When authenticated as guest, refreshes profile and closes modal cleanly.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import {
  signUpUser,
  signInUser,
  verifyEmailOtp,
  resendSignupOtp,
  resetPassword,
  autoAcceptTerms,
  checkUsernameAvailable,
  scanAndRenderGoogleButtons,
} from '../../lib/auth'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/env'
import '../../styles/login.css'

const PATH_OPEN   = 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'
const PATH_CLOSED = 'M1 12 Q12 15 23 12'

const MONTHS = [
  { v: '01', l: 'January' }, { v: '02', l: 'February' }, { v: '03', l: 'March' },
  { v: '04', l: 'April' }, { v: '05', l: 'May' }, { v: '06', l: 'June' },
  { v: '07', l: 'July' }, { v: '08', l: 'August' }, { v: '09', l: 'September' },
  { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' },
]

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
const CUR_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 96 }, (_, i) => CUR_YEAR - 5 - i)

// ══════════════════════════════════════════════════════════════════
//  ALIVE EYE COMPONENT
// ══════════════════════════════════════════════════════════════════
function AliveEye({ inputId, eyeId }) {
  const wrapRef = useRef(null)
  const pupilRef = useRef(null)
  const sparkRef = useRef(null)
  const shapeRef = useRef(null)
  const slashRef = useRef(null)
  const stateRef = useRef('roaming')
  const focusedRef = useRef(false)
  const isOpenRef = useRef(true)
  const idleTimer = useRef(null)
  const hoverTimer = useRef(null)

  const ALL_STATES = ['roaming', 'peeking', 'unbothered', 'hover', 'sleepy', 'closed']

  const setState = useCallback((state) => {
    const wrap = wrapRef.current
    if (!wrap) return
    ALL_STATES.forEach(s => wrap.classList.remove('eye-state-' + s))
    wrap.classList.add('eye-state-' + state)
    stateRef.current = state
  }, [])

  const movePupil = useCallback((relX, relY) => {
    const pupil = pupilRef.current
    const spark = sparkRef.current
    if (!pupil) return
    const cx = 12 + relX * 2.6
    const cy = 12 + relY * 1.5
    pupil.setAttribute('cx', cx.toFixed(2))
    pupil.setAttribute('cy', cy.toFixed(2))
    if (spark) {
      spark.setAttribute('cx', (cx - relX * 0.5 + 1.5).toFixed(2))
      spark.setAttribute('cy', (cy - relY * 0.3 - 1.2).toFixed(2))
    }
  }, [])

  const resetPupil = useCallback(() => movePupil(0, 0), [movePupil])
  const peekPupil = useCallback(() => movePupil(0.85, 0.65), [movePupil])
  const unbotheredPupil = useCallback(() => movePupil(-1, -0.35), [movePupil])

  const openEyeShape = useCallback(() => {
    if (shapeRef.current) shapeRef.current.setAttribute('d', PATH_OPEN)
    if (slashRef.current) slashRef.current.style.display = 'none'
    if (pupilRef.current) pupilRef.current.style.display = 'block'
    if (sparkRef.current) sparkRef.current.style.display = 'block'
  }, [])

  const closeEyeShape = useCallback(() => {
    if (shapeRef.current) shapeRef.current.setAttribute('d', PATH_CLOSED)
    if (pupilRef.current) pupilRef.current.style.display = 'none'
    if (sparkRef.current) sparkRef.current.style.display = 'none'
    resetPupil()
  }, [resetPupil])

  const scheduleIdle = useCallback(() => {
    clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      if (stateRef.current === 'roaming' || stateRef.current === 'unbothered') {
        setState('sleepy')
        resetPupil()
      }
    }, 15000)
  }, [setState, resetPupil])

  const handleToggle = useCallback(() => {
    const input = document.getElementById(inputId)
    if (!input) return
    if (input.type === 'password') {
      input.type = 'text'
      isOpenRef.current = true
      openEyeShape()
      setState(focusedRef.current ? 'peeking' : 'roaming')
      if (focusedRef.current) peekPupil(); else resetPupil()
    } else {
      input.type = 'password'
      isOpenRef.current = false
      closeEyeShape()
      setState('closed')
    }
  }, [inputId, openEyeShape, closeEyeShape, setState, peekPupil, resetPupil])

  useEffect(() => {
    openEyeShape()
    setState('roaming')
    resetPupil()
    scheduleIdle()

    const onMouseMove = (e) => {
      scheduleIdle()
      if (stateRef.current === 'closed') return
      if (stateRef.current === 'sleepy') setState('roaming')

      if (stateRef.current === 'roaming') {
        const wrap = wrapRef.current
        if (!wrap) return
        const rect = wrap.getBoundingClientRect()
        const eyeCX = rect.left + rect.width / 2
        const eyeCY = rect.top + rect.height / 2
        const relX = Math.max(-1, Math.min(1, (e.clientX - eyeCX) / (window.innerWidth * 0.45)))
        const relY = Math.max(-1, Math.min(1, (e.clientY - eyeCY) / (window.innerHeight * 0.45)))
        movePupil(relX, relY)
      }

      if (stateRef.current === 'peeking' && focusedRef.current) {
        const input = document.getElementById(inputId)
        if (input) {
          const r = input.getBoundingClientRect()
          const pad = 70
          const near = e.clientX >= r.left - pad && e.clientX <= r.right + pad &&
                       e.clientY >= r.top - pad && e.clientY <= r.bottom + pad
          if (!near) {
            setState('unbothered')
            unbotheredPupil()
          }
        }
      }

      if (stateRef.current === 'unbothered' && focusedRef.current) {
        const input = document.getElementById(inputId)
        if (input) {
          const r = input.getBoundingClientRect()
          const pad = 50
          const near = e.clientX >= r.left - pad && e.clientX <= r.right + pad &&
                       e.clientY >= r.top - pad && e.clientY <= r.bottom + pad
          if (near) {
            setState('peeking')
            peekPupil()
          }
        }
      }
    }

    const onMouseOver = (e) => {
      if (stateRef.current === 'closed') return
      const wrap = wrapRef.current
      if (wrap && (wrap === e.target || wrap.contains(e.target))) {
        setState('hover')
        movePupil(0, -0.5)
        clearTimeout(hoverTimer.current)
        hoverTimer.current = setTimeout(() => {
          if (stateRef.current === 'hover') {
            setState(focusedRef.current ? 'peeking' : 'roaming')
            if (focusedRef.current) peekPupil()
          }
        }, 900)
      }
    }

    const onFocusIn = (e) => {
      if (e.target && e.target.id === inputId) {
        if (stateRef.current === 'closed') return
        focusedRef.current = true
        setState('peeking')
        peekPupil()
      }
    }

    const onFocusOut = (e) => {
      if (e.target && e.target.id === inputId) {
        focusedRef.current = false
        if (stateRef.current === 'closed') return
        setState('roaming')
        resetPupil()
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      clearTimeout(idleTimer.current)
      clearTimeout(hoverTimer.current)
    }
  }, [inputId, setState, movePupil, resetPupil, peekPupil, unbotheredPupil, openEyeShape, scheduleIdle])

  return (
    <div
      ref={wrapRef}
      className="password-toggle eye-state-roaming"
      onClick={handleToggle}
      title="Toggle password visibility"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path ref={shapeRef} d={PATH_OPEN} fill="rgba(0,0,0,0.0)" />
        <path className="eye-lid" d="M1 12 Q12 4 23 12" fill="none" stroke="none" opacity="0" />
        <circle ref={pupilRef} className="eye-pupil" cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
        <circle ref={sparkRef} cx="13.5" cy="10.8" r="0.9" fill="white" stroke="none" opacity="0.8" />
        <line ref={slashRef} x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ display: 'none' }} />
      </svg>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  MAIN AUTH MODAL COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function AuthModal({ isOpen, onClose, isClosable = true }) {
  const { user, needsOnboarding, refreshProfile } = useAuth()

  // ── View state ──────────────────────────────────────────────────
  const [currentMode, setCurrentMode] = useState('signup') // 'signup' | 'login' | 'forgot'
  const [signupStep, setSignupStep] = useState(1) // 1 = details, 2 = OTP
  const [errorMsg, setErrorMsg] = useState('')
  const [signupEmailError, setSignupEmailError] = useState('')
  const [loginEmailError, setLoginEmailError] = useState('')

  // ── Signup form state ───────────────────────────────────────────
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [dobDay, setDobDay] = useState('')
  const [dobMonth, setDobMonth] = useState('')
  const [dobYear, setDobYear] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)

  // ── Login form state ────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // ── Forgot password state ───────────────────────────────────────
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  // ── OTP state ───────────────────────────────────────────────────
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const [otpStatus, setOtpStatus] = useState({ msg: '', type: '' })
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const otpCountdownRef = useRef(null)
  const [otpCountdown, setOtpCountdown] = useState(600)
  const [otpCanResend, setOtpCanResend] = useState(false)
  const otpInputRefs = useRef([])

  // ── Profile completion state ────────────────────────────────────
  const [showProfileOverlay, setShowProfileOverlay] = useState(false)
  const [pcUser, setPcUser] = useState(null)
  const [pcFullName, setPcFullName] = useState('')
  const [pcUsername, setPcUsername] = useState('')
  const [pcBio, setPcBio] = useState('')
  const [pcDob, setPcDob] = useState('')
  const [pcAvatarFile, setPcAvatarFile] = useState(null)
  const [pcAvatarPreview, setPcAvatarPreview] = useState(null)
  const [pcBannerFile, setPcBannerFile] = useState(null)
  const [pcBannerPreview, setPcBannerPreview] = useState(null)
  const [pcUsernameStatus, setPcUsernameStatus] = useState('')
  const [pcUsernameMsg, setPcUsernameMsg] = useState('Lowercase letters, numbers, and underscores only')
  const [pcError, setPcError] = useState('')
  const [pcSubmitText, setPcSubmitText] = useState('Complete Profile & Enter PlusOpinion →')
  const [pcSubmitting, setPcSubmitting] = useState(false)
  const pcUsernameTimer = useRef(null)

  // Close modal when user is signed in and profile is complete
  useEffect(() => {
    if (user && !needsOnboarding && !showProfileOverlay) {
      onClose?.()
    } else if (user && needsOnboarding && isOpen && !showProfileOverlay) {
      setPcUser(user)
      setPcFullName(user.user_metadata?.full_name || user.user_metadata?.name || '')
      setPcDob(user.user_metadata?.date_of_birth || '')
      setShowProfileOverlay(true)
    }
  }, [user, needsOnboarding, showProfileOverlay, isOpen, onClose])

  // Listen for Google SSO profile setup event
  useEffect(() => {
    const handler = (e) => {
      const u = e.detail?.user
      if (!u || !isOpen) return
      setPcUser(u)
      setPcFullName(u.user_metadata?.full_name || u.user_metadata?.name || '')
      setPcDob(u.user_metadata?.date_of_birth || '')
      setShowProfileOverlay(true)
    }
    window.addEventListener('auth:profileSetupRequired', handler)
    return () => window.removeEventListener('auth:profileSetupRequired', handler)
  }, [isOpen])

  // Scan and render Google SSO buttons when modal opens or mode changes
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      scanAndRenderGoogleButtons()
    }, 250)
    return () => clearTimeout(timer)
  }, [isOpen, currentMode])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen || !isClosable) return
    const handler = (e) => {
      if (e.key === 'Escape' && !showProfileOverlay) onClose?.()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, isClosable, showProfileOverlay, onClose])

  if (!isOpen) return null

  function toggleAuthMode() {
    setErrorMsg('')
    setSignupEmailError('')
    setLoginEmailError('')
    if (currentMode === 'signup') {
      setCurrentMode('login')
    } else {
      setCurrentMode('signup')
      setSignupStep(1)
    }
  }

  function showForgotView(e) {
    e?.preventDefault()
    setErrorMsg('')
    setCurrentMode('forgot')
    setForgotSent(false)
  }

  // ════════════════════════════════════════════════════════════════
  //  SIGNUP HANDLER
  // ════════════════════════════════════════════════════════════════
  async function handleSignupSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    setSignupEmailError('')

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    if (!fullName) { setErrorMsg('Please enter your name.'); return }
    if (!dobDay || !dobMonth || !dobYear) { setErrorMsg('Please select your complete date of birth.'); return }

    const dob = `${dobYear}-${dobMonth}-${dobDay}`
    if (signupPassword.length < 6) { setErrorMsg('Password must be at least 6 characters long!'); return }

    const birthDate = new Date(dob)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear() -
      (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0)
    if (age < 13) { setErrorMsg('You must be at least 13 years old to create an account.'); return }

    setSignupLoading(true)

    try {
      try {
        localStorage.setItem('plusopinion_cookie_consent', JSON.stringify({
          accepted: true, timestamp: new Date().toISOString(),
          version: '1.0', source: 'modal_signup'
        }))
      } catch {}

      const signupData = await signUpUser(signupEmail.trim(), signupPassword, fullName, dob)

      fetch('https://formspree.io/f/xkowzkjz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, email: signupEmail.trim(), dob, source: 'AuthModal Signup' })
      }).catch(() => {})

      if (!signupData.session) {
        setOtpEmail(signupEmail.trim())
        setSignupStep(2)
        setOtpValues(['', '', '', '', '', ''])
        startOtpCountdown(600)
        setTimeout(() => otpInputRefs.current[0]?.focus(), 300)
      } else {
        setPcUser(signupData.user)
        setPcFullName(fullName)
        setPcDob(dob)
        setShowProfileOverlay(true)
      }
    } catch (error) {
      console.error('[Modal Signup] Error:', error)
      if (error.status === 422 || error.message?.includes('registered') || error.message?.includes('duplicate')) {
        setSignupEmailError('This email is already registered. Please log in.')
      } else {
        setErrorMsg(error.message || 'Error creating account. Please try again.')
      }
    } finally {
      setSignupLoading(false)
    }
  }

  // ════════════════════════════════════════════════════════════════
  //  OTP LOGIC
  // ════════════════════════════════════════════════════════════════
  function startOtpCountdown(seconds) {
    clearInterval(otpCountdownRef.current)
    setOtpCountdown(seconds)
    setOtpCanResend(false)
    otpCountdownRef.current = setInterval(() => {
      setOtpCountdown(prev => {
        if (prev <= 1) {
          clearInterval(otpCountdownRef.current)
          setOtpCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function handleOtpChange(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newVals = [...otpValues]
    newVals[index] = digit
    setOtpValues(newVals)
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
    if (newVals.every(v => v) && newVals.join('').length === 6) {
      setTimeout(() => handleOtpSubmit(newVals.join('')), 100)
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault()
    const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '')
    const digits = text.split('').slice(0, 6)
    const newVals = [...otpValues]
    digits.forEach((ch, i) => { newVals[i] = ch })
    setOtpValues(newVals)
    const lastFilled = Math.min(digits.length, 5)
    otpInputRefs.current[lastFilled]?.focus()
    if (digits.length >= 6) {
      setTimeout(() => handleOtpSubmit(newVals.join('')), 100)
    }
  }

  async function handleOtpSubmit(code) {
    const otp = code || otpValues.join('')
    if (otp.length < 6) { setOtpStatus({ msg: 'Please enter all 6 digits.', type: 'error' }); return }

    const rateKey = 'po_otp_' + otpEmail
    let rateData = {}
    try { rateData = JSON.parse(localStorage.getItem(rateKey) || '{}') } catch {}
    if (rateData.lockedUntil && Date.now() < rateData.lockedUntil) {
      const mins = Math.ceil((rateData.lockedUntil - Date.now()) / 60000)
      setOtpStatus({ msg: `Too many attempts. Try again in ${mins} minute(s).`, type: 'warn' })
      return
    }

    setOtpVerifying(true)
    setOtpStatus({ msg: '', type: '' })

    try {
      const { session, user: otpUser } = await verifyEmailOtp(otpEmail, otp)
      try { localStorage.removeItem(rateKey) } catch {}

      setOtpStatus({ msg: 'Email verified! Setting up your profile...', type: 'success' })

      const verifiedUser = otpUser || session?.user
      setPcUser(verifiedUser)

      if (verifiedUser?.id) {
        autoAcceptTerms(verifiedUser.id).catch(e =>
          console.warn('[Modal OTP] autoAcceptTerms non-critical fail:', e)
        )
      }

      const dob = verifiedUser?.user_metadata?.date_of_birth || ''
      setPcDob(dob)
      setPcFullName(verifiedUser?.user_metadata?.full_name || verifiedUser?.user_metadata?.name || '')

      setShowProfileOverlay(true)
    } catch (err) {
      console.error('[Modal OTP] Verification failed:', err)
      rateData.count = (rateData.count || 0) + 1
      const attemptsLeft = Math.max(0, 5 - rateData.count)
      if (rateData.count >= 5) {
        rateData.lockedUntil = Date.now() + 3600000
        try { localStorage.setItem(rateKey, JSON.stringify(rateData)) } catch {}
        setOtpStatus({ msg: 'Maximum attempts reached. Please wait 1 hour before trying again.', type: 'warn' })
      } else {
        try { localStorage.setItem(rateKey, JSON.stringify(rateData)) } catch {}
        setOtpStatus({ msg: `Incorrect code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`, type: 'error' })
        setOtpValues(['', '', '', '', '', ''])
        otpInputRefs.current[0]?.focus()
      }
    } finally {
      setOtpVerifying(false)
    }
  }

  async function handleOtpResend() {
    try {
      await resendSignupOtp(otpEmail)
      try { localStorage.removeItem('po_otp_' + otpEmail) } catch {}
      setOtpValues(['', '', '', '', '', ''])
      setOtpStatus({ msg: 'A new code has been sent to your email.', type: 'success' })
      startOtpCountdown(600)
      setTimeout(() => otpInputRefs.current[0]?.focus(), 200)
    } catch (err) {
      console.error('[Modal OTP] Resend failed:', err)
      setOtpStatus({ msg: 'Failed to resend code. Please try again.', type: 'error' })
    }
  }

  // ════════════════════════════════════════════════════════════════
  //  LOGIN HANDLER
  // ════════════════════════════════════════════════════════════════
  async function handleLoginSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    setLoginEmailError('')
    setLoginLoading(true)

    try {
      const loggedInUser = await signInUser(loginEmail.trim(), loginPassword)
      if (loggedInUser.onboardingRequired) {
        const dob = loggedInUser.user_metadata?.date_of_birth || ''
        setPcUser(loggedInUser)
        setPcFullName(loggedInUser.user_metadata?.full_name || loggedInUser.user_metadata?.name || '')
        setPcDob(dob)
        setShowProfileOverlay(true)
      } else {
        await refreshProfile()
        onClose?.()
      }
    } catch (error) {
      const isAuthError = error.message?.toLowerCase().includes('invalid login credentials') ||
                          error.message?.toLowerCase().includes('user not found')
      if (isAuthError) {
        setLoginEmailError('Email not registered or incorrect password.')
      } else {
        setErrorMsg(error.message || 'Invalid email or password')
      }
    } finally {
      setLoginLoading(false)
    }
  }

  // ════════════════════════════════════════════════════════════════
  //  FORGOT PASSWORD HANDLER
  // ════════════════════════════════════════════════════════════════
  async function handleForgotSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    setForgotLoading(true)
    try {
      await resetPassword(forgotEmail.trim())
      setForgotSent(true)
    } catch (error) {
      setErrorMsg(error.message || 'Failed to send reset link. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  // ════════════════════════════════════════════════════════════════
  //  PROFILE COMPLETION HANDLERS
  // ════════════════════════════════════════════════════════════════
  function handlePcUsernameInput(val) {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setPcUsername(cleaned)
    clearTimeout(pcUsernameTimer.current)
    setPcUsernameStatus('')

    if (cleaned.length < 3) {
      setPcUsernameMsg('Lowercase letters, numbers, and underscores only')
      return
    }

    setPcUsernameMsg('Checking...')
    setPcUsernameStatus('checking')

    pcUsernameTimer.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(cleaned)
        setPcUsernameStatus(available ? 'available' : 'taken')
        setPcUsernameMsg(available ? '✓ Available' : '✗ Username already taken — try another')
      } catch {
        setPcUsernameStatus('')
        setPcUsernameMsg('')
      }
    }, 500)
  }

  function handlePcAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Please select an image file', icon: 'AlertTriangle', isSuccess: false } }))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Avatar must be under 2MB', icon: 'AlertTriangle', isSuccess: false } }))
      return
    }
    setPcAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPcAvatarPreview(reader.result)
    reader.readAsDataURL(file)
  }

  function handlePcBannerChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Please select an image file', icon: 'AlertTriangle', isSuccess: false } }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Banner must be under 5MB', icon: 'AlertTriangle', isSuccess: false } }))
      return
    }
    setPcBannerFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPcBannerPreview(reader.result)
    reader.readAsDataURL(file)
  }

  async function handleProfileComplete(e) {
    e.preventDefault()
    if (!pcUser) { setPcError('Session error. Please refresh and try again.'); return }

    setPcError('')
    if (!pcFullName.trim()) { setPcError('Please enter your full name.'); return }
    if (!pcUsername || pcUsername.length < 3) { setPcError('Username must be at least 3 characters.'); return }
    if (pcUsernameStatus === 'checking') { setPcError('Please wait while we check username availability.'); return }
    if (pcUsernameStatus === 'taken') { setPcError('That username is taken. Please choose another.'); return }

    if (pcUsernameStatus !== 'available') {
      try {
        const ok = await checkUsernameAvailable(pcUsername)
        if (!ok) { setPcError('That username is taken. Please choose another.'); return }
        setPcUsernameStatus('available')
      } catch { setPcError('Could not verify username. Please try again.'); return }
    }

    setPcSubmitting(true)
    setPcSubmitText('Setting up your account...')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (!accessToken) throw new Error('No active session. Please log in again.')

      let avatarUrl = null
      let bannerUrl = null

      if (pcAvatarFile) {
        setPcSubmitText('Uploading photo...')
        try {
          const ext = pcAvatarFile.name.split('.').pop().toLowerCase()
          const path = `${pcUser.id}/${Date.now()}.${ext}`
          const { error: avErr } = await supabase.storage.from('Avatars').upload(path, pcAvatarFile, { upsert: true })
          if (!avErr) {
            const { data: { publicUrl } } = supabase.storage.from('Avatars').getPublicUrl(path)
            avatarUrl = publicUrl
          }
        } catch {}
      }

      if (pcBannerFile) {
        setPcSubmitText('Uploading banner...')
        try {
          const ext = pcBannerFile.name.split('.').pop().toLowerCase()
          const path = `banners/${pcUser.id}/${Date.now()}.${ext}`
          const { error: bnErr } = await supabase.storage.from('profiles').upload(path, pcBannerFile, { upsert: true })
          if (!bnErr) {
            const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(path)
            bannerUrl = publicUrl
          }
        } catch {}
      }

      setPcSubmitText('Saving profile...')

      const updates = {
        username: pcUsername,
        full_name: pcFullName.trim(),
        bio: pcBio.trim() || null,
        profile_completed: true,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString()
      }
      if (avatarUrl) updates.avatar_url = avatarUrl
      if (bannerUrl) updates.banner_url = bannerUrl

      const patchRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${pcUser.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(updates)
        }
      )

      if (!patchRes.ok) {
        if (patchRes.status === 404 || patchRes.status === 400 || patchRes.status === 406) {
          const upsertRes = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${accessToken}`,
                'Prefer': 'resolution=merge-duplicates,return=minimal'
              },
              body: JSON.stringify({ id: pcUser.id, email: pcUser.email, ...updates })
            }
          )
          if (!upsertRes.ok) throw new Error(`Profile save failed (${patchRes.status}). Please try again.`)
        } else {
          throw new Error(`Profile save failed (${patchRes.status}). Please try again.`)
        }
      }

      setPcSubmitText('Welcome to PlusOpinion! 🎉')
      await refreshProfile()

      setTimeout(() => {
        setShowProfileOverlay(false)
        onClose?.()
      }, 700)

    } catch (err) {
      console.error('[Modal Profile] Submit error:', err)
      setPcError(err.message || 'Failed to save profile. Please try again.')
      setPcSubmitText('Complete Profile & Enter PlusOpinion →')
      setPcSubmitting(false)
    }
  }

  const swipeBtnText = currentMode === 'signup' ? 'Login' : 'Sign Up'
  const otpMinutes = String(Math.floor(otpCountdown / 60)).padStart(2, '0')
  const otpSeconds = String(otpCountdown % 60).padStart(2, '0')

  return (
    <div className="auth-modal-backdrop" onClick={() => isClosable && onClose?.()}>
      <div className="auth-modal-container" onClick={e => e.stopPropagation()}>

        {/* Top Bar: Cleanly hosts Cancel Tab & Swipe Tab without any overlap */}
        <div className="auth-modal-top-bar">
          {isClosable && (
            <button
              type="button"
              className="auth-modal-close-btn"
              onClick={onClose}
              aria-label="Cancel"
              title="Cancel"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>Cancel</span>
            </button>
          )}

          <button
            type="button"
            className="swipe-login-btn auth-modal-swipe-btn"
            onClick={toggleAuthMode}
          >
            <span>{swipeBtnText}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Auth Card */}
        <div className="login-auth-card" style={{ maxWidth: '100%' }}>

          {/* ── SIGNUP VIEW ────────────────────────────────── */}
          <div className={`login-form-view ${currentMode === 'signup' ? 'active' : ''}`}>
            <div className="login-auth-card-header">
              <div className="login-auth-card-title-group">
                <h2>Join today.</h2>
                <p>Create a free account to get started</p>
              </div>
            </div>

            <form onSubmit={handleSignupSubmit}>
              {/* Step 1: Details */}
              <div className={`login-form-view ${signupStep === 1 ? 'active' : ''}`}>
                {errorMsg && <div className="login-error-banner">{errorMsg}</div>}

                <div className="login-form-row">
                  <div className="login-form-group">
                    <input type="text" className="login-form-input" placeholder="First Name" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div className="login-form-group">
                    <input type="text" className="login-form-input" placeholder="Last Name" required value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                </div>

                <div className="login-form-group" style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="login-form-input"
                    placeholder="Email Address"
                    required
                    value={signupEmail}
                    onChange={e => { setSignupEmail(e.target.value); setSignupEmailError('') }}
                    style={signupEmailError ? { borderColor: '#ef4444', color: '#ef4444' } : {}}
                  />
                  {signupEmailError && (
                    <div className="login-inline-error">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{signupEmailError}</span>
                    </div>
                  )}
                </div>

                <div className="login-form-group" style={{ marginBottom: 8, position: 'relative' }}>
                  <input type="password" id="modalSignupPassword" className="login-form-input" placeholder="Password" required value={signupPassword} onChange={e => setSignupPassword(e.target.value)} style={{ paddingRight: 52 }} />
                  <AliveEye inputId="modalSignupPassword" eyeId="modal_signup" />
                </div>

                <div className="login-form-helper" style={{ marginBottom: 12 }}>Use 8 or more characters with a mix of letters, numbers &amp; symbols.</div>

                <div className="login-form-group">
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <select className={`login-form-input dob-select ${dobDay ? 'has-value' : ''}`} style={{ flex: 1, minWidth: 0 }} value={dobDay} onChange={e => setDobDay(e.target.value)} aria-label="Day">
                      <option value="" disabled>DD</option>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select className={`login-form-input dob-select ${dobMonth ? 'has-value' : ''}`} style={{ flex: 1.6, minWidth: 0 }} value={dobMonth} onChange={e => setDobMonth(e.target.value)} aria-label="Month">
                      <option value="" disabled>Month</option>
                      {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                    </select>
                    <select className={`login-form-input dob-select ${dobYear ? 'has-value' : ''}`} style={{ flex: 1.3, minWidth: 0 }} value={dobYear} onChange={e => setDobYear(e.target.value)} aria-label="Year">
                      <option value="" disabled>YYYY</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <button type="submit" className="login-btn-primary" disabled={signupLoading}>
                  {signupLoading ? 'Creating Account...' : 'Continue'}
                </button>

                <div className="login-form-helper" style={{ textAlign: 'center', marginTop: 10, marginBottom: 14 }}>
                  By clicking Continue, you agree to the PlusOpinion Terms of Service, Privacy Policy, and Cookies.
                </div>

                <div className="login-divider">or</div>

                <div className="google-sso-container" data-action="signup"></div>

                <div className="login-auth-switch-link">
                  Already a member? <button type="button" onClick={toggleAuthMode}>Log in</button>
                </div>
              </div>

              {/* Step 2: OTP Verification */}
              <div className={`login-form-view ${signupStep === 2 ? 'active' : ''}`}>
                <div className="login-auth-card-header" style={{ textAlign: 'center', marginBottom: 20, display: 'block' }}>
                  <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg,rgba(47,139,255,0.15),rgba(47,139,255,0.05))', border: '1px solid rgba(47,139,255,0.25)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F8BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  </div>
                  <h2 style={{ fontSize: 22, margin: '0 0 6px' }}>Check your inbox</h2>
                  <p style={{ color: '#888', fontSize: 13, margin: 0 }}>Enter the 6-digit code sent to<br /><strong style={{ color: '#fff', fontWeight: 600 }}>{otpEmail}</strong></p>
                </div>

                <div className="otp-container">
                  {otpValues.map((val, i) => (
                    <input
                      key={i}
                      ref={el => otpInputRefs.current[i] = el}
                      type="text"
                      className="otp-input"
                      inputMode="numeric"
                      maxLength="1"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      value={val}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      style={otpStatus.type === 'success' ? { borderColor: '#4ade80' } : {}}
                      disabled={otpStatus.type === 'success'}
                    />
                  ))}
                </div>

                {otpStatus.msg && (
                  <div style={{ minHeight: 20, marginBottom: 12, textAlign: 'center', fontSize: 13, color: otpStatus.type === 'success' ? '#4ade80' : otpStatus.type === 'warn' ? '#fbbf24' : '#f87171' }}>
                    {otpStatus.msg}
                  </div>
                )}

                <button type="button" className="login-btn-primary" onClick={() => handleOtpSubmit()} disabled={otpVerifying || otpStatus.type === 'success'}>
                  {otpVerifying ? 'Verifying...' : 'Verify Email'}
                </button>

                <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#888' }}>
                  {!otpCanResend ? (
                    <span>Resend code in <strong>{otpMinutes}:{otpSeconds}</strong></span>
                  ) : (
                    <button type="button" onClick={handleOtpResend} style={{ color: '#2F8BFF', fontWeight: 600, textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}>Resend Code</button>
                  )}
                </div>

                <div className="login-auth-switch-link" style={{ marginTop: 10 }}>
                  Wrong email? <button type="button" onClick={() => setSignupStep(1)}>Go back</button>
                </div>
              </div>
            </form>
          </div>

          {/* ── LOGIN VIEW ─────────────────────────────────── */}
          <div className={`login-form-view ${currentMode === 'login' ? 'active' : ''}`}>
            <div className="login-auth-card-header">
              <div className="login-auth-card-title-group">
                <h2>Welcome back.</h2>
                <p>Log in to access your dashboard</p>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit}>
              <div className="google-sso-container" data-action="signin"></div>

              <div className="login-divider">or use email</div>

              {errorMsg && currentMode === 'login' && <div className="login-error-banner">{errorMsg}</div>}

              <div className="login-form-group" style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="login-form-input"
                  placeholder="Email Address"
                  required
                  value={loginEmail}
                  onChange={e => { setLoginEmail(e.target.value); setLoginEmailError('') }}
                  style={loginEmailError ? { borderColor: '#ef4444', color: '#ef4444' } : {}}
                />
                {loginEmailError && (
                  <div className="login-inline-error">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{loginEmailError}</span>
                  </div>
                )}
              </div>

              <div className="login-form-group" style={{ position: 'relative' }}>
                <input type="password" id="modalLoginPassword" className="login-form-input" placeholder="Password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={{ paddingRight: 52 }} />
                <AliveEye inputId="modalLoginPassword" eyeId="modal_login" />
              </div>

              <div style={{ textAlign: 'right', marginBottom: 24, marginTop: -8 }}>
                <button type="button" onClick={showForgotView} style={{ color: '#2F8BFF', fontSize: 13, textDecoration: 'none', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Forgot password?</button>
              </div>

              <button type="submit" className="login-btn-primary" disabled={loginLoading}>
                {loginLoading ? 'Logging in...' : 'Log in'}
              </button>

              <div className="login-auth-switch-link">
                Don't have an account? <button type="button" onClick={toggleAuthMode}>Sign up</button>
              </div>
            </form>
          </div>

          {/* ── FORGOT PASSWORD VIEW ───────────────────────── */}
          <div className={`login-form-view ${currentMode === 'forgot' ? 'active' : ''}`}>
            <div className="login-auth-card-header">
              <div className="login-auth-card-title-group">
                <h2>Reset Password</h2>
                <p>We'll send you a magic link</p>
              </div>
            </div>

            {!forgotSent ? (
              <form onSubmit={handleForgotSubmit}>
                {errorMsg && currentMode === 'forgot' && <div className="login-error-banner">{errorMsg}</div>}
                <div className="login-form-group">
                  <input type="email" className="login-form-input" placeholder="Email Address" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                </div>
                <button type="submit" className="login-btn-primary" style={{ marginTop: 24 }} disabled={forgotLoading}>
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <div className="login-auth-switch-link" style={{ marginTop: 16 }}>
                  Remembered your password? <button type="button" onClick={toggleAuthMode}>Log in</button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <h3 style={{ color: '#4ade80', marginBottom: 12, fontWeight: 'bold', fontSize: 20 }}>Email Sent ✓</h3>
                <p style={{ color: '#888', fontSize: 14, lineHeight: 1.5 }}>Check your inbox for the password reset link. It may take a minute to arrive.</p>
                <button type="button" onClick={toggleAuthMode} className="login-btn-primary" style={{ marginTop: 24 }}>Back to Login</button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ══════════════════════════════════════════════════════
          PROFILE COMPLETION OVERLAY
          ══════════════════════════════════════════════════════ */}
      {showProfileOverlay && (
        <div className={`pc-overlay ${showProfileOverlay ? 'pc-visible' : ''}`}>
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 80% 60% at 60% 0%, rgba(47,139,255,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 0% 100%, rgba(0,200,100,0.06) 0%, transparent 60%)' }} />

          <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '40px 20px 60px' }}>

            {/* Top brand bar */}
            <div style={{ width: '100%', maxWidth: 560, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: '#fff' }}>PlusOpinion</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.12)', padding: '2px 8px', borderRadius: 4, fontFamily: "'Inter', sans-serif" }}>BETA</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                <span style={{ color: '#2F8BFF', fontSize: 13, fontWeight: 700 }}>Step 3 of 3</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                <span>Profile Setup</span>
              </div>
            </div>

            {/* Main card */}
            <div className="pc-card">
              <div style={{ marginBottom: 36 }}>
                <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: -0.8, margin: '0 0 8px', color: '#fff' }}>Complete your profile</h1>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>Add a photo and choose your username. You can always edit these later.</p>
              </div>

              <form onSubmit={handleProfileComplete}>
                {/* Avatar Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: `2px solid ${pcAvatarPreview ? '#2F8BFF' : 'rgba(255,255,255,0.1)'}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, transition: 'border-color 0.3s' }}>
                      {pcAvatarPreview ? (
                        <img src={pcAvatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <label htmlFor="modalPcAvatarInput" style={{ position: 'absolute', inset: 0, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                    <input type="file" id="modalPcAvatarInput" accept="image/*" style={{ display: 'none' }} onChange={handlePcAvatarChange} />
                  </div>
                  <div>
                    <label htmlFor="modalPcAvatarInput" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#2F8BFF', marginBottom: 4 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      Upload profile photo
                    </label>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>JPG, PNG or GIF · Max 2MB</p>
                  </div>
                </div>

                {/* Full Name */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8, letterSpacing: '0.02em' }}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" className="pc-form-input" placeholder="Your full name" required value={pcFullName} onChange={e => setPcFullName(e.target.value)} />
                </div>

                {/* DOB display */}
                {pcDob && (
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8, letterSpacing: '0.02em' }}>Date of Birth</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 16px' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                        {(() => { try { const d = new Date(pcDob + 'T00:00:00'); return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) } catch { return pcDob } })()}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>From signup</span>
                    </div>
                  </div>
                )}

                {/* Username */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8, letterSpacing: '0.02em' }}>Username <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 500, pointerEvents: 'none' }}>@</span>
                    <input type="text" className="pc-form-input" placeholder="yourname" required minLength="3" maxLength="30" value={pcUsername} onChange={e => handlePcUsernameInput(e.target.value)} style={{ paddingLeft: 30 }} />
                    {pcUsernameStatus === 'available' && (
                      <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                      </div>
                    )}
                    {pcUsernameStatus === 'taken' && (
                      <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 12, marginTop: 5, color: pcUsernameStatus === 'available' ? '#4ade80' : pcUsernameStatus === 'taken' ? '#f87171' : 'rgba(255,255,255,0.35)' }}>
                    {pcUsernameMsg}
                  </p>
                </div>

                {/* Bio */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8, letterSpacing: '0.02em' }}>Bio <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(optional)</span></label>
                  <textarea className="pc-form-input" placeholder="Tell the world about yourself..." rows="3" maxLength="200" value={pcBio} onChange={e => setPcBio(e.target.value)} />
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: 'right' }}>{pcBio.length}/200</p>
                </div>

                {/* Banner Upload */}
                <div style={{ marginBottom: 32 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8, letterSpacing: '0.02em' }}>Profile Banner <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(optional)</span></label>
                  <label htmlFor="modalPcBannerInput" style={{ display: 'block', cursor: 'pointer', border: '1.5px dashed rgba(255,255,255,0.12)', borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.25s', background: 'rgba(255,255,255,0.02)' }}>
                    {pcBannerPreview ? (
                      <img src={pcBannerPreview} alt="Banner" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Click to upload banner</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>PNG, JPG · Max 5MB · 1500×500 recommended</span>
                      </div>
                    )}
                  </label>
                  <input type="file" id="modalPcBannerInput" accept="image/*" style={{ display: 'none' }} onChange={handlePcBannerChange} />
                </div>

                {/* Error message */}
                {pcError && (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                    {pcError}
                  </div>
                )}

                {/* Submit button */}
                <button type="submit" className="login-btn-primary" style={{ fontSize: 16, padding: 15 }} disabled={pcSubmitting}>
                  {pcSubmitText}
                </button>

                <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 14, lineHeight: 1.5 }}>
                  You can always update your profile later in settings.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
