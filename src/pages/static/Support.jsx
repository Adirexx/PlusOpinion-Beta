/**
 * Support.jsx — Ported from SUPPORT.HTML
 * Help & Support Center with full content from old MPA.
 */
import { useNavigate, Link } from 'react-router-dom'

export default function Support() {
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
          <h1>Help &amp; Support Center</h1>
          <p style={{
            fontSize: 18, color: '#94a3b8', lineHeight: 1.7,
            borderLeft: '2px solid rgba(59,130,246,0.3)', paddingLeft: 24,
          }}>
            This document outlines the official communication protocols and support architecture for the PlusOpinion
            ecosystem. We are committed to maintaining a high-trust environment through responsive and transparent
            user assistance.
          </p>
        </header>

        <div className="static-sections">
          {/* 01 — Support Responsibility Protocol */}
          <section className="static-section">
            <div className="numbered-heading">
              <span className="num">01</span>
              <h2>Support Responsibility Protocol</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14, color: '#94a3b8' }}>
              <p>
                PlusOpinion operates with a principle of absolute responsibility. We recognize that in a
                merit-based consumer intelligence platform, the integrity of our support systems is directly
                linked to the trust of our users.
              </p>
              <p>
                Our support protocol is designed to address technical discrepancies, payout verifications, and
                reputation (RQS) inquiries with mathematical fairness. Every support ticket is treated as a
                critical data point in our ecosystem's health.
              </p>
            </div>
          </section>

          <hr className="static-divider" />

          {/* 02 — Primary Communication Channels */}
          <section className="static-section">
            <div className="numbered-heading">
              <span className="num">02</span>
              <h2>Primary Communication Channels</h2>
            </div>
            <div className="static-grid cols-2">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  Official Email Support
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                  For all general inquiries, account assistance, RQS audits, and platform technical bug reports.
                </p>
                <a href="mailto:support@plusopinion.com" className="support-link">support@plusopinion.com</a>
              </div>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Direct WhatsApp Access
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                  Instant communication for verified partners and rapid assistance regarding payout transparency.
                </p>
                <a href="https://wa.me/918700591393" target="_blank" rel="noopener noreferrer" className="support-link green">+91 8700591393</a>
              </div>
            </div>
          </section>

          <hr className="static-divider" />

          {/* 03 — Emergency Escalation */}
          <section className="static-section">
            <div className="numbered-heading">
              <span className="num">03</span>
              <h2>Emergency Escalation Protocol</h2>
            </div>
            <div className="amber-box">
              <p style={{ fontSize: 14, color: '#cbd5e1' }}>
                If a critical issue remains unresolved through primary channels for over 48 hours, or in cases
                of significant partnership discrepancies, you may escalate directly to our leadership.
              </p>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 2 }}>
                  Escalation Point:
                </span>
                <a href="mailto:founder@plusopinion.com" style={{
                  color: '#fff', fontWeight: 700, textDecoration: 'none', transition: 'color 0.2s',
                }}>founder@plusopinion.com</a>
              </div>
            </div>
          </section>

          {/* 04 — Social Presence */}
          <section className="static-section">
            <div className="numbered-heading">
              <span className="num">04</span>
              <h2>Verified Social Presence</h2>
            </div>
            <div className="social-row">
              <a href="https://linkedin.com/in/adityakrguptaofficial" target="_blank" rel="noopener noreferrer">
                <span>LinkedIn Official</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a href="https://x.com/plusopinionnow" target="_blank" rel="noopener noreferrer">
                <span>X (Twitter) Updates</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a href="https://instagram.com/plusopinion" target="_blank" rel="noopener noreferrer">
                <span>Instagram Community</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </section>

          <hr className="static-divider" />

          {/* 05 — Response Times (NEW — industry standard) */}
          <section className="static-section">
            <div className="numbered-heading">
              <span className="num">05</span>
              <h2>Response Time Commitments</h2>
            </div>
            <p style={{ marginBottom: 24 }}>We aim to respond within the following timeframes based on issue severity:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div className="metric-card">
                <p className="label">General Inquiries</p>
                <p className="value" style={{ fontSize: 16 }}>24–48 hrs</p>
              </div>
              <div className="metric-card">
                <p className="label">Account / Security</p>
                <p className="value" style={{ fontSize: 16 }}>12–24 hrs</p>
              </div>
              <div className="metric-card">
                <p className="label">Payment Disputes</p>
                <p className="value" style={{ fontSize: 16 }}>4–12 hrs</p>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 16 }}>
              Response times are measured during business hours (Mon–Sat, 10:00 AM – 7:00 PM IST). Complex issues
              may require additional investigation time. You will receive an acknowledgement within 24 hours of submission.
            </p>
          </section>

          {/* 06 — FAQs (NEW — industry standard) */}
          <section className="static-section">
            <div className="numbered-heading">
              <span className="num">06</span>
              <h2>Frequently Asked Questions</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                ['How do I reset my password?', 'Visit the login page and click "Forgot Password." You will receive a password reset link via email. For security, links expire after 1 hour.'],
                ['How do I delete my account?', 'Navigate to MySpace → Settings → Delete Account. Your data will be archived per our compliance policy. For immediate assistance, email support@plusopinion.com.'],
                ['How is my RQS calculated?', 'Your Reputation Quality Score is derived from four pillars: Consistency, Verification Credibility, Community Impact, and Legacy History. You can view your score breakdown in MySpace.'],
                ['How do I report a bug or abusive content?', 'Use the in-app report feature available on every post, or email support@plusopinion.com with a description and screenshots.'],
                ['When do I get paid as a Partner?', 'Payouts are processed monthly for eligible Partners (RQS 75+, 500+ verified interactions). You can track your earnings in the Monetization tab.'],
              ].map(([q, a], i) => (
                <div key={i} className="mini-card" style={{ padding: '20px 24px', borderRadius: 16 }}>
                  <h4 style={{ fontSize: 15, marginBottom: 8 }}>{q}</h4>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="static-footer">
          <p>© 2026 PlusOpinion Technologies. All support interactions are logged for quality and audit purposes.</p>
          <div className="static-footer-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/t&c">Terms of Service</Link>
          </div>
        </footer>
      </main>
    </div>
  )
}
