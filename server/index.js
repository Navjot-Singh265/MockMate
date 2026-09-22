require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-20b';
// ─── HELPER ──────────────────────────────────────────────
async function askGroq(prompt, maxTokens = 1200) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Groq API error');
  }
  const data = await res.json();
  return data.choices[0].message.content.replace(/```json|```/g, '').trim();
}

const TRACKS = {
  sde: { label: 'SDE / DSA', topics: 'Arrays, Trees, Graphs, Dynamic Programming, OOP, System Design, Recursion, Sorting' },
  datascience: { label: 'Data Science & ML', topics: 'ML Algorithms, Statistics, Pandas, NumPy, Model Evaluation, Deep Learning, Feature Engineering, NLP, SQL Analytics' },
  devops: { label: 'DevOps & Cloud', topics: 'Docker, Kubernetes, CI/CD Pipelines, AWS, Linux, Git, Monitoring, Networking, Infrastructure as Code' },
  hr: { label: 'HR / Behavioral', topics: 'Teamwork, Leadership, STAR Method, Career Goals, Conflict Resolution, Problem Solving' }
};

// ─── ROUTES ──────────────────────────────────────────────

app.get('/api/health', (req, res) => res.json({ status: 'ok', model: MODEL, provider: 'Groq (free)' }));
app.get('/api/tracks', (req, res) => res.json(TRACKS));

// Generate questions
app.post('/api/questions', async (req, res) => {
  try {
    const { track, difficulty, numQuestions = 5 } = req.body;
    if (!TRACKS[track]) return res.status(400).json({ error: 'Invalid track' });
    const t = TRACKS[track];

    const text = await askGroq(`You are a senior interviewer at a top tech company in India.
Generate exactly ${numQuestions} ${difficulty} level interview questions for ${t.label}.
Topics: ${t.topics}

Respond ONLY with a valid JSON array, no extra text:
[{
  "question": "...",
  "category": "...",
  "type": "Conceptual|Practical|Scenario|Coding",
  "hasCoding": false,
  "tip": "what an ideal answer includes in 1 sentence",
  "followUp": "natural follow-up question",
  "codeStarter": "",
  "expectedOutput": ""
}]`);

    res.json({ questions: JSON.parse(text), track: t.label });
  } catch (err) {
    console.error('Questions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Evaluate answer (streaming via Groq)
app.post('/api/evaluate/stream', async (req, res) => {
  try {
    const { question, answer, code, category, tip, track, difficulty, hasCoding } = req.body;
    if (!question || (!answer && !code)) return res.status(400).json({ error: 'Question and answer required' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const codeSection = hasCoding && code ? `\nCandidate Code:\n${code}` : '';
    const prompt = `You are a senior ${track} interviewer at a top Indian tech company.
Evaluate this ${difficulty} answer.

Question: ${question}
Category: ${category}
Ideal answer should include: ${tip}
Candidate answer: ${answer || '(none)'}${codeSection}

Respond ONLY with valid JSON (no markdown):
{
  "score": <1-10>,
  "verdict": "<3-4 words>",
  "good": "<what they got right, 1-2 sentences>",
  "missing": "<what was missing, 1-2 sentences>",
  "modelAnswer": "<ideal answer in 3-4 sentences>",
  "resources": ["<topic 1>", "<topic 2>"]
}`;

    // Groq streaming
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        temperature: 0.7
      })
    });

    if (!groqRes.ok) {
      const err = await groqRes.json();
      res.write(`data: ${JSON.stringify({ error: err.error?.message })}\n\n`);
      res.end();
      return;
    }

    const reader = groqRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const chunk = parsed.choices?.[0]?.delta?.content || '';
          if (chunk) {
            fullText += chunk;
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
          }
        } catch {}
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Stream error:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// Evaluate (non-streaming fallback)
app.post('/api/evaluate', async (req, res) => {
  try {
    const { question, answer, code, category, tip, track, difficulty, hasCoding } = req.body;
    const codeSection = hasCoding && code ? `\nCode:\n${code}` : '';
    const text = await askGroq(`You are a senior ${track} interviewer. Evaluate this ${difficulty} answer.
Question: ${question} | Category: ${category} | Should include: ${tip}
Answer: ${answer || '(none)'}${codeSection}
Respond ONLY with JSON:
{"score":<1-10>,"verdict":"<3-4 words>","good":"...","missing":"...","modelAnswer":"...","resources":["...","..."]}`);
    res.json(JSON.parse(text));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run JS code safely
app.post('/api/run-code', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'No code provided' });

    if (language !== 'javascript') {
      const result = await askGroq(`Simulate running this ${language} code. Return ONLY the console output, nothing else:
\`\`\`${language}
${code}
\`\`\``, 200);
      return res.json({ output: result, simulated: true });
    }

    const logs = [];
    const mockConsole = {
      log: (...args) => logs.push(args.map(String).join(' ')),
      error: (...args) => logs.push('ERROR: ' + args.join(' ')),
      warn: (...args) => logs.push('WARN: ' + args.join(' '))
    };
    try {
      const fn = new Function('console', code);
      fn(mockConsole);
      res.json({ output: logs.join('\n') || '(no output)', simulated: false });
    } catch (runErr) {
      res.json({ output: `Error: ${runErr.message}`, isError: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate final report
app.post('/api/report', async (req, res) => {
  try {
    const { track, difficulty, results } = req.body;
    const summary = results.map((r, i) => `Q${i+1} [${r.category}]: ${r.score}/10 — ${r.verdict}`).join('\n');
    const text = await askGroq(`You are a senior interviewer giving final feedback after a ${track} (${difficulty}) interview.
Results summary:
${summary}

Respond ONLY with valid JSON:
{
  "overallVerdict": "<2-3 sentences>",
  "strongAreas": ["<area 1>", "<area 2>"],
  "weakAreas": ["<area 1>", "<area 2>"],
  "topPriorities": ["<priority 1>", "<priority 2>", "<priority 3>"],
  "readiness": "<Not ready|Almost ready|Interview ready|Hire>",
  "encouragement": "<1 motivating sentence>"
}`, 600);
    res.json(JSON.parse(text));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RAG proxy routes (Python service)
const RAG_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

app.post('/api/rag/questions', async (req, res) => {
  try {
    const response = await fetch(`${RAG_URL}/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track: req.body.track, difficulty: req.body.difficulty, num_questions: req.body.numQuestions || 5, exclude_ids: req.body.excludeIds || [] })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'RAG error');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'RAG service unavailable' });
  }
});

app.post('/api/rag/similarity', async (req, res) => {
  try {
    const response = await fetch(`${RAG_URL}/similarity`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) });
    res.json(await response.json());
  } catch (err) { res.status(500).json({ error: 'Similarity unavailable' }); }
});

app.post('/api/rag/radar', async (req, res) => {
  try {
    // Use Groq for radar scores instead of Claude
    const { question, answer, category, track, difficulty } = req.body;
    const text = await askGroq(`You are an expert ${track} interviewer. Score this ${difficulty} answer on 5 dimensions.
Question: ${question}
Category: ${category}
Answer: ${answer}

Respond ONLY with valid JSON (numbers 1-10):
{
  "technical_accuracy": <1-10>,
  "communication_clarity": <1-10>,
  "depth_of_explanation": <1-10>,
  "relevance_to_question": <1-10>,
  "confidence_in_tone": <1-10>,
  "overall": <1-10>
}`, 200);
    res.json(JSON.parse(text));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

app.listen(PORT, () => {
  console.log(`✅ MockMate server running on http://localhost:${PORT}`);
  console.log(`🤖 Using Groq (${MODEL}) — FREE!`);
  console.log(`🔑 API Key: ${GROQ_API_KEY ? '✅ Found' : '❌ Missing — add GROQ_API_KEY to .env'}`);
});