/**
 * Privacy.jsx — Ported from PRIVACY_POLICY.HTML
 * Full privacy policy with enhanced industry-standard legal content.
 * Compliant with: GDPR, CCPA/CPRA, India DPDP Act 2023, IT Act 2000.
 */
import { useNavigate, Link } from 'react-router-dom'

export default function Privacy() {
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
          <h1>Privacy Policy</h1>
          <p className="static-meta">Effective Date: February 11, 2026. Last Updated: February 11, 2026.</p>
        </header>

        <div className="static-sections">
          {/* 1 — Zero Data Sale */}
          <section className="static-section">
            <h2>1. Our Commitment: Zero Data Sale</h2>
            <div className="highlight-box">
              <p>
                PlusOpinion is built on trust. We operate with a fundamental principle:{' '}
                <span className="accent">Your data is not a product.</span> We do not, and will never, sell
                your personal information, browsing history, or opinion data to third-party data brokers or
                marketing agencies.
              </p>
            </div>
            <p>
              This Privacy Policy explains how we collect, use, and strictly protect your information when you
              interact with the PlusOpinion platform. We prioritize security and transparency in every line of
              code we write.
            </p>
          </section>

          {/* 2 — Information We Collect */}
          <section className="static-section">
            <h2>2. Information We Collect</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h3>A. Personal Identification</h3>
                <p style={{ fontSize: 14 }}>
                  During onboarding, we collect your full name, email address, chosen username, and profile bio.
                  If you apply for the Partner Program, we collect government-issued ID details and bank account
                  information exclusively for identity verification and payout purposes.
                </p>
              </div>
              <div>
                <h3>B. Opinion &amp; Verification Data</h3>
                <p style={{ fontSize: 14 }}>
                  We store the text of your opinions, images, and any proofs of purchase (receipts/invoices) you
                  provide for verification. Purchase proofs are used solely to validate the authenticity of your
                  experience and are never shared publicly.
                </p>
              </div>
              <div>
                <h3>C. Technical &amp; Usage Metrics</h3>
                <p style={{ fontSize: 14 }}>
                  To maintain our RQS™ (Reputation Quality Score) and prevent system gaming, we collect metadata
                  including IP addresses, device identifiers, and platform interaction logs (likes, agrees,
                  comments, and streaks).
                </p>
              </div>
              <div>
                <h3>D. Automatically Collected Information</h3>
                <p style={{ fontSize: 14 }}>
                  When you access PlusOpinion, we automatically collect certain technical data: browser type and version,
                  operating system, referring URLs, pages visited and time spent, device type, screen resolution, and
                  approximate geolocation (city/country level only, derived from IP address). This data is used
                  exclusively for analytics, security monitoring, and platform optimization.
                </p>
              </div>
            </div>
          </section>

          {/* 3 — How We Use Your Data */}
          <section className="static-section">
            <h2>3. How We Use Your Data</h2>
            <p style={{ marginBottom: 32 }}>
              Your data is utilized strictly for platform functionality, security, and the integrity of the ecosystem:
            </p>

            {/* Conditional Collection */}
            <div className="blue-box" style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 18, color: '#fff', marginBottom: 16 }}>Conditional Collection &amp; Data Minimization</h4>
              <p style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 16 }}>
                To ensure maximal privacy, <strong style={{ color: '#fff' }}>PlusOpinion does NOT collect government-issued
                IDs or bank details during initial onboarding.</strong> Document collection is triggered{' '}
                <em style={{ color: '#60a5fa' }}>ONLY</em> upon meeting the{' '}
                <Link to="/t&c">Partner Program</Link> eligibility thresholds.
              </p>
              <div style={{ display: 'flex', gap: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2 }}>Threshold Required</span>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>75+ RQS and 500+ Verified Interactions.</p>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(245,158,11,0.8)', textTransform: 'uppercase', letterSpacing: 2 }}>Security Warning</span>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
                    Report any premature ID requests to{' '}
                    <a href="mailto:support@plusopinion.com">support@plusopinion.com</a>.
                  </p>
                </div>
              </div>
            </div>

            <div className="static-grid cols-2">
              <div className="mini-card" style={{ padding: 24 }}>
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>RQS™ Calculation</h4>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>Processing interaction quality and streaks to maintain your reputation score.</p>
              </div>
              <div className="mini-card" style={{ padding: 24 }}>
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Monetization Audits</h4>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>Verifying eligibility and processing payouts through encrypted financial logs.</p>
              </div>
              <div className="mini-card" style={{ padding: 24 }}>
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Platform Integrity</h4>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>Detecting fraud and manipulation to ensure a fair ecosystem for all participants.</p>
              </div>
              <div className="mini-card" style={{ padding: 24 }}>
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Smart Communications</h4>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>Delivering interaction alerts and critical account security updates via encrypted channels.</p>
              </div>
            </div>

            <div className="label-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="label-tag">Standard Data:</span>
                <span className="label-val">Email, Username, Display Name</span>
              </div>
              <span className="badge">Collected at Onboarding</span>
            </div>
          </section>

          {/* 4 — Data Retention */}
          <section className="static-section">
            <h2>4. Data Retention &amp; Compliance Archiving</h2>
            <p>
              We adhere to strict data retention policies to balance user privacy with platform accountability:
            </p>
            <div className="amber-box" style={{ marginTop: 16 }}>
              <h4>The Compliance Archive</h4>
              <p>
                When you delete an opinion or your account, certain data is moved to our secondary "Compliance Archive."
                This is required to prevent "Review-and-Delete" gaming, assist in legal investigations (such as
                defamation claims), and maintain the integrity of our verified history. This archived data is
                inaccessible to other users and is protected by encrypted access controls.
              </p>
            </div>
          </section>

          {/* 5 — Security */}
          <section className="static-section">
            <h2>5. Enterprise-Grade Security</h2>
            <p>PlusOpinion employs multiple layers of security to safeguard your information:</p>
            <ul>
              <li><span className="white">Row Level Security (RLS):</span> Strict database-level policies ensuring users can only access their authorized data.</li>
              <li><span className="white">End-to-End Encryption:</span> All sensitive documents and identification proofs are encrypted at rest and in transit.</li>
              <li><span className="white">JWT Authentication:</span> Secure, time-limited session management for all account actions.</li>
              <li><span className="white">Continuous Auditing:</span> Automated security monitoring to detect and block suspicious access patterns.</li>
              <li><span className="white">TLS 1.3:</span> All data transmitted between your device and our servers is protected with industry-standard TLS 1.3 encryption.</li>
            </ul>
          </section>

          {/* 6 — Privacy Rights */}
          <section className="static-section">
            <h2>6. Your Privacy Rights</h2>
            <p style={{ marginBottom: 24 }}>
              We empower you with full control over your digital footprint:
            </p>
            <div className="static-grid cols-3">
              <div className="rights-card">
                <div className="icon-circle">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h4>Right to Access</h4>
                <p>View all data we hold about your account.</p>
              </div>
              <div className="rights-card">
                <div className="icon-circle">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h4>Right to Rectify</h4>
                <p>Update or correct your personal profile info.</p>
              </div>
              <div className="rights-card">
                <div className="icon-circle">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h4>Right to Erasure</h4>
                <p>Request account deletion (subject to archiving laws).</p>
              </div>
            </div>
          </section>

          {/* 7 — Third-Party Sharing (NEW — industry standard) */}
          <section className="static-section">
            <h2>7. Third-Party Data Sharing</h2>
            <p>
              We do not sell your personal data. We may share limited information with trusted third parties only
              in the following circumstances:
            </p>
            <ul>
              <li><span className="white">Service Providers:</span> Cloud hosting (Supabase / AWS), payment processors, and analytics providers who operate under strict data processing agreements.</li>
              <li><span className="white">Legal Obligations:</span> When required by law, subpoena, court order, or government regulation applicable in India or your jurisdiction.</li>
              <li><span className="white">Business Transfers:</span> In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction. You will be notified of any such change.</li>
              <li><span className="white">Aggregated/Anonymized Data:</span> We may share aggregated, de-identified analytics with business partners. This data cannot be used to identify any individual user.</li>
            </ul>
          </section>

          {/* 8 — International Transfers (NEW — industry standard) */}
          <section className="static-section">
            <h2>8. International Data Transfers</h2>
            <p>
              PlusOpinion is headquartered in India. Your data may be processed on servers located outside your
              country of residence. We ensure that any cross-border data transfers comply with applicable data
              protection laws through the use of Standard Contractual Clauses (SCCs) and equivalent safeguards.
              By using the Platform, you consent to the transfer of your data to India and other jurisdictions
              where our service providers operate.
            </p>
          </section>

          {/* 9 — Children's Privacy (NEW — industry standard) */}
          <section className="static-section">
            <h2>9. Children's Privacy</h2>
            <p>
              PlusOpinion is not intended for use by individuals under the age of 18. We do not knowingly collect
              personal information from children. If we become aware that a child under 18 has provided us with
              personal data, we will take steps to delete such information promptly. If you believe a minor has
              provided us with their data, please contact us at{' '}
              <a href="mailto:support@plusopinion.com">support@plusopinion.com</a>.
            </p>
          </section>

          {/* 10 — Changes to Policy (NEW — industry standard) */}
          <section className="static-section">
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology,
              legal requirements, or other factors. When we make material changes, we will notify you by posting
              the updated policy on this page with a revised "Last Updated" date, and where appropriate, by
              sending you an in-app notification or email. We encourage you to review this page periodically.
              Continued use of the Platform after any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 11 — Compliance Frameworks (NEW — industry standard) */}
          <section className="static-section">
            <h2>11. Regulatory Compliance</h2>
            <p>PlusOpinion is designed to comply with the following data protection frameworks:</p>
            <ul>
              <li><span className="white">India DPDP Act, 2023:</span> Digital Personal Data Protection Act — governing the processing of digital personal data in India.</li>
              <li><span className="white">India IT Act, 2000:</span> Information Technology Act and its amendments, including the IT (Reasonable Security Practices) Rules, 2011.</li>
              <li><span className="white">GDPR (EU):</span> General Data Protection Regulation — for users in the European Economic Area.</li>
              <li><span className="white">CCPA/CPRA (California):</span> California Consumer Privacy Act and California Privacy Rights Act — for California residents.</li>
            </ul>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>
              If you are a resident of the EU/EEA or California and wish to exercise your rights under GDPR or CCPA/CPRA,
              please contact our Data Protection Officer at{' '}
              <a href="mailto:support@plusopinion.com">support@plusopinion.com</a>.
            </p>
          </section>

          {/* 12 — Contact */}
          <section className="static-section">
            <h2>12. Contact Us</h2>
            <p>
              For privacy-related inquiries, data access requests, or concerns about your personal information,
              please contact us:
            </p>
            <ul>
              <li><span className="white">Email:</span> <a href="mailto:support@plusopinion.com">support@plusopinion.com</a></li>
              <li><span className="white">Data Protection Officer:</span> <a href="mailto:founder@plusopinion.com">founder@plusopinion.com</a></li>
              <li><span className="white">Response Time:</span> We aim to respond to all data-related requests within 30 days.</li>
            </ul>
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
