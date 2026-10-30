
import "./LandingPage.css";

const features = [
  {
    icon: "✦",
    title: "AI Career Assistant",
    description:
      "Get personalized career guidance, Python interview help, and practical answers to your questions.",
  },
  {
    icon: "◈",
    title: "Resume Analyzer",
    description:
      "Analyze your resume, identify missing skills, and discover opportunities to improve your profile.",
  },
  {
    icon: "⌘",
    title: "Interview Preparation",
    description:
      "Practice technical questions and build confidence before your next interview.",
  },
  {
    icon: "↗",
    title: "Job Application Tracker",
    description:
      "Organize applications, track interview progress, and keep your job search moving forward.",
  },
];

export default function LandingPage({ onGetStarted, onSignIn }) {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <a className="brand" href="#home" aria-label="CareerPilot AI home">
          <span className="brand-mark">✦</span>
          <span>
            CareerPilot<span className="brand-accent"> AI</span>
          </span>
        </a>

        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
        </div>

        <div className="landing-nav-actions">
          <button className="nav-signin" onClick={onSignIn}>
            Sign in
          </button>
          <button className="button-primary nav-get-started" onClick={onGetStarted}>
            Get started <span aria-hidden="true">→</span>
          </button>
        </div>
      </nav>

      <main id="home">
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="hero-badge">
              <span className="badge-sparkle">✦</span>
              YOUR PERSONAL AI CAREER PARTNER
            </div>

            <h1>
              Your next career move,
              <span> made smarter.</span>
            </h1>

            <p className="hero-description">
              One place to improve your resume, practice interviews, get AI
              career guidance, and manage your job search with confidence.
            </p>

            <div className="hero-actions">
              <button className="button-primary hero-cta" onClick={onGetStarted}>
                Start your journey <span aria-hidden="true">→</span>
              </button>
              <a className="hero-secondary" href="#features">
                Explore features <span aria-hidden="true">↓</span>
              </a>
            </div>

            <div className="hero-trust">
              <span className="trust-icon">✓</span>
              Built for your next opportunity
              <span className="trust-dot">·</span>
              AI-powered career tools
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow" />
            <div className="preview-window">
              <div className="preview-topbar">
                <div className="window-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="preview-label">CAREERPILOT WORKSPACE</span>
                <span className="preview-status">
                  <i /> AI ready
                </span>
              </div>

              <div className="preview-body">
                <aside className="preview-sidebar">
                  <div className="preview-logo">✦</div>
                  <div className="preview-side-item active">⌂</div>
                  <div className="preview-side-item">✧</div>
                  <div className="preview-side-item">▤</div>
                  <div className="preview-side-item">▣</div>
                </aside>

                <div className="preview-content">
                  <div className="preview-greeting">YOUR CAREER, IN FOCUS</div>
                  <h3>Good things start here.</h3>
                  <p className="preview-subtitle">
                    Your personal career workspace
                  </p>

                  <div className="preview-metric-grid">
                    <div className="preview-metric">
                      <span>Resume readiness</span>
                      <strong>Improve your profile</strong>
                      <div className="preview-progress">
                        <span />
                      </div>
                    </div>
                    <div className="preview-metric">
                      <span>Interview practice</span>
                      <strong>Build confidence</strong>
                      <div className="preview-progress purple">
                        <span />
                      </div>
                    </div>
                  </div>

                  <div className="preview-chat">
                    <div className="preview-ai-icon">✦</div>
                    <div>
                      <strong>Your AI career assistant</strong>
                      <p>
                        Ready to help you prepare for your next opportunity.
                      </p>
                    </div>
                  </div>

                  <div className="preview-bottom-row">
                    <div className="preview-mini-card">
                      <span>✧</span>
                      Resume insights
                    </div>
                    <div className="preview-mini-card">
                      <span>↗</span>
                      Job applications
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="floating-note floating-note-top">
              <span className="floating-icon purple-icon">✦</span>
              <div>
                <strong>AI career guidance</strong>
                <small>Ideas for your next step</small>
              </div>
            </div>

            <div className="floating-note floating-note-bottom">
              <span className="floating-icon green-icon">✓</span>
              <div>
                <strong>Stay organized</strong>
                <small>Your job search, in one place</small>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading">
            <span className="section-eyebrow">YOUR CAREER TOOLKIT</span>
            <h2>Everything you need to move forward</h2>
            <p>
              Practical tools to help you prepare, improve, and keep progressing.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <span className="feature-arrow" aria-hidden="true">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="how-copy">
            <span className="section-eyebrow">A CLEARER WAY FORWARD</span>
            <h2>Small steps. Stronger applications.</h2>
            <p>
              Turn an overwhelming job search into a more organized routine.
              Prepare for interviews, strengthen your resume, and keep track of
              each application as you progress.
            </p>
            <button className="button-primary" onClick={onGetStarted}>
              Get started for free <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="how-steps">
            <div className="how-step">
              <span>01</span>
              <div>
                <h3>Set up your workspace</h3>
                <p>Start with your career goals and current profile.</p>
              </div>
            </div>
            <div className="how-step">
              <span>02</span>
              <div>
                <h3>Prepare with AI tools</h3>
                <p>Work on your resume and practice interview questions.</p>
              </div>
            </div>
            <div className="how-step">
              <span>03</span>
              <div>
                <h3>Track your progress</h3>
                <p>Keep applications organized as you pursue opportunities.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-mark">✦</span>
          <span>CareerPilot<span className="brand-accent"> AI</span></span>
        </a>
        <p>Your next opportunity starts with one step.</p>
        <span>© {new Date().getFullYear()} CareerPilot AI</span>
      </footer>
    </div>
  );
}
