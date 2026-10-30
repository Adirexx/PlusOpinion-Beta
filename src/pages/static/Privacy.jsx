/**
 * Privacy.jsx — PlusOpinion Privacy Policy
 * Compliant with: Google Play Developer Policy, Google API Services User Data Policy,
 * India DPDP Act 2023, India IT Act 2000, GDPR (EU), CCPA/CPRA (California).
 * Effective Date: February 11, 2026. Last Updated: October 31, 2026.
 */
import { useNavigate } from 'react-router-dom'

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
          <p className="static-meta">
            Effective Date: February 11, 2026. Last Updated: October 31, 2026.
          </p>
        </header>

        <div className="static-sections">

          {/* INTRODUCTION */}
          <section className="static-section">
            <h2>1. Introduction</h2>
            <p>
              PlusOpinion ("we", "us", or "our") is a verified-review and opinion-sharing platform
              operated by PlusOpinion Technologies, headquartered in India. This Privacy Policy
              describes in clear, specific detail exactly what personal data we collect from users
              of the PlusOpinion mobile application and website (collectively, the "Platform"), how
              that data is used, how long it is retained, and what rights you have over it.
            </p>
            <p style={{ marginTop: 12 }}>
              By registering for or using the Platform, you acknowledge that you have read,
              understood, and agreed to this Privacy Policy. If you do not agree, please discontinue
              use of the Platform immediately.
            </p>
            <div className="highlight-box" style={{ marginTop: 16 }}>
              <p>
                <span className="accent">Our core commitment:</span> We do not sell, rent, or trade
                your personal data to third-party advertisers or data brokers. Your data is used
                exclusively to operate and improve the Platform.
              </p>
            </div>
          </section>

          {/* INFORMATION WE COLLECT */}
          <section className="static-section">
            <h2>2. Information We Collect</h2>
            <p style={{ marginBottom: 20 }}>
              We collect only the information that is strictly necessary to provide and secure the
              Platform. Below is a precise, category-by-category breakdown of every type of data
              we collect, along with the purpose for each.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* 2A */}
              <div>
                <h3>A. Account Registration Data</h3>
                <p style={{ fontSize: 14 }}>
                  When you create a PlusOpinion account, we collect: your <strong>full name</strong>,
                  <strong> email address</strong>, <strong>chosen username</strong>, and your
                  <strong> date of birth</strong> (used only to verify you are 18 or older). If you
                  register via Google Sign-In, we receive your name and email from Google's Identity
                  Services; we never receive your Google password. Your email address is used for
                  OTP (One-Time Password) verification, account recovery, and critical security
                  notifications only.
                </p>
              </div>

              {/* 2B */}
              <div>
                <h3>B. Profile Information</h3>
                <p style={{ fontSize: 14 }}>
                  After registration, you may optionally provide a <strong>profile photo
                  (avatar)</strong> and a short <strong>bio</strong>. Your username, display name,
                  avatar, and RQS™ (Reputation Quality Score) are publicly visible to other users
                  on the Platform. Your email address and date of birth are never displayed publicly.
                </p>
              </div>

              {/* 2C */}
              <div>
                <h3>C. Opinion & Review Content</h3>
                <p style={{ fontSize: 14 }}>
                  The Platform is built around opinions. We store the <strong>text content</strong> of
                  your opinions and reviews, any <strong>images</strong> you upload with a post, the
                  <strong> product or brand name</strong> you are reviewing, the <strong>category</strong>,
                  and optional <strong>proof-of-purchase images</strong> (receipts or invoices) that
                  you voluntarily submit to earn a "Verified" badge on a post. Proof-of-purchase
                  images are stored securely, are never shown to other users, and are used solely
                  to validate the authenticity of your review experience.
                </p>
              </div>

              {/* 2D */}
              <div>
                <h3>D. Interaction & Engagement Data</h3>
                <p style={{ fontSize: 14 }}>
                  To calculate your RQS™ score, maintain platform integrity, and power your activity
                  feed, we record your in-app interactions: <strong>agrees (likes)</strong>,
                  <strong> comments</strong>, <strong>replies</strong>, <strong>bookmarks</strong>,
                  <strong> daily streaks</strong>, and <strong>report submissions</strong>.
                  This data forms the basis of your reputation and is used to prevent manipulation
                  of the review ecosystem.
                </p>
              </div>

              {/* 2E */}
              <div>
                <h3>E. Private Messaging (Inbox) Data</h3>
                <p style={{ fontSize: 14 }}>
                  PlusOpinion provides a private messaging feature ("Inbox") that uses
                  <strong> End-to-End Encryption (E2EE)</strong> based on the ECDH P-256 key
                  exchange algorithm and AES-GCM 256-bit encryption. This means your private
                  messages are encrypted on your device before transmission; <strong>PlusOpinion
                  cannot read the content of your private messages</strong>. Your
                  <strong> E2EE public key</strong> is stored on our servers (to enable other
                  users to send you encrypted messages). Your <strong>private key is generated
                  locally on your device and is never transmitted to our servers in plaintext
                  </strong>; an optional PIN-encrypted backup of the private key may be stored
                  in your profile for account recovery purposes. Images shared in private
                  conversations are compressed client-side and stored in a private, access-controlled
                  storage bucket; they are accessible only to the sender and recipient via
                  short-lived signed URLs (1-hour expiry).
                </p>
              </div>

              {/* 2F */}
              <div>
                <h3>F. Partner Program Data (Conditional — Not Collected at Onboarding)</h3>
                <p style={{ fontSize: 14 }}>
                  PlusOpinion does <strong>not</strong> collect government-issued identification
                  documents or bank account information during initial registration. This data is
                  collected <em>only</em> when a user voluntarily applies to the Partner Program
                  after meeting eligibility thresholds (75+ RQS™ and 500+ Verified Interactions).
                  At that stage, we collect government-issued ID details and bank/UPI account
                  information exclusively for identity verification and payout processing. If you
                  receive any request for ID documents before reaching Partner Program eligibility,
                  please report it immediately to{' '}
                  <a href="mailto:support@plusopinion.com">support@plusopinion.com</a>.
                </p>
              </div>

              {/* 2G */}
              <div>
                <h3>G. Technical & Device Data (Automatically Collected)</h3>
                <p style={{ fontSize: 14 }}>
                  When you access the Platform, we automatically collect the following technical
                  data to operate, secure, and improve the service:
                </p>
                <ul style={{ fontSize: 14, marginTop: 8 }}>
                  <li><strong>Device identifiers</strong> (used for session management and fraud
                    prevention)</li>
                  <li><strong>IP address</strong> (used for security monitoring and approximate
                    location at city/country level only; not stored long-term)</li>
                  <li><strong>Browser type and version, operating system</strong> (for
                    compatibility and rendering optimization)</li>
                  <li><strong>Pages visited, features used, and time spent</strong> (for product
                    improvement and abuse detection)</li>
                  <li><strong>Referring URLs</strong> (to understand how users discover the
                    Platform)</li>
                </ul>
              </div>

              {/* 2H */}
              <div>
                <h3>H. Local Storage & Session Data</h3>
                <p style={{ fontSize: 14 }}>
                  The PlusOpinion app stores data locally on your device using
                  <strong> localStorage</strong> and <strong>sessionStorage</strong> for the
                  following purposes: maintaining your authenticated session (JWT token managed
                  by Supabase Auth), caching your profile data for faster load times, storing your
                  E2EE private key (encrypted by your PIN), and saving draft content. This data
                  remains on your device and is cleared when you sign out or uninstall the app.
                </p>
              </div>

              {/* 2I */}
              <div>
                <h3>I. Notifications Data</h3>
                <p style={{ fontSize: 14 }}>
                  With your permission, we send you push notifications for in-app events such as
                  new agreements on your opinions, comments, replies, and follow requests.
                  Notification preferences can be managed in your account Settings at any time.
                </p>
              </div>

            </div>
          </section>

          {/* HOW WE USE YOUR DATA */}
          <section className="static-section">
            <h2>3. How We Use Your Information</h2>
            <p style={{ marginBottom: 16 }}>
              We use the information we collect strictly for the following purposes:
            </p>
            <ul>
              <li>
                <span className="white">Account creation and authentication:</span> To register your
                account, verify your email via OTP, and authenticate you on each session using
                secure JWT tokens.
              </li>
              <li>
                <span className="white">Platform operation:</span> To display your opinions and
                reviews to other users, maintain your activity feed, process interactions (agrees,
                comments, bookmarks), and deliver in-app notifications.
              </li>
              <li>
                <span className="white">RQS™ (Reputation Quality Score) calculation:</span> To
                compute, display, and maintain your reputation score based on your interaction
                quality, streak consistency, verified review count, and lifetime engagement.
              </li>
              <li>
                <span className="white">Security and fraud prevention:</span> To detect and prevent
                fake accounts, review manipulation, platform gaming, and unauthorized access. We
                use device identifiers, IP addresses, and interaction patterns for this purpose.
              </li>
              <li>
                <span className="white">End-to-End Encrypted messaging:</span> To operate the
                private Inbox feature. Your public key is stored to enable encrypted message
                delivery. We do not access the content of your encrypted conversations.
              </li>
              <li>
                <span className="white">Partner Program payouts:</span> To verify identity and
                process earnings for eligible partners via their provided bank/UPI details.
              </li>
              <li>
                <span className="white">Customer support:</span> To respond to your support
                requests, bug reports, and account-related queries.
              </li>
              <li>
                <span className="white">Legal compliance:</span> To comply with applicable laws,
                legal processes, or government requests, including archiving data as required to
                prevent "review-and-delete" manipulation and assist in defamation investigations.
              </li>
              <li>
                <span className="white">Platform improvement:</span> To analyze aggregate,
                anonymized usage patterns to improve features, fix bugs, and enhance the
                overall user experience.
              </li>
            </ul>
            <p style={{ marginTop: 16, fontSize: 14, color: '#94a3b8' }}>
              We do not use your data for targeted advertising, user profiling for commercial sale,
              or any purpose not listed above.
            </p>
          </section>

          {/* DATA SHARING */}
          <section className="static-section">
            <h2>4. How We Share Your Information</h2>
            <p>
              We do not sell your personal data. We share your information only in the following
              limited circumstances:
            </p>
            <ul>
              <li>
                <span className="white">Infrastructure & Cloud Services (Supabase / AWS):</span>{' '}
                Our backend database, authentication, file storage, and real-time services are
                powered by Supabase (which runs on AWS infrastructure). Supabase processes data
                on our behalf under a formal Data Processing Agreement (DPA) and is contractually
                bound to process data only per our instructions.
              </li>
              <li>
                <span className="white">Payment Processors:</span> For Partner Program payouts,
                bank/UPI account details are shared with our regulated payment processing
                partner solely to complete the transfer. We do not store full bank credentials
                beyond what is necessary for payout processing.
              </li>
              <li>
                <span className="white">Legal Obligations:</span> We may disclose data when
                required to do so by applicable Indian law, court order, government authority,
                or regulatory body. We will, where legally permissible, notify you of such
                requests.
              </li>
              <li>
                <span className="white">Business Transfers:</span> In the event of a merger,
                acquisition, or asset sale, your data may be transferred as part of that
                transaction. You will be notified of any such change with an option to delete
                your account before transfer.
              </li>
              <li>
                <span className="white">Aggregated & Anonymized Analytics:</span> We may share
                aggregate, de-identified statistics (such as total active users or top review
                categories) with business partners or the public. This data cannot be used to
                identify any individual.
              </li>
              <li>
                <span className="white">With Your Explicit Consent:</span> In any other circumstance
                not described above, we will ask for your explicit consent before sharing your
                data.
              </li>
            </ul>
          </section>

          {/* DATA RETENTION */}
          <section className="static-section">
            <h2>5. Data Retention</h2>
            <p>
              We retain your personal data only for as long as necessary to fulfil the purposes
              outlined in this policy or as required by applicable law.
            </p>
            <div className="amber-box" style={{ marginTop: 16 }}>
              <h4>The Compliance Archive</h4>
              <p>
                When you delete an opinion or your account, certain data (specifically, the content
                of published opinions and associated interaction records) is moved to a secured,
                restricted "Compliance Archive" rather than being permanently deleted immediately.
                This is necessary to: (a) prevent "review-and-delete" manipulation of the
                ecosystem; (b) comply with Indian IT Act obligations; and (c) assist in potential
                legal investigations such as defamation claims. Data in the Compliance Archive is
                inaccessible to other users, is never displayed on the Platform, and is protected
                by encrypted, access-controlled storage. Archived data is reviewed periodically
                and deleted when no longer legally required.
              </p>
            </div>
            <ul style={{ marginTop: 16 }}>
              <li><strong>Active account data:</strong> Retained for the lifetime of your account.</li>
              <li><strong>Account deletion requests:</strong> Active profile data is removed within
                30 days. Compliance Archive data is retained for up to 3 years per Indian IT
                Act requirements.</li>
              <li><strong>Partner Program financial records:</strong> Retained for 7 years as
                required by Indian tax and financial regulations.</li>
              <li><strong>Support communications:</strong> Retained for 2 years from the date of
                the last correspondence.</li>
              <li><strong>Technical logs (IP, device):</strong> Retained for a maximum of 90 days
                unless required for an ongoing security investigation.</li>
            </ul>
          </section>

          {/* SECURITY */}
          <section className="static-section">
            <h2>6. Security of Your Information</h2>
            <p>
              We implement multiple layers of technical and organizational security measures to
              protect your data against unauthorized access, loss, or misuse:
            </p>
            <ul>
              <li>
                <span className="white">Row Level Security (RLS):</span> Database-level access
                policies enforced by Supabase ensure users can only read and write their own
                authorized data. No user can access another user's private data through the API.
              </li>
              <li>
                <span className="white">End-to-End Encryption for Messages:</span> Private
                messages are encrypted client-side using ECDH P-256 + AES-GCM 256-bit encryption.
                Your private key never leaves your device in plaintext. PlusOpinion cannot decrypt
                your messages.
              </li>
              <li>
                <span className="white">TLS 1.3 Encryption in Transit:</span> All data transmitted
                between your device and our servers is encrypted with industry-standard TLS 1.3.
                The Capacitor app enforces HTTPS-only communication (<code>cleartext: false</code>).
              </li>
              <li>
                <span className="white">JWT Authentication:</span> Secure, time-limited session
                tokens are used for all API requests. Sessions are automatically refreshed and
                invalidated on sign-out.
              </li>
              <li>
                <span className="white">Proof-of-Purchase Storage:</span> Verification documents
                (receipts/invoices) are stored in a private, access-controlled storage bucket and
                are never publicly accessible.
              </li>
              <li>
                <span className="white">Chat Media — Private Bucket with Expiring URLs:</span>{' '}
                Images shared in private conversations are stored in a private Supabase storage
                bucket. Access is granted only via cryptographically signed URLs that expire after
                1 hour.
              </li>
              <li>
                <span className="white">Continuous Security Monitoring:</span> We monitor our
                infrastructure for suspicious access patterns and take immediate action upon
                detecting anomalies.
              </li>
            </ul>
            <p style={{ marginTop: 12, fontSize: 14, color: '#94a3b8' }}>
              While we take every reasonable precaution, no security system is impenetrable. In
              the event of a data breach that is likely to result in a risk to your rights and
              freedoms, we will notify you in accordance with applicable law.
            </p>
          </section>

          {/* YOUR RIGHTS */}
          <section className="static-section">
            <h2>7. Your Privacy Rights</h2>
            <p style={{ marginBottom: 20 }}>
              Depending on your location, you may have the following rights regarding your personal
              data. To exercise any of these rights, contact us at{' '}
              <a href="mailto:support@plusopinion.com">support@plusopinion.com</a>. We will respond
              within 30 days.
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
                <p>Request a copy of all personal data we hold about you.</p>
              </div>
              <div className="rights-card">
                <div className="icon-circle">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h4>Right to Rectification</h4>
                <p>Correct or update inaccurate personal information via your profile settings.</p>
              </div>
              <div className="rights-card">
                <div className="icon-circle">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h4>Right to Erasure</h4>
                <p>Request deletion of your account and personal data (subject to legal archiving obligations above).</p>
              </div>
              <div className="rights-card">
                <div className="icon-circle">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h4>Right to Object / Withdraw Consent</h4>
                <p>Object to certain processing or withdraw previously given consent (e.g., notifications) at any time.</p>
              </div>
              <div className="rights-card">
                <div className="icon-circle">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <h4>Right to Data Portability</h4>
                <p>Request your data in a structured, machine-readable format (GDPR / DPDP Act users).</p>
              </div>
              <div className="rights-card">
                <div className="icon-circle">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h4>Right to Lodge a Complaint</h4>
                <p>File a complaint with your applicable data protection authority if you believe your rights have been violated.</p>
              </div>
            </div>
          </section>

          {/* CHILDREN'S PRIVACY */}
          <section className="static-section">
            <h2>8. Children's Privacy</h2>
            <p>
              PlusOpinion is strictly intended for users who are 18 years of age or older. We do
              not knowingly collect personal information from individuals under 18. During
              registration, we collect date of birth solely to verify age eligibility. If we
              discover that a user under 18 has created an account, we will immediately suspend the
              account and delete the associated personal data. If you are a parent or guardian and
              believe a minor has registered on our Platform, please contact us immediately at{' '}
              <a href="mailto:support@plusopinion.com">support@plusopinion.com</a>.
            </p>
          </section>

          {/* THIRD-PARTY SERVICES */}
          <section className="static-section">
            <h2>9. Third-Party Services & Google Sign-In</h2>
            <p>
              The Platform integrates the following third-party services. Each operates under its
              own privacy policy:
            </p>
            <ul>
              <li>
                <span className="white">Google Identity Services (Sign-In):</span> If you choose
                to sign in with Google, we receive only your name and email address from Google.
                We use this data solely to create or authenticate your PlusOpinion account. Our
                use of information received from Google APIs adheres to the{' '}
                <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </li>
              <li>
                <span className="white">Supabase (Backend-as-a-Service):</span> Our primary
                infrastructure provider for database, authentication, real-time messaging, and
                file storage. Data is processed under a Data Processing Agreement consistent with
                GDPR and applicable law.{' '}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</a>.
              </li>
              <li>
                <span className="white">Cloudflare (Edge Network / Proxy):</span> Used for
                content delivery and DDoS protection. Cloudflare may process request metadata
                (IP addresses, headers) in transit.{' '}
                <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Cloudflare Privacy Policy</a>.
              </li>
            </ul>
            <p style={{ marginTop: 12, fontSize: 14, color: '#94a3b8' }}>
              We do not embed third-party advertising SDKs or analytics trackers (such as
              Facebook Pixel or Google Analytics) that track users across other websites or apps.
            </p>
          </section>

          {/* INTERNATIONAL TRANSFERS */}
          <section className="static-section">
            <h2>10. International Data Transfers</h2>
            <p>
              PlusOpinion is headquartered in India. Our backend infrastructure (Supabase / AWS)
              may process and store your data on servers located in the United States or other
              jurisdictions outside India. We ensure that any cross-border data transfers are
              conducted under appropriate safeguards, including Standard Contractual Clauses (SCCs)
              where applicable. By using the Platform, you consent to the processing of your data
              in these jurisdictions under the protections described in this policy.
            </p>
          </section>

          {/* REGULATORY COMPLIANCE */}
          <section className="static-section">
            <h2>11. Regulatory Compliance</h2>
            <p>PlusOpinion is designed to comply with the following data protection frameworks:</p>
            <ul>
              <li>
                <span className="white">India DPDP Act, 2023:</span> Digital Personal Data
                Protection Act — governing the processing of digital personal data of individuals
                in India. We act as a "Data Fiduciary" under this Act and implement all
                required obligations including purpose limitation, data minimization, and your
                right to consent withdrawal and grievance redressal.
              </li>
              <li>
                <span className="white">India IT Act, 2000 & IT (SPDI) Rules, 2011:</span>{' '}
                Information Technology Act and the Reasonable Security Practices and Procedures
                and Sensitive Personal Data or Information Rules, governing sensitive personal
                data handling in India.
              </li>
              <li>
                <span className="white">GDPR (EU):</span> General Data Protection Regulation —
                applicable to users in the European Economic Area. Our legal basis for processing
                is primarily contractual necessity (to provide the service) and, where applicable,
                your consent.
              </li>
              <li>
                <span className="white">CCPA/CPRA (California, USA):</span> California Consumer
                Privacy Act and California Privacy Rights Act. California residents have the right
                to know, delete, and opt-out of sale of personal information. We do not sell
                personal information.
              </li>
              <li>
                <span className="white">Google Play Developer Policy:</span> This policy complies
                with Google Play's requirements for privacy policies, including specific disclosure
                of all data types collected, their purposes, and how they are shared.
              </li>
            </ul>
          </section>

          {/* CHANGES TO POLICY */}
          <section className="static-section">
            <h2>12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our
              practices, technology, legal requirements, or the features of the Platform. When
              we make material changes, we will update the "Last Updated" date at the top of this
              page and, where required by law or where the changes significantly affect your rights,
              notify you via in-app notification or email before the changes take effect. Your
              continued use of the Platform after any changes constitutes your acceptance of the
              updated policy. We encourage you to review this page periodically.
            </p>
          </section>

          {/* CONTACT */}
          <section className="static-section">
            <h2>13. Contact Us & Grievance Redressal</h2>
            <p>
              For privacy-related inquiries, data access or deletion requests, or to exercise any
              of your rights under this policy, please contact us:
            </p>
            <ul>
              <li>
                <span className="white">General Support & Privacy Requests:</span>{' '}
                <a href="mailto:support@plusopinion.com">support@plusopinion.com</a>
              </li>
              <li>
                <span className="white">Data Protection Officer / Grievance Officer:</span>{' '}
                <a href="mailto:founder@plusopinion.com">founder@plusopinion.com</a>
              </li>
              <li>
                <span className="white">Response Time:</span> We aim to acknowledge all
                data-related requests within 72 hours and resolve them within 30 days.
              </li>
            </ul>
            <p style={{ marginTop: 12, fontSize: 14, color: '#94a3b8' }}>
              If you are a resident of India and are not satisfied with our response, you may
              escalate your grievance to the Data Protection Board of India once it is constituted
              under the DPDP Act, 2023. EU/EEA residents may lodge a complaint with their local
              Data Protection Authority.
            </p>
          </section>

        </div>

        {/* Footer */}
        <footer className="static-footer">
          <p>© 2026 PlusOpinion Technologies. All rights reserved.</p>
          <p className="sub">
            Privacy inquiries:{' '}
            <a href="mailto:support@plusopinion.com">support@plusopinion.com</a>
          </p>
        </footer>
      </main>
    </div>
  )
}
