import { useState } from 'react';
import './HistoryPage.css';

function tierOf(s) { return s >= 70 ? 'high' : s >= 50 ? 'mid' : 'low'; }

export default function HistoryPage({ sessions, onDelete, onRetry }) {
  const [expanded, setExpanded] = useState(null);
  if (sessions.length === 0) return (
    <div className="page"><div className="empty"><div className="ei">📋</div><p>No sessions yet. Complete an interview to see your history.</p><div className="btn-row" style={{ justifyContent: 'center', marginTop: '1rem' }}><button className="btn btn-primary" onClick={onRetry}>Start interview</button></div></div></div>
  );

  const avgScore = Math.round(sessions.reduce((a, s) => a + (s.totalScore || 0), 0) / sessions.length);
  const tracks = [...new Set(sessions.map(s => s.track))];

  return (
    <div className="page">
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, marginBottom: '1.25rem' }}>Session history</h1>
      <div className="stats-grid">
        <div className="stat-box"><div className="lbl">Total sessions</div><div className="val">{sessions.length}</div></div>
        <div className="stat-box"><div className="lbl">Avg score</div><div className="val">{avgScore}%</div></div>
        <div className="stat-box"><div className="lbl">Tracks covered</div><div className="val">{tracks.length}</div><div className="sub">{tracks.slice(0,2).join(', ')}</div></div>
      </div>
      {sessions.map((s, i) => {
        const tier = tierOf(s.totalScore || 0);
        const isExp = expanded === s.id;
        return (
          <div key={s.id} className="hist-card">
            <div className="hist-header">
              <div className={`hist-score ${tier}`}>{s.totalScore || 0}%</div>
              <div className="hist-meta">
                <div className="hist-title">{s.track} <span className="badge badge-accent" style={{ fontSize: 11 }}>{s.difficulty}</span></div>
                <div className="hist-date">{s.date} · {s.results?.length || 0} questions</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setExpanded(isExp ? null : s.id)}>{isExp ? 'Collapse' : 'View'}</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(s.id)}>Delete</button>
              </div>
            </div>
            {s.report?.readiness && <div className="hist-readiness">{s.report.readiness}</div>}
            {isExp && s.results && (
              <div className="hist-expand">
                {s.results.map((r, j) => (
                  <div key={j} className="hist-q-row">
                    <span className="hist-q-num">Q{j + 1}</span>
                    <span className="hist-q-text">{s.questions?.[j]?.question?.slice(0, 80)}...</span>
                    <span className={`hist-q-score ${r.score >= 7 ? 'high' : r.score >= 5 ? 'mid' : 'low'}`}>{r.score}/10</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
