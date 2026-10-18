import './LandingPage.css';

const TRACKS = [
  { id: 'sde', icon: '💻', label: 'SDE / DSA', color: 'accent', desc: 'Arrays, trees, dynamic programming, system design, and object-oriented concepts.' },
  { id: 'datascience', icon: '📊', label: 'Data Science & ML', color: 'blue', desc: 'Machine learning, statistics, pandas, model evaluation, deep learning, and NLP.' },
  { id: 'devops', icon: '🚀', label: 'DevOps & Cloud', color: 'orange', desc: 'Docker, Kubernetes, CI/CD pipelines, AWS, Linux scripting, and infrastructure as code.' },
  { id: 'hr', icon: '🤝', label: 'HR / Behavioral', color: 'green', desc: 'STAR method, leadership, teamwork, conflict resolution, and career goal articulation.' },
];

const COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Flipkart', 'Razorpay', 'Atlassian', 'Publicis Sapient', 'Josh Technology', 'Nagarro', 'Tekion'];

const FEATURES = [
  { icon: '🎤', title: 'Voice Recognition', desc: 'Answer questions using your microphone. MockMate transcribes your speech in real time using the Web Speech API.' },
  { icon: '⚡', title: 'Instant AI Feedback', desc: 'Every answer is evaluated immediately. Get a score out of 10, specific strengths, and exactly what was missing.' },
  { icon: '💻', title: 'Live Code Editor', desc: 'Write and execute code directly inside the interview. Supports JavaScript, Python, Java, and C++.' },
  { icon: '📈', title: 'Progress Tracking', desc: 'All sessions are saved to your account. Track your improvement across tracks and difficulty levels over time.' },
  { icon: '🧠', title: 'RAG-Powered Questions', desc: 'Real interview questions from Google, Amazon, and Microsoft, retrieved via semantic search on a vector database.' },
  { icon: '📋', title: 'Detailed Report Card', desc: 'Receive an interview readiness verdict, strong areas, weak areas, and a prioritised study plan after every session.' },
];

export default function LandingPage({ onStart, sessions, user }) {
  const avgScore = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + (s.totalScore || 0), 0) / sessions.length)
    : 0;

  return (
    <div className="landing">
      <section className="hero-section">
        <div className="hero-badge">⚡ AI-Powered Interview Preparation</div>
        <h1 className="hero-title">
          Prepare smarter.<br />
          <span className="hl">Interview with confidence.</span>
        </h1>
        <p className="hero-sub">
          MockMate simulates real technical interviews using AI — covering SDE, Data Science, and DevOps roles.
          Get scored on every answer, receive instant feedback, and track your readiness over time.
        </p>
        <div className="hero-btns">
          <button className="btn btn-primary btn-lg" onClick={onStart}>
            ⚡ Start a mock interview
          </button>
        </div>

        {user && sessions.length > 0 && (
          <div className="welcome-back">
            <img src={user.avatarUrl} alt={user.username} className="wb-avatar" />
            <div>
              <div className="wb-name">Welcome back, {user.displayName || user.username}</div>
              <div className="wb-stats">{sessions.length} sessions completed · {avgScore}% average score</div>
            </div>
          </div>
        )}

        <div className="company-strip">
          <p className="company-label">Prepares you for interviews at</p>
          <div className="company-list">
            {COMPANIES.map(c => <span key={c} className="company-chip">{c}</span>)}
          </div>
        </div>
      </section>

      <section className="tracks-section">
        <h2 className="section-title">Four interview tracks</h2>
        <p className="section-sub">
          Designed for CS students with specialisations in Data Science and DevOps.
          Each track covers topic areas asked at top product and service companies in India.
        </p>
        <div className="tracks-grid">
          {TRACKS.map(t => (
            <div key={t.id} className={`track-card track-${t.color}`} onClick={onStart}>
              <div className="track-icon">{t.icon}</div>
              <h3>{t.label}</h3>
              <p>{t.desc}</p>
              <div className="track-cta">Start practice →</div>
            </div>
          ))}
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">Everything you need to prepare</h2>
        <p className="section-sub">Built with the tools and techniques used in real AI engineering workflows.</p>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feat-card">
              <div className="feat-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="tech-section">
        <h2 className="section-title">Built with production-grade technology</h2>
        <p className="section-sub">The same stack used by AI engineers at top companies.</p>
        <div className="tech-grid">
          {[
            { label: 'React 18', desc: 'Frontend' },
            { label: 'Node.js + Express', desc: 'Backend' },
            { label: 'Groq AI (LLaMA)', desc: 'Language Model' },
            { label: 'ChromaDB', desc: 'Vector Database' },
            { label: 'Sentence Transformers', desc: 'Embeddings' },
            { label: 'MongoDB Atlas', desc: 'Cloud Database' },
            { label: 'RAG Pipeline', desc: 'Retrieval System' },
            { label: 'Web Speech API', desc: 'Voice Recognition' },
          ].map(t => (
            <div key={t.label} className="tech-chip">
              <div className="tech-label">{t.label}</div>
              <div className="tech-desc">{t.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
