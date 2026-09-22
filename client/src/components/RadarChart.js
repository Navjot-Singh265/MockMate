import './RadarChart.css';

const DIMENSIONS = [
  { key: 'technical_accuracy', label: 'Technical\nAccuracy' },
  { key: 'communication_clarity', label: 'Clarity' },
  { key: 'depth_of_explanation', label: 'Depth' },
  { key: 'relevance_to_question', label: 'Relevance' },
  { key: 'confidence_in_tone', label: 'Confidence' },
];

function polarToXY(angle, radius, cx, cy) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export default function RadarChart({ scores, similarity }) {
  const cx = 160, cy = 160, maxR = 110, levels = 5;

  // Build polygon points from scores
  const points = DIMENSIONS.map((d, i) => {
    const angle = (360 / DIMENSIONS.length) * i;
    const val = (scores[d.key] || 0) / 10;
    const r = val * maxR;
    return polarToXY(angle, r, cx, cy);
  });

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Grid circles
  const gridLevels = Array.from({ length: levels }, (_, i) => ((i + 1) / levels) * maxR);

  // Axis lines and labels
  const axes = DIMENSIONS.map((d, i) => {
    const angle = (360 / DIMENSIONS.length) * i;
    const outer = polarToXY(angle, maxR, cx, cy);
    const labelPos = polarToXY(angle, maxR + 28, cx, cy);
    return { ...d, angle, outer, labelPos };
  });

  const overall = scores.overall || Math.round(
    DIMENSIONS.reduce((sum, d) => sum + (scores[d.key] || 0), 0) / DIMENSIONS.length
  );

  const tierColor = overall >= 7 ? '#34d399' : overall >= 5 ? '#fbbf24' : '#f87171';

  return (
    <div className="radar-wrap">
      <div className="radar-title">Answer quality analysis</div>
      <div className="radar-body">
        <svg width="320" height="320" viewBox="0 0 320 320">
          {/* Grid */}
          {gridLevels.map((r, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          ))}

          {/* Axis lines */}
          {axes.map((ax, i) => (
            <line key={i} x1={cx} y1={cy} x2={ax.outer.x} y2={ax.outer.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          ))}

          {/* Score polygon */}
          <polygon
            points={polygonPoints}
            fill="rgba(124,111,238,0.25)"
            stroke="#7c6fee"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Score dots */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#7c6fee" stroke="#0a0a0c" strokeWidth="1.5" />
          ))}

          {/* Center score */}
          <circle cx={cx} cy={cy} r="28" fill="var(--surface2)" stroke={tierColor} strokeWidth="2" />
          <text x={cx} y={cy - 4} textAnchor="middle" fill={tierColor} fontSize="18" fontFamily="Space Grotesk" fontWeight="700">{overall}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10">/10</text>

          {/* Axis labels */}
          {axes.map((ax, i) => {
            const lines = ax.label.split('\n');
            return (
              <text key={i} x={ax.labelPos.x} y={ax.labelPos.y - (lines.length - 1) * 6} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="11" fontFamily="Inter">
                {lines.map((line, j) => (
                  <tspan key={j} x={ax.labelPos.x} dy={j === 0 ? 0 : 13}>{line}</tspan>
                ))}
              </text>
            );
          })}
        </svg>

        <div className="radar-scores">
          {DIMENSIONS.map(d => {
            const val = scores[d.key] || 0;
            const tier = val >= 7 ? 'high' : val >= 5 ? 'mid' : 'low';
            return (
              <div key={d.key} className="radar-score-row">
                <span className="rsr-label">{d.label.replace('\n', ' ')}</span>
                <div className="rsr-bar-wrap">
                  <div className={`rsr-bar rsr-${tier}`} style={{ width: `${val * 10}%` }} />
                </div>
                <span className={`rsr-val rsr-val-${tier}`}>{val}/10</span>
              </div>
            );
          })}

          {similarity !== undefined && (
            <div className="similarity-row">
              <div className="sim-header">
                <span className="sim-label">🧠 Semantic similarity</span>
                <span className="sim-badge">{Math.round(similarity * 100)}%</span>
              </div>
              <div className="sim-desc">Cosine similarity vs ideal answer · sentence-transformers</div>
              <div className="rsr-bar-wrap" style={{ marginTop: 6 }}>
                <div className={`rsr-bar rsr-${similarity >= 0.75 ? 'high' : similarity >= 0.55 ? 'mid' : 'low'}`}
                  style={{ width: `${similarity * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
