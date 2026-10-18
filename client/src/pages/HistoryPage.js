import { useState } from 'react';
import './HistoryPage.css';

function tierOf(s) { return s>=70?'high':s>=50?'mid':'low'; }

export default function HistoryPage({ sessions, onDelete, onRetry, user }) {
  const [expanded, setExpanded] = useState(null);

  if (sessions.length === 0) {
    return (
      <div className="page">
        <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700, marginBottom:'1.25rem', color:'var(--text)' }}>Session History</h1>
        <div className="empty">
          <div className="ei">📋</div>
          <p>No sessions recorded yet.</p>
          <p style={{ marginTop:6, fontSize:13, color:'var(--text-muted)' }}>Complete a mock interview to see your history and track progress over time.</p>
          <div className="btn-row" style={{ justifyContent:'center', marginTop:'1.25rem' }}>
            <button className="btn btn-primary" onClick={onRetry}>Start your first session</button>
          </div>
        </div>
      </div>
    );
  }

  const avgScore = Math.round(sessions.reduce((a,s) => a+(s.totalScore||0),0) / sessions.length);
  const best = Math.max(...sessions.map(s => s.totalScore||0));
  const tracks = [...new Set(sessions.map(s => s.track))];

  return (
    <div className="page">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700, color:'var(--text)' }}>Session History</h1>
          <p style={{ fontSize:14, color:'var(--text-soft)', marginTop:3 }}>
            {user ? `Logged in as @${user.username} · sessions synced to cloud` : 'Sign in with GitHub to sync history across devices'}
          </p>
        </div>
        {!user && (
          <div className="hist-sync-note">
            🔒 Sign in to enable cloud sync
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-box"><div className="lbl">Sessions completed</div><div className="val">{sessions.length}</div><div className="sub">all time</div></div>
        <div className="stat-box"><div className="lbl">Average score</div><div className="val">{avgScore}%</div><div className="sub">across all sessions</div></div>
        <div className="stat-box"><div className="lbl">Best score</div><div className="val">{best}%</div><div className="sub">personal best</div></div>
        <div className="stat-box"><div className="lbl">Tracks covered</div><div className="val">{tracks.length}</div><div className="sub">{tracks.slice(0,2).join(', ')}</div></div>
      </div>

      {sessions.map((s,i) => {
        const tier = tierOf(s.totalScore||0);
        const isExp = expanded === s.id;
        return (
          <div key={s.id} className="hist-card">
            <div className="hist-header">
              <div className={`hist-score ${tier}`}>{s.totalScore||0}%</div>
              <div className="hist-meta" style={{ flex:1 }}>
                <div className="hist-title">
                  {s.track}
                  <span className="badge badge-accent" style={{ fontSize:11, marginLeft:6 }}>{s.difficulty}</span>
                </div>
                <div className="hist-date">{s.date} · {s.results?.length||0} questions answered</div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setExpanded(isExp ? null : s.id)}>
                  {isExp ? 'Collapse' : 'View details'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(s.id)}>Delete</button>
              </div>
            </div>

            {s.report?.readiness && (
              <div className="hist-readiness">Readiness: {s.report.readiness}</div>
            )}

            {isExp && s.results && (
              <div className="hist-expand">
                {s.results.map((r,j) => (
                  <div key={j} className="hist-q-row">
                    <span className="hist-q-num">Q{j+1}</span>
                    <span className="hist-q-text">{s.questions?.[j]?.question?.slice(0,90)}...</span>
                    <span className={`hist-q-score ${r.score>=7?'high':r.score>=5?'mid':'low'}`}>{r.score}/10</span>
                  </div>
                ))}
                {s.report?.topPriorities?.length > 0 && (
                  <div className="hist-priorities">
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text-soft)', marginBottom:6 }}>Recommended study priorities</div>
                    {s.report.topPriorities.map((p,k) => (
                      <div key={k} style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4, paddingLeft:12, position:'relative' }}>
                        <span style={{ position:'absolute', left:0, color:'var(--accent)' }}>·</span>{p}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
