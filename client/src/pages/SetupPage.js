import { useState } from 'react';
import { generateQuestions, ragRetrieveQuestions } from '../api';
import './SetupPage.css';

const TRACKS = [
  { id: 'sde', icon: '💻', label: 'SDE / DSA', color: 'accent', topics: 'Arrays · Trees · DP · System Design · OOP · Complexity' },
  { id: 'datascience', icon: '📊', label: 'Data Science & ML', color: 'blue', topics: 'ML Algorithms · Statistics · Pandas · Model Evaluation · Deep Learning · NLP · RAG' },
  { id: 'devops', icon: '🚀', label: 'DevOps & Cloud', color: 'orange', topics: 'Docker · Kubernetes · CI/CD · AWS · Linux · Git · IaC · Networking' },
  { id: 'hr', icon: '🤝', label: 'HR / Behavioral', color: 'green', topics: 'STAR Method · Teamwork · Leadership · Career Goals · Conflict Resolution' },
];

const DIFFICULTIES = [
  { id: 'Beginner', desc: 'Conceptual basics, definitions, simple scenarios' },
  { id: 'Intermediate', desc: 'Applied questions, trade-offs, real-world usage' },
  { id: 'Advanced', desc: 'Deep dives, edge cases, system-level thinking' },
];

const Q_COUNTS = [3, 5, 7];

export default function SetupPage({ onBegin, onBack }) {
  const [track, setTrack] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [numQ, setNumQ] = useState(5);
  const [useRAG, setUseRAG] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ragStatus, setRagStatus] = useState('');

  const handleStart = async () => {
    setError(''); setRagStatus('');
    if (!track) { setError('Please choose an interview track.'); return; }
    setLoading(true);

    try {
      let data;
      if (useRAG) {
        setRagStatus('🧠 Retrieving real company questions via RAG...');
        try {
          data = await ragRetrieveQuestions(track, difficulty, numQ);
          setRagStatus(`✅ Retrieved ${data.retrieved_count} real questions using ${data.embedding_model}`);
          // Small delay to show status
          await new Promise(r => setTimeout(r, 800));
        } catch (ragErr) {
          setRagStatus('⚠️ RAG service offline — using AI-generated questions');
          await new Promise(r => setTimeout(r, 600));
          data = await generateQuestions(track, difficulty, numQ);
        }
      } else {
        data = await generateQuestions(track, difficulty, numQ);
      }

      const trackInfo = TRACKS.find(t => t.id === track);
      onBegin({
        track,
        trackLabel: data.track || trackInfo?.label || track,
        difficulty,
        questions: data.questions,
        numQ,
        usedRAG: useRAG,
        embeddingModel: data.embedding_model
      });
    } catch (err) {
      setError(err.message.includes('fetch') ? 'Cannot connect to server. Make sure backend is running on port 5000.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="setup-header">
        <button className="btn btn-outline btn-sm" onClick={onBack}>← Back</button>
        <div>
          <h1 className="setup-title">Set up your interview</h1>
          <p className="setup-sub">Choose your track, difficulty, and interview mode</p>
        </div>
      </div>

      <div className="setup-section">
        <div className="setup-label">1. Choose interview track</div>
        <div className="track-grid">
          {TRACKS.map(t => (
            <div key={t.id} className={`setup-track-card track-${t.color} ${track === t.id ? 'selected' : ''}`} onClick={() => setTrack(t.id)}>
              <div className="stc-top">
                <span className="stc-icon">{t.icon}</span>
                <span className="stc-label">{t.label}</span>
                {track === t.id && <span className="stc-check">✓</span>}
              </div>
              <p className="stc-topics">{t.topics}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="setup-section">
        <div className="setup-label">2. Difficulty level</div>
        <div className="diff-grid">
          {DIFFICULTIES.map(d => (
            <div key={d.id} className={`diff-card ${difficulty === d.id ? 'selected' : ''}`} onClick={() => setDifficulty(d.id)}>
              <div className="diff-name">{d.id}</div>
              <div className="diff-desc">{d.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="setup-section">
        <div className="setup-label">3. Number of questions</div>
        <div className="qcount-row">
          {Q_COUNTS.map(n => (
            <button key={n} className={`qcount-btn ${numQ === n ? 'selected' : ''}`} onClick={() => setNumQ(n)}>
              {n} questions
            </button>
          ))}
        </div>
      </div>

      <div className="setup-section">
        <div className="setup-label">4. Interview mode</div>
        <div className="mode-grid">
          <div className={`mode-card ${useRAG ? 'selected' : ''}`} onClick={() => setUseRAG(true)}>
            <div className="mode-top">
              <span className="mode-icon">🧠</span>
              <span className="mode-name">RAG Mode</span>
              {useRAG && <span className="mode-check">✓</span>}
              <span className="mode-badge">Recommended</span>
            </div>
            <p className="mode-desc">Real questions from Google, Amazon, Microsoft retrieved via semantic search on ChromaDB vector database using sentence embeddings.</p>
            <div className="mode-tags">
              <span className="mtag">ChromaDB</span>
              <span className="mtag">Sentence Transformers</span>
              <span className="mtag">Cosine Similarity</span>
            </div>
          </div>
          <div className={`mode-card ${!useRAG ? 'selected' : ''}`} onClick={() => setUseRAG(false)}>
            <div className="mode-top">
              <span className="mode-icon">✨</span>
              <span className="mode-name">AI Generated</span>
              {!useRAG && <span className="mode-check">✓</span>}
            </div>
            <p className="mode-desc">Claude generates fresh questions tailored to your profile. More variety, no vector DB required.</p>
            <div className="mode-tags">
              <span className="mtag">Claude API</span>
              <span className="mtag">Dynamic</span>
            </div>
          </div>
        </div>
      </div>

      {ragStatus && (
        <div className="rag-status">
          <div className="rag-pulse" />
          <span>{ragStatus}</span>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}
      {loading && !ragStatus && (
        <div className="loading-row">
          <div className="spinner spinner-lg" />
          <p>Preparing your interview questions...</p>
        </div>
      )}

      <div className="btn-row" style={{ marginTop: '1.5rem' }}>
        <button className="btn btn-primary btn-lg" onClick={handleStart} disabled={loading}>
          {loading ? 'Preparing...' : '⚡ Start interview'}
        </button>
      </div>
    </div>
  );
}
