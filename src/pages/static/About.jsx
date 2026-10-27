/**
 * About.jsx — Ported from ABOUT.HTML
 * Static "About Us" page with full content from old MPA.
 */
import { useNavigate, Link } from 'react-router-dom'

export default function About() {
  const navigate = useNavigate()
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/feed'))

  return (
    <div className="static-page">
      {/* Background glow */}
      <div className="static-bg-glow">
        <div className="orb orb-blue" />
        <div className="orb orb-violet" />
      </div>

      {/* Header */}
      <header className="static-header">
        <div className="static-header-brand">
          <span className="static-header-brand-name">PlusOpinion</span>
          <span className="static-header-badge">Beta</span>
        </div>
        <button className="static-header-back" onClick={goBack}>Back</button>
      </header>

      {/* Main */}
      <main className="static-main">
        {/* Hero */}
        <header className="static-page-header centered">
          <h1>
            We are <span className="text-blue">PlusOpinion</span>,<br />
            and we are here for <span style={{ color: '#fff' }}>you.</span>
          </h1>
          <p className="static-subtitle">
            Refusing the noise of the digital world. Reclaiming trust. A platform for the truth to be heard.
          </p>
        </header>

        <div className="static-sections">
          {/* Our Mission */}
          <section className="static-section">
            <div className="glass-card no-hover" style={{ padding: '32px 48px' }}>
              <h2>More Than Just Social Media</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: 18, lineHeight: 1.7 }}>
                <p>
                  We are not just another platform for following and unfollowing. We are a sanctuary for the{' '}
                  <strong style={{ color: '#fff' }}>whole population</strong> to write their opinions without fear or
                  insecurity.
                </p>
                <p>
                  In a digital age filled with noise, manipulation, and fake reviews, authentic voices often
                  get lost. We are here to change that. Whether you choose to speak publicly or anonymously,
                  we ensure secure expression where{' '}
                  <strong style={{ color: '#fff' }}>no one knows who you are until you choose to reveal yourself.</strong>
                </p>
                <p className="static-quote">
                  "You can write whatever opinion you have, and we will make sure you don't get unheard."
                </p>
              </div>
            </div>
          </section>

          {/* For the Public */}
          <section className="static-section">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <span style={{ width: 32, height: 1, background: '#3b82f6' }} />
              For The Public
            </h3>
            <div className="static-grid cols-2">
              <div className="mini-card">
                <h4>Unfiltered Truth</h4>
                <p>
                  We are building trust in the market with <strong style={{ color: '#fff' }}>verified consumer opinions</strong>.
                  We assure that real experiences will no longer fade into the background of manipulated narratives.
                </p>
              </div>
              <div className="mini-card">
                <h4>Blind Trust</h4>
                <p>
                  A platform you can trust blindly before making any purchase or simply to stay informed about
                  what's truly happening in the world. Real people, real stories.
                </p>
              </div>
            </div>
          </section>

          {/* Empowering Partners */}
          <section className="static-section">
            <div className="blue-box" style={{ borderRadius: 24, padding: '32px 40px', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 0, right: 0, width: 256, height: 256,
                background: 'rgba(59,130,246,0.1)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none',
              }} />
              <h3 style={{ fontSize: 20, position: 'relative', zIndex: 1 }}>Empowering Partners</h3>
              <p style={{ fontSize: 18, color: '#cbd5e1', marginBottom: 24, position: 'relative', zIndex: 1 }}>
                We believe that the value of a platform is created by its users. That's why we share our success.
              </p>
              <p style={{ fontSize: 14, color: '#94a3b8', position: 'relative', zIndex: 1 }}>
                We are opening income opportunities for{' '}
                <strong style={{ color: '#fff' }}>middle-class families, students, and side-hustlers</strong>.
                Through our Partner Program, you don't just contribute content — you earn a share of the
                platform's overall revenue. Your voice has value, literally.
              </p>
            </div>
          </section>

          {/* For Brands */}
          <section className="static-section">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <span style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.2)' }} />
              For Brands &amp; Companies
            </h3>
            <div className="glass-card no-hover" style={{ borderRadius: 24 }}>
              <p style={{ fontSize: 18, lineHeight: 1.7 }}>
                We provide a <strong style={{ color: '#fff' }}>SaaS-driven ecosystem</strong> for Research & Development.
                Companies can access summarized, authentic data to improve products and make informed business decisions.
                We offer advanced tools for proper customer and market research, bridging the gap between consumers and creators.
              </p>
            </div>
          </section>

          {/* Global Ambition */}
          <section className="static-section" style={{ paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
              <h2 style={{ fontSize: 30 }}>From India, For The World</h2>
              <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32 }}>
                It has long been said that there isn't a global digital giant from India.<br />
                <strong style={{ color: '#fff' }}>We are here to disrupt that.</strong>
              </p>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
                PlusOpinion is designed to be a category-creator, disrupting traditional social networking.
                We are the new-age platform, built with Indian ingenuity, for the global citizen.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="static-footer">
          <p>© 2026 PlusOpinion Technologies. All rights reserved.</p>
          <div className="static-footer-links">
            <Link to="/t&c">Terms</Link>
            <Link to="/privacy-policy">Privacy</Link>
            <a href="mailto:support@plusopinion.com">Contact</a>
          </div>
        </footer>
      </main>
    </div>
  )
}
