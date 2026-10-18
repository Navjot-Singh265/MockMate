import { useState, useEffect } from 'react';
const KEY = 'mockmate_sessions';

export function useHistory() {
  const [history, setHistory] = useState(() => {
    try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(history.slice(0, 30))); } catch {}
  }, [history]);
  const addEntry = (entry) => setHistory(prev => [{ id: Date.now(), date: new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}), ...entry }, ...prev]);
  const deleteEntry = (id) => setHistory(prev => prev.filter(s => s.id !== id));
  return { history, addEntry, deleteEntry };
}
