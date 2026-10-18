import { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { useHistory } from './hooks/useHistory';
import { saveSession } from './api';
import LandingPage from './pages/LandingPage';
import SetupPage from './pages/SetupPage';
import InterviewPage from './pages/InterviewPage';
import ReportPage from './pages/ReportPage';
import HistoryPage from './pages/HistoryPage';
import './App.css';

function AppInner() {
  const [page, setPage] = useState('landing');
  const [config, setConfig] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const { user, loading, login, logout } = useAuth();
  const { history, addEntry, deleteEntry } = useHistory();

  const startInterview = (cfg) => { setConfig(cfg); setPage('interview'); };

  const finishInterview = async (data) => {
    setSessionData(data);
    addEntry(data);
    if (user) {
      try {
        await saveSession({ track: data.track, difficulty: data.difficulty, results: data.results, report: data.report, totalScore: data.totalScore, usedRAG: data.usedRAG || false });
      } catch (err) { console.warn('Cloud save failed:', err.message); }
    }
    setPage('report');
  };

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⚡</div>
          <div style={{ color:'var(--text-muted)', fontSize:14 }}>Loading MockMate...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <nav className="topnav">
        <div className="nav-brand" onClick={() => setPage('landing')}>
          <span className="brand-icon">⚡</span>
          <span className="brand-name">Mock<span className="brand-accent">Mate</span></span>
        </div>

        <div className="nav-links">
          <button className={`nav-btn ${page === 'landing' || page === 'setup' ? 'active' : ''}`} onClick={() => setPage('landing')}>Home</button>
          <button className={`nav-btn ${page === 'history' ? 'active' : ''}`} onClick={() => setPage('history')}>
            History {history.length > 0 && <span className="nav-badge">{history.length}</span>}
          </button>
        </div>

        <div className="nav-right">
          {user ? (
            <div className="nav-user">
              <img src={user.avatarUrl} alt={user.username} className="nav-avatar" />
              <span className="nav-username">@{user.username}</span>
              <button className="btn btn-outline btn-sm" onClick={logout}>Sign out</button>
            </div>
          ) : (
            <button className="btn-github" onClick={login}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Sign in with GitHub
            </button>
          )}
        </div>
      </nav>

      <main className="main">
        {page === 'landing' && <LandingPage onStart={() => setPage('setup')} sessions={history} user={user} />}
        {page === 'setup' && <SetupPage onBegin={startInterview} onBack={() => setPage('landing')} />}
        {page === 'interview' && config && <InterviewPage config={config} onFinish={finishInterview} onQuit={() => setPage('landing')} />}
        {page === 'report' && sessionData && <ReportPage data={sessionData} onRetry={() => setPage('setup')} onHome={() => setPage('landing')} />}
        {page === 'history' && <HistoryPage sessions={history} onDelete={deleteEntry} onRetry={() => setPage('setup')} user={user} />}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span>MockMate — AI Interview Simulator</span>
          <span className="footer-dot">·</span>
          <span>Built by <a href="https://github.com/Navjot-Singh265" target="_blank" rel="noopener noreferrer">Navjot Singh</a></span>
          <span className="footer-dot">·</span>
          <span>React · Node.js · Groq AI · RAG · MongoDB</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}
