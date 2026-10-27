/**
 * ErrorBoundary.jsx — Global React error boundary
 *
 * Phase 2 §7: catches any unhandled React render errors.
 * Fallback: dark background (var(--bg-deep)), short message, Reload button.
 * Uses existing design tokens only — no new colours invented.
 *
 * Also exported as RouteErrorBoundary for use as route errorElement.
 */

import { Component } from 'react'
import { useRouteError, isRouteErrorResponse } from 'react-router-dom'

// ── Class boundary (for global wrap around <App>) ──────────────────
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback message={this.state.error?.message} />
    }
    return this.props.children
  }
}

// ── Route-level error element (for createBrowserRouter errorElement) ─
export function RouteErrorBoundary() {
  const error = useRouteError()

  let message = 'Something went wrong.'
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? 'Page not found.' : `Error ${error.status}`
  } else if (error instanceof Error) {
    message = error.message
  }

  return <ErrorFallback message={message} />
}

// ── Shared fallback UI ─────────────────────────────────────────────
function ErrorFallback({ message }) {
  return (
    <div
      style={{
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        height:          '100%',
        minHeight:       '100dvh',
        background:      'var(--bg-deep, #020205)',
        color:           'var(--text-primary, #fff)',
        fontFamily:      'var(--font-body, Inter, sans-serif)',
        padding:         '24px',
        textAlign:       'center',
        gap:             '16px',
      }}
    >
      <div style={{ fontSize: 40 }}>⚠️</div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Something went wrong</h2>
      {message && (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--muted, rgba(255,255,255,0.6))', maxWidth: 320 }}>
          {message}
        </p>
      )}
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop:    8,
          padding:      '12px 28px',
          background:   'var(--neon, #2f8bff)',
          color:        '#fff',
          border:       'none',
          borderRadius: '24px',
          fontSize:     15,
          fontWeight:   600,
          cursor:       'pointer',
        }}
      >
        Reload
      </button>
    </div>
  )
}
