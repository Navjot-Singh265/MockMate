const BASE = '/api';

const getToken = () => localStorage.getItem('mockmate_token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {})
});

// ─── QUESTIONS ────────────────────────────────────────────
export async function generateQuestions(track, difficulty, numQuestions = 5) {
  const res = await fetch(`${BASE}/questions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ track, difficulty, numQuestions })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to generate questions');
  return data;
}

export async function ragRetrieveQuestions(track, difficulty, numQuestions = 5, excludeIds = []) {
  const res = await fetch(`${BASE}/rag/questions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ track, difficulty, numQuestions, excludeIds })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'RAG retrieval failed');
  return data;
}

// ─── EVALUATE (streaming) ─────────────────────────────────
export async function evaluateStream(payload, onChunk, onDone, onError) {
  try {
    const res = await fetch(`${BASE}/evaluate/stream`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '', fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.chunk) { fullText += data.chunk; onChunk(data.chunk, fullText); }
          if (data.done) {
            try { onDone(JSON.parse(fullText.replace(/```json|```/g, '').trim())); }
            catch { onError('Failed to parse AI response'); }
          }
          if (data.error) onError(data.error);
        } catch {}
      }
    }
  } catch (err) { onError(err.message); }
}

// ─── CODE ─────────────────────────────────────────────────
export async function runCode(code, language) {
  const res = await fetch(`${BASE}/run-code`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ code, language })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to run code');
  return data;
}

// ─── REPORT ───────────────────────────────────────────────
export async function generateReport(track, difficulty, results) {
  const res = await fetch(`${BASE}/report`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ track, difficulty, results })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to generate report');
  return data;
}

// ─── RAG ──────────────────────────────────────────────────
export async function ragRadar(question, answer, category, track, difficulty) {
  const res = await fetch(`${BASE}/rag/radar`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ question, answer, category, track, difficulty })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Radar failed');
  return data;
}

export async function ragSimilarity(candidateAnswer, idealAnswer, question) {
  const res = await fetch(`${BASE}/rag/similarity`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ candidate_answer: candidateAnswer, ideal_answer: idealAnswer, question })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Similarity failed');
  return data;
}

// ─── SESSIONS (cloud) ─────────────────────────────────────
export async function saveSession(sessionData) {
  const res = await fetch(`${BASE}/sessions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(sessionData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save session');
  return data;
}

export async function fetchSessions() {
  const res = await fetch(`${BASE}/sessions`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch sessions');
  return data;
}

export async function deleteSession(id) {
  const res = await fetch(`${BASE}/sessions/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete');
  return data;
}

export async function fetchStats() {
  const res = await fetch(`${BASE}/stats`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch stats');
  return data;
}
