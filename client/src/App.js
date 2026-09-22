import { useState } from 'react';
import { useHistory } from './hooks/useHistory';
import LandingPage from './pages/LandingPage';
import SetupPage from './pages/SetupPage';
import InterviewPage from './pages/InterviewPage';
import ReportPage from './pages/ReportPage';
import HistoryPage from './pages/HistoryPage';
import './App.css';

export default function App() {
  const [page, setPage] = useState('landing');
  const [config, setConfig] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const { sessions, saveSession, deleteSession } = useHistory();

  const startInterview = (cfg) => { setConfig(cfg); setPage('interview'); };
  const finishInterview = (data) => {
    setSessionData(data);
    saveSession(data);
    setPage('report');
  };

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
            History {sessions.length > 0 && <span className="nav-badge">{sessions.length}</span>}
          </button>
        </div>
        <a className="nav-cta" href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">Get API key →</a>
      </nav>

      <main className="main">
        {page === 'landing' && <LandingPage onStart={() => setPage('setup')} sessions={sessions} />}
        {page === 'setup' && <SetupPage onBegin={startInterview} onBack={() => setPage('landing')} />}
        {page === 'interview' && config && <InterviewPage config={config} onFinish={finishInterview} onQuit={() => setPage('landing')} />}
        {page === 'report' && sessionData && <ReportPage data={sessionData} onRetry={() => setPage('setup')} onHome={() => setPage('landing')} />}
        {page === 'history' && <HistoryPage sessions={sessions} onDelete={deleteSession} onRetry={() => setPage('setup')} />}
      </main>

      <footer className="footer">
        Built with React · Node.js · Claude AI · Web Speech API &nbsp;·&nbsp;
        <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">Get API key</a>
      </footer>
    </div>
  );
}
