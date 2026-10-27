/**
 * Terms.jsx — Ported from TERMS_AND_CONDITIONS.HTML
 * Full terms & conditions with enhanced industry-standard legal content.
 * Compliant with: Indian Contract Act 1872, IT Act 2000, Consumer Protection Act 2019.
 */
import { useNavigate, Link } from 'react-router-dom'

export default function Terms() {
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
          <h1>Terms and Conditions</h1>
          <p className="static-meta">Effective Date: February 11, 2026. Last Updated: February 11, 2026.</p>
        </header>

        <div className="static-sections">
          {/* 1 — Acceptance */}
          <section className="static-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the PlusOpinion platform ("Platform"), you agree to be bound by these Terms
              and Conditions ("Terms"). If you do not agree to these Terms, you must not use the Platform.
              Participation in our mandatory onboarding process constitutes explicit agreement to these Terms,
              including our <Link to="/privacy-policy">Privacy Policy</Link> and Community Guidelines.
            </p>
          </section>

          {/* 2 — Eligibility */}
          <section className="static-section">
            <h2>2. User Eligibility &amp; Account Roles</h2>
            <div className="static-grid cols-2" style={{ marginTop: 16 }}>
              <div className="glass-card no-hover" style={{ padding: 24, borderRadius: 16 }}>
                <h3 style={{ color: '#60a5fa', marginBottom: 8 }}>Individual Users (Opinion Leaders)</h3>
                <p style={{ fontSize: 14 }}>
                  Must be at least 18 years of age. Accounts are intended for personal use to share genuine
                  opinions and potentially qualify for monetization through the Partner Program.
                </p>
              </div>
              <div className="glass-card no-hover" style={{ padding: 24, borderRadius: 16 }}>
                <h3 style={{ color: '#60a5fa', marginBottom: 8 }}>Brands &amp; Companies</h3>
                <p style={{ fontSize: 14 }}>
                  Account creation is open to all legitimate business owners. While registered legal entities
                  are preferred, unregistered businesses may create accounts but will have access to a limited
                  feature set due to security and legal compliance requirements.
                </p>
              </div>
            </div>
          </section>

          {/* 3 — RQS */}
          <section className="static-section">
            <h2>3. Reputation Quality Score (RQS™) &amp; Anti-Gaming Policy</h2>
            <p>
              PlusOpinion utilizes a proprietary Reputation Quality Score (RQS) algorithm to maintain platform
              integrity. Your RQS (0–100) is a weighted metric derived from four foundational pillars:
            </p>
            <ul>
              <li><span className="white">Consistency Score:</span> Evaluates your reliability through active weekly participation and interaction streaks within the community.</li>
              <li><span className="white">Verification Credibility:</span> Measures the accuracy and authenticity of purchase proofs provided for your verified opinions.</li>
              <li><span className="white">Community Impact:</span> Quantifies the quantitative and qualitative value of your contributions, including 'Agrees' and constructive community engagement.</li>
              <li><span className="white">Legacy History:</span> Assesses historical adherence to platform standards, account age, and overall trust signals.</li>
            </ul>
            <div className="red-box">
              <h4>Anti-Gaming &amp; Manipulation</h4>
              <p>
                Strictly prohibited: Artificially inflating RQS, generating fake "Agrees," using bot farms, or
                operating multiple accounts to "game" the monetization system. Any attempt to manipulate these
                metrics will result in an immediate and permanent ban without notice.
              </p>
            </div>
          </section>

          {/* 4 — Content Standards */}
          <section className="static-section">
            <h2>4. Content Standards &amp; Verification</h2>
            <p>
              To ensure trust, all opinions tagged as "Verified" must be accompanied by legitimate proof of
              purchase (Invoices, Receipts, or AI-validated digital proofs).
            </p>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16, padding: 16, borderLeft: '2px solid #3b82f6', background: 'rgba(59,130,246,0.05)' }}>
                <p style={{ fontSize: 14, fontStyle: 'italic', margin: 0 }}>
                  "You are solely responsible for your opinions. You represent and warrant that your content is
                  based on a real experience and is factually accurate. PlusOpinion acts merely as a host; the
                  legal responsibility for any defamatory or false content rests entirely with the user."
                </p>
              </div>
              <p style={{ fontSize: 14 }}>
                <strong style={{ color: '#fff' }}>Audit Right:</strong> PlusOpinion reserves the right to audit any
                verified review and request secondary proof at any time. Failure to provide proof will lead to
                the revocation of "Verified" status.
              </p>
            </div>
          </section>

          {/* 5 — Partner Program */}
          <section className="static-section">
            <h2>5. Partner Program (Monetization)</h2>
            <p>
              PlusOpinion does not offer instant rewards for reviews. We operate a monetization model similar
              to premium content platforms (e.g., YouTube), where creators earn based on the long-term value of
              their contributions.
            </p>

            <div className="blue-box" style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: '#60a5fa', marginBottom: 12 }}>
                Data Minimization &amp; Security Advisory
              </h3>
              <p style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 16 }}>
                In accordance with our privacy-first philosophy, sensitive documentation (including government IDs
                and banking information) is <strong style={{ color: '#fff' }}>strictly collected only upon qualification
                for the Partner Program.</strong>
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200, fontSize: 12, color: '#94a3b8', borderLeft: '2px solid rgba(59,130,246,0.3)', paddingLeft: 16 }}>
                  <span style={{ color: '#fff', fontWeight: 500, display: 'block', marginBottom: 4 }}>Conditional Collection:</span>
                  Payout details are only accessible via the "Monetization Tab" after hitting the 75+ RQS threshold.
                </div>
                <div style={{ flex: 1, minWidth: 200, fontSize: 12, color: '#94a3b8', borderLeft: '2px solid rgba(245,158,11,0.3)', paddingLeft: 16 }}>
                  <span style={{ color: '#fbbf24', fontWeight: 500, display: 'block', marginBottom: 4 }}>Security Warning:</span>
                  PlusOpinion will never ask for ID or bank details via email or direct message. Report suspicious
                  requests to <span style={{ color: '#fff' }}>support@plusopinion.com</span>.
                </div>
              </div>
            </div>

            <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Verified Identity</h3>
              <p style={{ fontSize: 14, color: '#94a3b8' }}>
                Verification requires a secure session where users must submit a valid Government-issued ID.
                This data is handled via industry-standard encryption and is used solely for tax compliance
                and fraud prevention.
              </p>
            </div>

            <div className="glass-card no-hover" style={{ marginTop: 24, padding: 24, borderRadius: 16 }}>
              <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Monetization Thresholds</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', fontStyle: 'italic', marginBottom: 24 }}>
                To maintain a premium ecosystem, users must meet the following four criteria to apply for the Partner Program:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                <div className="metric-card">
                  <p className="label">Minimum RQS</p>
                  <p className="value">75+</p>
                </div>
                <div className="metric-card">
                  <p className="label">Interactions</p>
                  <p className="value">500+</p>
                </div>
                <div className="metric-card">
                  <p className="label">Active Streak</p>
                  <p className="value">4 Weeks</p>
                </div>
                <div className="metric-card">
                  <p className="label">Identity</p>
                  <p className="value">Verified</p>
                </div>
              </div>
              <ul style={{ fontSize: 12, color: '#64748b', listStyle: 'none', padding: 0 }}>
                <li>• Becoming a Partner does not guarantee specific earnings.</li>
                <li>• Payouts are processed monthly after a verification audit of activity authenticity.</li>
                <li>• PlusOpinion reserves the right to withhold earnings derived from suspicious or low-quality activity.</li>
              </ul>
            </div>
          </section>

          {/* 6 — Intellectual Property */}
          <section className="static-section">
            <h2>6. Intellectual Property &amp; Competitor Misuse</h2>
            <p>
              All data on the Platform, including verified opinion metrics and RQS calculations, is the exclusive
              property of PlusOpinion. Automated scraping, bot-crawling, or the use of Platform data to train
              competing AI models or build competing services is strictly prohibited.
            </p>
          </section>

          {/* 7 — Retention */}
          <section className="static-section">
            <h2>7. Retention &amp; Archiving</h2>
            <p>
              Deleted opinions are archived for compliance purposes to prevent platform manipulation and
              assist in legal investigations. Archiving ensures that verified history remains trackable in cases
              of fraud or defamation.
            </p>
          </section>

          {/* 8 — Prohibited Conduct (NEW — industry standard) */}
          <section className="static-section">
            <h2>8. Prohibited Conduct</h2>
            <p>You agree not to engage in any of the following activities:</p>
            <ul>
              <li>Posting false, misleading, defamatory, or harmful content.</li>
              <li>Harassing, threatening, or intimidating other users.</li>
              <li>Impersonating any person, brand, or entity.</li>
              <li>Using automated tools, bots, or scripts to interact with the Platform.</li>
              <li>Attempting to access another user's account without authorization.</li>
              <li>Circumventing or disabling any security features of the Platform.</li>
              <li>Uploading malware, viruses, or any code designed to disrupt the Platform.</li>
              <li>Using the Platform for any unlawful purpose or to solicit illegal activities.</li>
            </ul>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>
              Violation of these rules may result in immediate account suspension or permanent termination,
              at PlusOpinion's sole discretion, without prior notice or refund.
            </p>
          </section>

          {/* 9 — Limitation of Liability (NEW — industry standard) */}
          <section className="static-section">
            <h2>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, PlusOpinion and its directors, employees, partners,
              agents, and affiliates shall not be liable for any indirect, incidental, special, consequential, or
              punitive damages, including but not limited to loss of profits, data, goodwill, or other intangible
              losses, resulting from:
            </p>
            <ul>
              <li>Your access to or use of (or inability to access or use) the Platform.</li>
              <li>Any conduct or content of any third party on the Platform.</li>
              <li>Any content obtained from the Platform.</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
            </ul>
            <p style={{ fontSize: 14, color: '#94a3b8' }}>
              In no event shall PlusOpinion's total aggregate liability exceed the amount you have paid to
              PlusOpinion in the twelve (12) months preceding the claim, or ₹5,000 (INR), whichever is greater.
            </p>
          </section>

          {/* 10 — Indemnification (NEW — industry standard) */}
          <section className="static-section">
            <h2>10. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless PlusOpinion, its officers, directors, employees,
              and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt
              arising from: (a) your use of and access to the Platform; (b) your violation of any term of these
              Terms; (c) your violation of any third-party right, including any copyright, trademark, privacy, or
              other proprietary right; or (d) any claim that your content caused damage to a third party.
            </p>
          </section>

          {/* 11 — Disclaimers (NEW — industry standard) */}
          <section className="static-section">
            <h2>11. Disclaimers</h2>
            <p>
              The Platform is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind,
              either express or implied, including but not limited to implied warranties of merchantability,
              fitness for a particular purpose, non-infringement, or course of performance. PlusOpinion does not
              warrant that the Platform will be uninterrupted, error-free, secure, or free of viruses or other
              harmful components.
            </p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 12 }}>
              User-generated opinions represent the views of their respective authors and do not constitute
              endorsement, recommendation, or guarantee by PlusOpinion.
            </p>
          </section>

          {/* 12 — Termination (NEW — industry standard) */}
          <section className="static-section">
            <h2>12. Account Termination</h2>
            <p>
              PlusOpinion may terminate or suspend your account and access to the Platform immediately, without
              prior notice, for any reason, including but not limited to breach of these Terms. Upon termination,
              your right to use the Platform will immediately cease. If you wish to terminate your account, you
              may do so from your account settings or by contacting{' '}
              <a href="mailto:support@plusopinion.com">support@plusopinion.com</a>.
            </p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 12 }}>
              Provisions that by their nature should survive termination shall survive, including ownership
              provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>

          {/* 13 — Dispute Resolution (NEW — industry standard) */}
          <section className="static-section">
            <h2>13. Dispute Resolution</h2>
            <p>
              Any dispute arising from these Terms shall first be attempted to be resolved through good-faith
              negotiation. If the dispute is not resolved within thirty (30) days, either party may refer the
              matter to binding arbitration in accordance with the Arbitration and Conciliation Act, 1996 (India).
              The seat of arbitration shall be New Delhi, India. The language of arbitration shall be English.
            </p>
          </section>

          {/* 14 — Governing Law */}
          <section className="static-section">
            <h2>14. Governing Law &amp; Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes
              arising from these Terms or Platform use shall be subject to the exclusive jurisdiction of the
              courts in New Delhi, India.
            </p>
          </section>

          {/* 15 — Severability (NEW — industry standard) */}
          <section className="static-section">
            <h2>15. Severability</h2>
            <p>
              If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of
              competent jurisdiction, such provision shall be modified to the minimum extent necessary to make
              it valid and enforceable, or if modification is not possible, severed from these Terms. The
              remaining provisions shall continue in full force and effect.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="static-footer">
          <p>© 2026 PlusOpinion Technologies. All rights reserved.</p>
          <p className="sub">
            For support, contact <a href="mailto:support@plusopinion.com">support@plusopinion.com</a>
          </p>
        </footer>
      </main>
    </div>
  )
}
