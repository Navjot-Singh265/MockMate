import { useState, useEffect } from 'react';
const KEY = 'mockmate_sessions';

export function useHistory() {
  const [sessions, setSessions] = useState(() => {
    try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(sessions.slice(0, 20))); } catch {}
  }, [sessions]);

  const saveSession = (session) => setSessions(prev => [{ id: Date.now(), date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), ...session }, ...prev]);
  const deleteSession = (id) => setSessions(prev => prev.filter(s => s.id !== id));

  return { sessions, saveSession, deleteSession };
}
