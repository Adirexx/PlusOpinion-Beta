/**
 * Cookies.jsx — Ported from COOKIES.HTML
 * Full cookie policy with enhanced industry-standard legal content.
 * Compliant with: GDPR, ePrivacy Directive, CCPA.
 */
import { useNavigate } from 'react-router-dom'

export default function Cookies() {
  const navigate = useNavigate()
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/feed'))

  return (
    <div className="static-page">
      <header className="static-header">
        <div className="static-header-brand">
          <span className="static-header-brand-name">PlusOpinion</span>
          <span className="static-header-badge">Beta</span>
        </div>
        <button className="static-header-back" onClick={goBack}>Back</button>
      </header>

      <main className="static-main">
        <header className="static-page-header">
          <h1>Cookie Policy</h1>
          <p className="static-meta">Effective Date: March 1, 2026. Last Updated: March 1, 2026.</p>
        </header>

        <div className="static-sections">
          {/* 1 — Commitment */}
          <section className="static-section">
            <h2>1. Our Commitment: Transparency First</h2>
            <div className="highlight-box">
              <p>
                At PlusOpinion, we believe in clarity. We only use cookies that are{' '}
                <span className="accent">essential for functionality, security, and anonymized performance
                tracking.</span> We do not use third-party marketing or cross-site advertising trackers.
              </p>
            </div>
            <p>
              This Cookie Policy explains what cookies are, how we use them, and your choices regarding these
              technologies. We maintain full compliance with GDPR, CCPA, and the ePrivacy Directive.
            </p>
          </section>

          {/* 2 — What Are Cookies */}
          <section className="static-section">
            <h2>2. What Are Cookies?</h2>
            <p style={{ fontSize: 14 }}>
              Cookies are small text files stored on your device (computer, tablet, or mobile) when you visit a
              website. They help the website function properly, enhance security, and provide an improved user
              experience by remembering your preferences.
            </p>
          </section>

          {/* 3 — Types */}
          <section className="static-section">
            <h2>3. Types of Cookies We Use</h2>
            <p style={{ marginBottom: 32 }}>
              We categorize our cookies into two strict types. You have full control over non-essential cookies:
            </p>

            {/* Strictly Necessary */}
            <div className="blue-box" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, background: 'rgba(59,130,246,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa',
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h4 style={{ fontSize: 18, color: '#fff', fontWeight: 700, margin: 0 }}>Strictly Necessary Cookies</h4>
              </div>
              <p style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 16 }}>
                These cookies are vital for the platform to function securely. They cannot be disabled in
                our systems. They manage your authenticated sessions, security protocols, and your consent choices.
              </p>
              <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2 }}>Used For</span>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
                  Authentication, CSRF protection, and Consent management (<code style={{ color: '#60a5fa' }}>plusopinion_cookie_consent</code>).
                </p>
              </div>
            </div>

            <div className="static-grid cols-2">
              <div className="mini-card" style={{ padding: 24 }}>
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Analytics Cookies</h4>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>
                  Optional cookies (Google Analytics) used strictly to understand platform traffic and feature usage securely.
                </p>
                <div style={{ marginTop: 12, fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                  Cookie: _ga, _ga_D42E61TP4M
                </div>
              </div>
              <div className="mini-card" style={{ padding: 24 }}>
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Privacy Flags</h4>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>
                  All Analytics rely on anonymized IP protocols and utilize SameSite=None + Secure Flags for
                  maximum data protection.
                </p>
              </div>
            </div>
          </section>

          {/* 4 — Your Control */}
          <section className="static-section">
            <h2>4. Your Control and Consent</h2>
            <p>
              Upon your first visit, a banner will prompt you to accept or decline analytics cookies. You have
              full authority to change your preferences.
            </p>
            <div className="amber-box" style={{ marginTop: 16 }}>
              <h4>Browser Configuration</h4>
              <p>
                In addition to our on-site consent manager, you can configure your browser to reject all cookies
                or alert you when a cookie is placed. Please note that disabling "Strictly Necessary" cookies
                via browser settings may prevent login and access to the verified platform features.
              </p>
            </div>
          </section>

          {/* 5 — Cookie Inventory Table (NEW — industry standard) */}
          <section className="static-section">
            <h2>5. Detailed Cookie Inventory</h2>
            <p style={{ marginBottom: 24 }}>The following table provides a comprehensive list of all cookies used on PlusOpinion:</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%', borderCollapse: 'collapse', fontSize: 13,
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
              }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Cookie Name</th>
                    <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Type</th>
                    <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Duration</th>
                    <th style={{ padding: '12px 16px', color: '#fff', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['sb-*-auth-token', 'Necessary', 'Session', 'Supabase authentication session token'],
                    ['plusopinion_cookie_consent', 'Necessary', '1 Year', 'Records your cookie consent preference'],
                    ['_ga', 'Analytics', '2 Years', 'Google Analytics — distinguishes unique users'],
                    ['_ga_D42E61TP4M', 'Analytics', '2 Years', 'Google Analytics — maintains session state'],
                    ['_gid', 'Analytics', '24 Hours', 'Google Analytics — distinguishes users (short-term)'],
                  ].map(([name, type, dur, purpose], i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#60a5fa', fontSize: 12 }}>{name}</td>
                      <td style={{ padding: '10px 16px', color: type === 'Necessary' ? '#4ade80' : '#fbbf24' }}>{type}</td>
                      <td style={{ padding: '10px 16px', color: '#94a3b8' }}>{dur}</td>
                      <td style={{ padding: '10px 16px', color: '#94a3b8' }}>{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 6 — Similar Technologies (NEW — industry standard) */}
          <section className="static-section">
            <h2>6. Similar Technologies</h2>
            <p>
              In addition to cookies, PlusOpinion may use the following similar technologies:
            </p>
            <ul>
              <li><span className="white">Local Storage:</span> Used to store non-sensitive user preferences (theme, last-read notification ID) locally on your device. This data is never transmitted to our servers.</li>
              <li><span className="white">Session Storage:</span> Used for temporary data during your active session, such as draft opinion content. This data is automatically cleared when you close your browser tab.</li>
              <li><span className="white">Web Beacons:</span> We do not use web beacons or tracking pixels for advertising. Google Analytics may use minimal pixel-based tracking, governed by Google's Privacy Policy.</li>
            </ul>
          </section>

          {/* 7 — Do Not Track (NEW — industry standard) */}
          <section className="static-section">
            <h2>7. Do Not Track (DNT) Signals</h2>
            <p>
              PlusOpinion respects the Do Not Track (DNT) browser signal. When we detect a DNT signal from your
              browser, we disable all optional analytics cookies and refrain from loading third-party tracking
              scripts. Strictly necessary cookies required for authentication and security will continue to
              function regardless of DNT status.
            </p>
          </section>

          {/* 8 — Changes (NEW — industry standard) */}
          <section className="static-section">
            <h2>8. Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy periodically. When we make changes, we will update the
              "Last Updated" date at the top of this page and, where required, re-prompt consent for any newly
              introduced cookie categories. We recommend reviewing this policy each time you visit the Platform.
            </p>
          </section>

          {/* 9 — Contact */}
          <section className="static-section">
            <h2>9. Contact Us</h2>
            <p>
              If you have any questions about our use of cookies, please contact us at{' '}
              <a href="mailto:support@plusopinion.com">support@plusopinion.com</a>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="static-footer">
          <p>© 2026 PlusOpinion Technologies. All rights reserved.</p>
          <p className="sub">
            For privacy-related inquiries, contact{' '}
            <a href="mailto:support@plusopinion.com">support@plusopinion.com</a>
          </p>
        </footer>
      </main>
    </div>
  )
}
