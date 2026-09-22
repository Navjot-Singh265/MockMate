import './LandingPage.css';

const TRACKS = [
  { id: 'sde', icon: '💻', label: 'SDE / DSA', color: 'accent', desc: 'Arrays, trees, DP, system design, OOP' },
  { id: 'datascience', icon: '📊', label: 'Data Science & ML', color: 'blue', desc: 'ML algorithms, stats, pandas, model eval, deep learning' },
  { id: 'devops', icon: '🚀', label: 'DevOps & Cloud', color: 'orange', desc: 'Docker, Kubernetes, CI/CD, AWS, Linux, IaC' },
  { id: 'hr', icon: '🤝', label: 'HR / Behavioral', color: 'green', desc: 'STAR method, teamwork, leadership, career goals' },
];

const COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Flipkart', 'Razorpay', 'Atlassian', 'Publicis Sapient', 'Josh Technology', 'Nagarro', 'Tekion'];

export default function LandingPage({ onStart, sessions }) {
  const totalScore = sessions.reduce((a, s) => a + (s.totalScore || 0), 0);
  const avgScore = sessions.length ? Math.round(totalScore / sessions.length) : 0;

  return (
    <div className="landing">
      <section className="hero-section">
        <div className="hero-badge">⚡ Powered by Claude AI</div>
        <h1 className="hero-title">
          Ace your next<br /><span className="hl">tech interview</span>
        </h1>
        <p className="hero-sub">
          AI-powered mock interviews for SDE, Data Science, and DevOps roles.<br />
          Get scored, get feedback, get hired.
        </p>
        <div className="hero-btns">
          <button className="btn btn-primary btn-lg" onClick={onStart}>⚡ Start interview</button>
        </div>
        <div className="company-strip">
          <p className="company-label">Prepares you for interviews at</p>
          <div className="company-list">
            {COMPANIES.map(c => <span key={c} className="company-chip">{c}</span>)}
          </div>
        </div>
      </section>

      {sessions.length > 0 && (
        <section className="stats-section">
          <div className="stats-grid" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="stat-box"><div className="lbl">Sessions done</div><div className="val">{sessions.length}</div><div className="sub">all time</div></div>
            <div className="stat-box"><div className="lbl">Avg score</div><div className="val">{avgScore}%</div><div className="sub">across all tracks</div></div>
            <div className="stat-box"><div className="lbl">Last track</div><div className="val" style={{ fontSize: 16, marginTop: 4 }}>{sessions[0]?.track || '—'}</div><div className="sub">{sessions[0]?.date || ''}</div></div>
          </div>
        </section>
      )}

      <section className="tracks-section">
        <h2 className="section-title">4 interview tracks</h2>
        <p className="section-sub">Built specifically for CS students with Data Science and DevOps minors</p>
        <div className="tracks-grid">
          {TRACKS.map(t => (
            <div key={t.id} className={`track-card track-${t.color}`} onClick={onStart}>
              <div className="track-icon">{t.icon}</div>
              <h3>{t.label}</h3>
              <p>{t.desc}</p>
              <div className="track-cta">Start →</div>
            </div>
          ))}
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">Why MockMate</h2>
        <div className="features-grid">
          {[
            { icon: '🎤', title: 'Voice answers', desc: 'Answer using your mic — Web Speech API transcribes in real time.' },
            { icon: '🤖', title: 'AI evaluation', desc: 'Claude scores each answer and gives specific, actionable feedback.' },
            { icon: '📈', title: 'Track progress', desc: 'Every session saved locally so you can see your improvement over time.' },
            { icon: '🎯', title: 'Domain-specific', desc: 'Questions tailored to SDE, Data Science ML, and DevOps topics.' },
            { icon: '💡', title: 'Ideal answers', desc: 'See model answers after every question to learn what good looks like.' },
            { icon: '📋', title: 'Full report card', desc: 'Interview readiness verdict with strengths, gaps, and study priorities.' },
          ].map(f => (
            <div key={f.title} className="feat-card">
              <div className="feat-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
