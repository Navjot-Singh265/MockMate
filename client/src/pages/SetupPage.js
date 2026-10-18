import { useState } from 'react';
import { generateQuestions, ragRetrieveQuestions } from '../api';
import './SetupPage.css';

const TRACKS = [
  { id: 'sde', icon: '💻', label: 'SDE / DSA', color: 'accent', topics: 'Arrays · Trees · Graphs · Dynamic Programming · System Design · OOP · Complexity Analysis' },
  { id: 'datascience', icon: '📊', label: 'Data Science & ML', color: 'blue', topics: 'ML Algorithms · Statistics · Pandas · Model Evaluation · Deep Learning · NLP · RAG · Vector Databases' },
  { id: 'devops', icon: '🚀', label: 'DevOps & Cloud', color: 'orange', topics: 'Docker · Kubernetes · CI/CD · AWS · Linux · Git · Monitoring · Infrastructure as Code' },
  { id: 'hr', icon: '🤝', label: 'HR / Behavioral', color: 'green', topics: 'STAR Method · Teamwork · Leadership · Career Goals · Conflict Resolution · Communication' },
];

const DIFFICULTIES = [
  { id: 'Beginner', emoji: '🌱', desc: 'Fundamental concepts, definitions, and simple scenarios. Ideal for first-round screening.' },
  { id: 'Intermediate', emoji: '⚡', desc: 'Applied questions, trade-offs, and real-world usage. Suitable for most campus interviews.' },
  { id: 'Advanced', emoji: '🔥', desc: 'Deep dives, edge cases, and system-level thinking. Targets senior and product company rounds.' },
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
    if (!track) { setError('Please select an interview track to continue.'); return; }
    setLoading(true);
    try {
      let data;
      if (useRAG) {
        setRagStatus('Retrieving questions from vector database...');
        try {
          data = await ragRetrieveQuestions(track, difficulty, numQ);
          setRagStatus(`${data.retrieved_count} questions retrieved via semantic search`);
          await new Promise(r => setTimeout(r, 700));
        } catch {
          setRagStatus('Vector database offline — generating questions with AI');
          await new Promise(r => setTimeout(r, 500));
          data = await generateQuestions(track, difficulty, numQ);
        }
      } else {
        data = await generateQuestions(track, difficulty, numQ);
      }
      const trackInfo = TRACKS.find(t => t.id === track);
      onBegin({ track, trackLabel: data.track || trackInfo?.label || track, difficulty, questions: data.questions, numQ, usedRAG: useRAG, embeddingModel: data.embedding_model });
    } catch (err) {
      setError(err.message.includes('fetch') ? 'Unable to connect to server. Please ensure the backend is running on port 5000.' : err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="setup-header">
        <button className="btn btn-outline btn-sm" onClick={onBack}>← Back</button>
        <div>
          <h1 className="setup-title">Configure your interview</h1>
          <p className="setup-sub">Select a track, difficulty level, and session length to begin.</p>
        </div>
      </div>

      <div className="setup-section">
        <div class="setup-label">1. Select interview track</div>
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
              <div className="diff-name">{d.emoji} {d.id}</div>
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
        <p className="hint" style={{marginTop:8}}>A 5-question session takes approximately 15–20 minutes.</p>
      </div>

      <div className="setup-section">
        <div className="setup-label">4. Question source</div>
        <div className="mode-grid">
          <div className={`mode-card ${useRAG ? 'selected' : ''}`} onClick={() => setUseRAG(true)}>
            <div className="mode-top">
              <span className="mode-icon">🧠</span>
              <span className="mode-name">RAG Mode</span>
              {useRAG && <span className="mode-check">✓</span>}
              <span className="mode-badge">Recommended</span>
            </div>
            <p className="mode-desc">Retrieves real interview questions from companies like Google, Amazon, and Microsoft using semantic search on a ChromaDB vector database with sentence embeddings.</p>
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
            <p className="mode-desc">Generates fresh questions tailored to your selected track and difficulty using the Groq language model. Offers more variety and does not require the RAG service.</p>
            <div className="mode-tags">
              <span className="mtag">Groq AI</span>
              <span className="mtag">Dynamic generation</span>
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
          <p>Preparing your interview session...</p>
        </div>
      )}

      <div className="btn-row" style={{ marginTop: '1.5rem' }}>
        <button className="btn btn-primary btn-lg" onClick={handleStart} disabled={loading}>
          {loading ? 'Preparing session...' : '⚡ Begin interview'}
        </button>
      </div>
    </div>
  );
}
