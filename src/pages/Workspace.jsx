/**
 * Workspace.jsx — PHASE 1 STUB
 * Real content will be ported in Phase 6.
 */
export default function Workspace() {
  return (
    <div style={{
      padding:        '32px 16px',
      color:          'white',
      fontFamily:     'var(--font-body)',
      minHeight:      '100%',
      display:        'flex',
      flexDirection:  'column',
      gap:            12,
    }}>
      <h1 style={{
        fontFamily:  'var(--font-heading)',
        fontSize:    22,
        fontWeight:  600,
        color:       'var(--neon)',
        marginBottom: 4,
      }}>
        Workspace
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>
        Phase 1 scaffold — content coming in Phase 6.
      </p>
      <div style={{
        background:   'var(--card)',
        border:       '1px solid var(--glass-border)',
        borderRadius: 'var(--radius)',
        padding:      16,
        fontSize:     13,
        color:        'rgba(255,255,255,0.5)',
      }}>
        Switching between tabs does not reload this page.{' '}
        Check the Network tab in DevTools — you should see no new document requests.
      </div>
    </div>
  )
}
