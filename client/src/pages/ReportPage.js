import './ReportPage.css';

function tierOf(s) { return s >= 7 ? 'high' : s >= 5 ? 'mid' : 'low'; }

function readinessClass(r) {
  if (!r) return '';
  if (r === 'Hire') return 'readiness-hire';
  if (r === 'Interview ready') return 'readiness-ready';
  if (r === 'Almost ready') return 'readiness-almost';
  return 'readiness-not';
}

export default function ReportPage({ data, onRetry, onHome }) {
  const { track, difficulty, questions, results, report } = data;
  const total = results.reduce((a, r) => a + r.score, 0);
  const max = results.length * 10;
  const pct = Math.round((total / max) * 100);
  const tier = tierOf(pct / 10);

  return (
    <div className="page">
      <div className="rp-header">
        <div className="rp-title-row">
          <h1 className="rp-title">Interview Report</h1>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="badge badge-accent">{track}</span>
            <span className="badge" style={{ background: 'var(--surface2)', color: 'var(--text-soft)', border: '1px solid var(--border)' }}>{difficulty}</span>
          </div>
        </div>
      </div>

      <div className="rp-score-hero">
        <div className={`rp-big-score ${tier}`}>
          <div className="rp-num">{total}/{max}</div>
          <div className="rp-pct">{pct}%</div>
        </div>
        <div className="rp-score-info">
          {report?.readiness && (
            <div className={`rp-readiness ${readinessClass(report.readiness)}`}>{report.readiness}</div>
          )}
          {report?.overallVerdict && <p className="rp-overall">{report.overallVerdict}</p>}
          {report?.encouragement && <p className="rp-encourage">"{report.encouragement}"</p>}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-box"><div className="lbl">Score</div><div className="val">{pct}%</div><div className="sub">out of 100</div></div>
        <div className="stat-box"><div className="lbl">Questions</div><div className="val">{results.length}</div><div className="sub">answered</div></div>
        <div className="stat-box"><div className="lbl">Avg score</div><div className="val">{(total / results.length).toFixed(1)}</div><div className="sub">per question</div></div>
        <div className="stat-box"><div className="lbl">Skipped</div><div className="val">{results.filter(r => r.verdict === 'Skipped').length}</div><div className="sub">questions</div></div>
      </div>

      {report && (
        <div className="rp-insights">
          <div className="rp-insight-grid">
            {report.strongAreas?.length > 0 && (
              <div className="rp-insight-box green">
                <div className="ri-title">✓ Strong areas</div>
                <ul>{report.strongAreas.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </div>
            )}
            {report.weakAreas?.length > 0 && (
              <div className="rp-insight-box red">
                <div className="ri-title">⚠ Weak areas</div>
                <ul>{report.weakAreas.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </div>
            )}
          </div>
          {report.topPriorities?.length > 0 && (
            <div className="rp-priorities">
              <div className="ri-title" style={{ marginBottom: 10 }}>🎯 Top study priorities</div>
              {report.topPriorities.map((p, i) => (
                <div key={i} className="priority-item">
                  <span className="priority-num">{i + 1}</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <h2 className="rp-section-title">Question breakdown</h2>
      {results.map((r, i) => (
        <div key={i} className="rp-q-card">
          <div className="rp-q-header">
            <div className="rp-q-left">
              <span className="rp-q-num">Q{i + 1}</span>
              <span className={`badge badge-${r.verdict === 'Skipped' ? 'red' : tierOf(r.score) === 'high' ? 'green' : tierOf(r.score) === 'mid' ? 'yellow' : 'red'}`}>{r.verdict}</span>
              <span className="badge" style={{ background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: 11 }}>{r.category}</span>
            </div>
            <div className={`rp-q-score ${tierOf(r.score)}`}>{r.score}/10</div>
          </div>
          <p className="rp-q-text">{questions[i]?.question}</p>
          {r.verdict !== 'Skipped' && (
            <div className="rp-q-fb">
              {r.missing && <p className="rp-miss">⚠ {r.missing}</p>}
              {r.modelAnswer && <p className="rp-model">💡 {r.modelAnswer}</p>}
            </div>
          )}
        </div>
      ))}

      <div className="btn-row" style={{ marginTop: '2rem', justifyContent: 'center' }}>
        <button className="btn btn-primary btn-lg" onClick={onRetry}>🔁 Try again</button>
        <button className="btn btn-outline btn-lg" onClick={onHome}>Home</button>
      </div>
    </div>
  );
}
