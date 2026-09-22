import { useState, useRef, useCallback, useEffect } from 'react';
import { evaluateStream, runCode, ragRadar, ragSimilarity } from '../api';
import { useVoice } from '../hooks/useVoice';
import RadarChart from '../components/RadarChart';
import './InterviewPage.css';

function tierOf(s) { return s >= 7 ? 'high' : s >= 5 ? 'mid' : 'low'; }

// Simple inline code editor (no external deps needed)
function CodeEditor({ value, onChange, language, readOnly }) {
  return (
    <div className="code-editor-wrap">
      <div className="code-editor-header">
        <span className="code-lang">{language}</span>
        <span className="code-hint">Write your solution below</span>
      </div>
      <textarea
        className="code-textarea"
        value={value}
        onChange={e => !readOnly && onChange(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        placeholder={`// Write your ${language} solution here\n// Think out loud — explain your approach in the text box below`}
      />
    </div>
  );
}

// Animated streaming text
function StreamingText({ text, done }) {
  return (
    <span className={`streaming-text ${done ? 'done' : 'typing'}`}>
      {text}{!done && <span className="cursor">|</span>}
    </span>
  );
}

// Interview timer
function Timer({ seconds, warning }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <div className={`iv-timer ${warning ? 'warning' : ''}`}>
      {m}:{s.toString().padStart(2, '0')}
    </div>
  );
}

export default function InterviewPage({ config, onFinish, onQuit }) {
  const { track, trackLabel, difficulty, questions } = config;
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [code, setCode] = useState('');
  const [codeOutput, setCodeOutput] = useState('');
  const [runningCode, setRunningCode] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [streamText, setStreamText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamDone, setStreamDone] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('answer');
  const [radarScores, setRadarScores] = useState(null);
  const [similarity, setSimilarity] = useState(null);
  const [loadingRadar, setLoadingRadar] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 min per question
  const [timerActive, setTimerActive] = useState(true);
  const [language, setLanguage] = useState('javascript');
  const answerBase = useRef('');
  const timerRef = useRef(null);

  const currentQ = questions[idx];
  const progress = (idx / questions.length) * 100;
  const isLast = idx + 1 >= questions.length;

  // Timer countdown
  useEffect(() => {
    if (!timerActive || phase !== 'answer') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [idx, timerActive, phase]);

  // Reset timer on new question
  useEffect(() => {
    setTimeLeft(120);
    setTimerActive(true);
    if (currentQ?.codeStarter) setCode(currentQ.codeStarter || '');
    else setCode('');
    setCodeOutput('');
    setRadarScores(null);
    setSimilarity(null);
  }, [idx, currentQ]);

  const handleTranscript = useCallback((final, interim) => {
    if (final) { answerBase.current += final; setAnswer(answerBase.current); }
    setInterimText(interim);
  }, []);

  const { isRecording, supported, toggle, stop } = useVoice(handleTranscript);

  const handleRunCode = async () => {
    if (!code.trim()) return;
    setRunningCode(true);
    setCodeOutput('Running...');
    try {
      const result = await runCode(code, language);
      setCodeOutput(result.output + (result.simulated ? '\n(simulated by AI)' : ''));
    } catch (err) {
      setCodeOutput('Error: ' + err.message);
    } finally {
      setRunningCode(false);
    }
  };

  const submitAnswer = async () => {
    stop();
    clearInterval(timerRef.current);
    setTimerActive(false);
    setError('');
    const trimmed = answer.trim();
    const hasCode = currentQ.hasCoding && code.trim().length > 10;
    if (!trimmed && !hasCode) { setError('Write your answer or code before submitting.'); return; }
    if (trimmed.length < 5 && !hasCode) { setError('Answer is too short — explain your approach.'); return; }

    setStreaming(true);
    setStreamText('');
    setStreamDone(false);
    setPhase('feedback');

    evaluateStream(
      { question: currentQ.question, answer: trimmed, code: hasCode ? code : '', category: currentQ.category, tip: currentQ.tip, track: trackLabel, difficulty, hasCoding: currentQ.hasCoding },
      (chunk, full) => setStreamText(full),
      async (parsed) => {
        setFeedback(parsed);
        setStreaming(false);
        setStreamDone(true);
        // Fetch radar scores + similarity in parallel (RAG features)
        setLoadingRadar(true);
        try {
          const [radarData, simData] = await Promise.all([
            ragRadar(currentQ.question, trimmed || code, currentQ.category, trackLabel, difficulty).catch(() => null),
            parsed.modelAnswer ? ragSimilarity(trimmed || code, parsed.modelAnswer, currentQ.question).catch(() => null) : null
          ]);
          if (radarData) setRadarScores(radarData);
          if (simData) setSimilarity(simData.similarity_score);
        } catch {}
        finally { setLoadingRadar(false); }
      },
      (err) => { setError(err); setStreaming(false); setPhase('answer'); }
    );
  };

  const skipQuestion = () => {
    stop(); clearInterval(timerRef.current);
    advance({ question: currentQ.question, category: currentQ.category, answer: '(skipped)', code: '', score: 0, verdict: 'Skipped', good: '—', missing: 'Skipped', modelAnswer: '' });
  };

  const advance = async (result) => {
    const newResults = [...results, result];
    if (isLast) {
      setLoading(true);
      try {
        const { generateReport } = await import('../api');
        const report = await generateReport(trackLabel, difficulty, newResults);
        onFinish({ track: trackLabel, difficulty, questions, results: newResults, report, totalScore: Math.round(newResults.reduce((a,r)=>a+r.score,0)/newResults.length*10) });
      } catch {
        onFinish({ track: trackLabel, difficulty, questions, results: newResults, report: null, totalScore: 0 });
      } finally { setLoading(false); }
    } else {
      setResults(newResults); setIdx(idx+1);
      setAnswer(''); answerBase.current = '';
      setFeedback(null); setStreamText(''); setStreamDone(false);
      setPhase('answer'); setError(''); setCodeOutput('');
    }
  };

  return (
    <div className="page">
      <div className="iv-topbar">
        <div className="iv-meta">
          <span className="badge badge-accent">{trackLabel}</span>
          <span className="badge" style={{background:'var(--surface2)',color:'var(--text-soft)',border:'1px solid var(--border)'}}>{difficulty}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {phase === 'answer' && <Timer seconds={timeLeft} warning={timeLeft < 30} />}
          <button className="btn btn-outline btn-sm" onClick={()=>{if(window.confirm('Quit?')){stop();onQuit();}}}>Quit</button>
        </div>
      </div>

      <div className="progress-track" style={{marginBottom:'1.5rem'}}>
        <div className="progress-fill" style={{width:progress+'%'}} />
      </div>

      <div className="iv-qheader">
        <span className="iv-qnum">Question {idx+1} / {questions.length}</span>
        <div style={{display:'flex',gap:6}}>
          <span className="badge badge-accent">{currentQ.category}</span>
          <span className={`badge badge-${currentQ.type==='Coding'?'orange':currentQ.type==='Practical'?'blue':'accent'}`}>{currentQ.type}</span>
          {currentQ.hasCoding && <span className="badge badge-orange">💻 Code required</span>}
        </div>
      </div>

      <div className="question-card">
        <p className="question-text">{currentQ.question}</p>
        {currentQ.hasCoding && currentQ.expectedOutput && (
          <div className="expected-output">
            <span className="eo-label">Expected output example:</span>
            <code>{currentQ.expectedOutput}</code>
          </div>
        )}
      </div>

      {phase === 'answer' && (
        <>
          {currentQ.hasCoding && (
            <div className="coding-section">
              <div className="lang-row">
                <span className="lang-label">Language:</span>
                {['javascript','python','java','c++'].map(l => (
                  <button key={l} className={`lang-btn ${language===l?'active':''}`} onClick={()=>setLanguage(l)}>{l}</button>
                ))}
              </div>
              <CodeEditor value={code} onChange={setCode} language={language} />
              <div className="run-row">
                <button className="btn btn-success btn-sm" onClick={handleRunCode} disabled={runningCode}>
                  {runningCode ? '⏳ Running...' : '▶ Run code'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={()=>setCode(currentQ.codeStarter||'')}>Reset</button>
              </div>
              {codeOutput && (
                <div className="code-output">
                  <div className="co-label">Output:</div>
                  <pre>{codeOutput}</pre>
                </div>
              )}
              <div className="explain-label">Explain your approach (optional but recommended):</div>
            </div>
          )}

          <div className="answer-toolbar">
            {supported && (
              <button className={`voice-btn ${isRecording?'recording':''}`} onClick={toggle}>
                {isRecording ? <><span className="rec-dot"/> Stop recording</> : <>🎤 Use voice</>}
              </button>
            )}
            {interimText && <span className="interim-text">...{interimText}</span>}
          </div>

          <textarea
            className="input textarea"
            value={answer + (interimText ? ' '+interimText : '')}
            onChange={e=>{setAnswer(e.target.value);answerBase.current=e.target.value;}}
            placeholder={currentQ.hasCoding ? "Explain your approach, time complexity, and reasoning..." : "Type your answer. Be detailed — explain your reasoning step by step."}
            rows={currentQ.hasCoding ? 4 : 6}
          />

          {error && <div className="error-msg">{error}</div>}

          <div className="btn-row" style={{marginTop:'1rem'}}>
            <button className="btn btn-primary" onClick={submitAnswer} disabled={loading}>
              ⚡ Submit answer
            </button>
            <button className="btn btn-outline" onClick={skipQuestion}>Skip</button>
          </div>
        </>
      )}

      {phase === 'feedback' && (
        <div className="feedback-section">
          {streaming && !streamDone && (
            <div className="streaming-box">
              <div className="streaming-header">
                <div className="streaming-dot" /><span>Claude is evaluating...</span>
              </div>
              <div className="streaming-preview">
                <StreamingText text={streamText.slice(0, 200)} done={false} />
              </div>
            </div>
          )}

          {feedback && streamDone && (
            <>
              <div className="fb-score-row">
                <div className={`score-ring ${tierOf(feedback.score)}`}>
                  <span className="num">{feedback.score}</span>
                  <span className="sub">/10</span>
                </div>
                <div className="fb-verdict-col">
                  <div className="fb-verdict">{feedback.verdict}</div>
                  <div className="fb-cat">{currentQ.category}</div>
                </div>
              </div>

              <div className="fb-grid">
                <div className="fb-box fb-good">
                  <div className="fb-box-title">✓ What you got right</div>
                  <p>{feedback.good}</p>
                </div>
                <div className="fb-box fb-miss">
                  <div className="fb-box-title">⚠ What was missing</div>
                  <p>{feedback.missing}</p>
                </div>
              </div>

              {feedback.codeReview && (
                <div className="fb-code-review">
                  <div className="fb-box-title">💻 Code review</div>
                  <p>{feedback.codeReview}</p>
                </div>
              )}

              <div className="fb-model">
                <div className="fb-box-title">💡 Ideal answer</div>
                <p>{feedback.modelAnswer}</p>
              </div>

              {currentQ.followUp && (
                <div className="fb-followup">
                  <span className="fu-label">Follow-up:</span>
                  <span className="fu-q">"{currentQ.followUp}"</span>
                </div>
              )}

              {/* Company tag if from RAG */}
              {currentQ.company && currentQ.company !== 'All companies' && (
                <div className="fb-company-tag">
                  <span className="fct-label">📍 This question was asked at</span>
                  <span className="fct-company">{currentQ.company}</span>
                  <span className="fct-year">{currentQ.year}</span>
                </div>
              )}

              {/* Radar chart + semantic similarity */}
              {loadingRadar && (
                <div className="loading-row" style={{marginTop:'0.75rem'}}>
                  <div className="spinner"/>
                  <p>Computing AI quality scores + semantic similarity...</p>
                </div>
              )}
              {radarScores && !loadingRadar && (
                <RadarChart scores={radarScores} similarity={similarity} />
              )}

              {feedback.resources?.length > 0 && (
                <div className="fb-resources">
                  <div className="fb-box-title" style={{marginBottom:6}}>📚 Study these</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {feedback.resources.map((r,i)=><span key={i} className="badge badge-accent">{r}</span>)}
                  </div>
                </div>
              )}

              {loading && <div className="loading-row" style={{marginTop:'1rem'}}><div className="spinner"/><p>Generating your final report...</p></div>}

              <div className="btn-row" style={{marginTop:'1.25rem'}}>
                <button className="btn btn-primary" onClick={()=>advance({...feedback,question:currentQ.question,category:currentQ.category,answer,code})} disabled={loading}>
                  {isLast ? '📋 View report' : 'Next question →'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="iv-dots">
        {questions.map((_,i) => (
          <div key={i} className={`iv-dot ${i<idx?'done':i===idx?'current':''}`} />
        ))}
      </div>
    </div>
  );
}
