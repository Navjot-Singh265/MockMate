require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────────



const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://mock-mate-weld.vercel.app',
  'https://mock-mate-git-main-hi-3932.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  }
}));

app.use(express.json());

// ─────────────────────────────────────────────────────────────
// GROQ CONFIG
// ─────────────────────────────────────────────────────────────

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const GROQ_URL =
  'https://api.groq.com/openai/v1/chat/completions';

const MODEL = 'openai/gpt-oss-20b';

// ─────────────────────────────────────────────────────────────
// GROQ HELPER
// ─────────────────────────────────────────────────────────────

async function askGroq(
  prompt,
  maxTokens = 2000,
  responseFormat = null
) {
  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.2
  };

  // Enable JSON mode only when requested
  if (responseFormat) {
    body.response_format = responseFormat;
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`
    },

    body: JSON.stringify(body)
  });

  if (!res.ok) {
    let err;

    try {
      err = await res.json();
    } catch {
      throw new Error(`Groq API error: ${res.status}`);
    }

    throw new Error(
      err.error?.message || 'Groq API error'
    );
  }

  const data = await res.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Groq returned an empty response');
  }

  return data.choices[0].message.content
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
}

// ─────────────────────────────────────────────────────────────
// TRACKS
// ─────────────────────────────────────────────────────────────

const TRACKS = {
  sde: {
    label: 'SDE / DSA',
    topics:
      'Arrays, Trees, Graphs, Dynamic Programming, OOP, System Design, Recursion, Sorting'
  },

  datascience: {
    label: 'Data Science & ML',
    topics:
      'ML Algorithms, Statistics, Pandas, NumPy, Model Evaluation, Deep Learning, Feature Engineering, NLP, SQL Analytics'
  },

  devops: {
    label: 'DevOps & Cloud',
    topics:
      'Docker, Kubernetes, CI/CD Pipelines, AWS, Linux, Git, Monitoring, Networking, Infrastructure as Code'
  },

  hr: {
    label: 'HR / Behavioral',
    topics:
      'Teamwork, Leadership, STAR Method, Career Goals, Conflict Resolution, Problem Solving'
  }
};

// ─────────────────────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    model: MODEL,
    provider: 'Groq (free)'
  });
});

// ─────────────────────────────────────────────────────────────
// TRACKS
// ─────────────────────────────────────────────────────────────

app.get('/api/tracks', (req, res) => {
  res.json(TRACKS);
});

// ─────────────────────────────────────────────────────────────
// GENERATE QUESTIONS
// ─────────────────────────────────────────────────────────────

app.post('/api/questions', async (req, res) => {
  try {
    const {
      track,
      difficulty,
      numQuestions = 5
    } = req.body;

    if (!TRACKS[track]) {
      return res.status(400).json({
        error: 'Invalid track'
      });
    }

    const t = TRACKS[track];

    const questionCount = Number(numQuestions);

    const prompt = `
You are a senior interviewer at a top tech company in India.

Generate exactly ${questionCount} ${difficulty}-level interview questions
for ${t.label}.

Topics:
${t.topics}

IMPORTANT RULES:

1. Generate exactly ${questionCount} questions.
2. Return ONLY valid JSON.
3. Do NOT use markdown.
4. Do NOT use code fences.
5. Do NOT add any text before or after the JSON.
6. Make every string complete.
7. Keep questions concise.
8. Make the questions realistic for technical interviews.

Return this exact JSON structure:

{
  "questions": [
    {
      "question": "string",
      "category": "string",
      "type": "Conceptual",
      "hasCoding": false,
      "tip": "string",
      "followUp": "string",
      "codeStarter": "",
      "expectedOutput": ""
    }
  ]
}

The "type" field MUST be one of:

Conceptual
Practical
Scenario
Coding

For Coding questions:

- hasCoding must be true
- codeStarter should contain starter code
- expectedOutput should contain the expected output

For non-coding questions:

- hasCoding must be false
- codeStarter must be ""
- expectedOutput must be ""

Do not return fewer than ${questionCount} questions.
Do not return more than ${questionCount} questions.
`;

    console.log(
      `🤖 Generating ${questionCount} ${difficulty} questions for ${t.label}...`
    );

    const text = await askGroq(
      prompt,

      // Give enough tokens for multiple detailed questions
      Math.max(3000, questionCount * 600),

      // Force valid JSON object
      {
        type: 'json_object'
      }
    );

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ Groq returned invalid JSON:');
      console.error(text);

      throw new Error(
        `Groq returned invalid JSON: ${parseError.message}`
      );
    }

    if (
      !parsed ||
      !Array.isArray(parsed.questions)
    ) {
      throw new Error(
        'Groq returned invalid format: questions array missing'
      );
    }

    if (parsed.questions.length !== questionCount) {
      console.warn(
        `⚠️ Expected ${questionCount} questions but received ${parsed.questions.length}`
      );
    }

    console.log(
      `✅ Generated ${parsed.questions.length} questions successfully`
    );

    res.json({
      questions: parsed.questions,
      track: t.label
    });

  } catch (err) {
    console.error(
      '❌ Questions error:',
      err.message
    );

    res.status(500).json({
      error: err.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// EVALUATE ANSWER - STREAMING
// ─────────────────────────────────────────────────────────────

app.post('/api/evaluate/stream', async (req, res) => {
  try {
    const {
      question,
      answer,
      code,
      category,
      tip,
      track,
      difficulty,
      hasCoding
    } = req.body;

    if (!question || (!answer && !code)) {
      return res.status(400).json({
        error: 'Question and answer required'
      });
    }

    res.setHeader(
      'Content-Type',
      'text/event-stream'
    );

    res.setHeader(
      'Cache-Control',
      'no-cache'
    );

    res.setHeader(
      'Connection',
      'keep-alive'
    );

    res.flushHeaders();

    const codeSection =
      hasCoding && code
        ? `\nCandidate Code:\n${code}`
        : '';

    const prompt = `
You are a senior ${track} interviewer at a top Indian tech company.

Evaluate this ${difficulty} answer.

Question:
${question}

Category:
${category}

Ideal answer should include:
${tip}

Candidate answer:
${answer || '(none)'}

${codeSection}

Respond ONLY with valid JSON:

{
  "score": 1,
  "verdict": "3-4 words",
  "good": "what they got right in 1-2 sentences",
  "missing": "what was missing in 1-2 sentences",
  "modelAnswer": "ideal answer in 3-4 sentences",
  "resources": ["topic 1", "topic 2"]
}
`;

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`
      },

      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: true,
        temperature: 0.2
      })
    });

    if (!groqRes.ok) {
      const err = await groqRes.json();

      res.write(
        `data: ${JSON.stringify({
          error: err.error?.message || 'Groq error'
        })}\n\n`
      );

      res.end();
      return;
    }

    const reader =
      groqRes.body.getReader();

    const decoder =
      new TextDecoder();

    let buffer = '';

    while (true) {
      const {
        done,
        value
      } = await reader.read();

      if (done) break;

      buffer += decoder.decode(
        value,
        { stream: true }
      );

      const lines =
        buffer.split('\n');

      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) {
          continue;
        }

        const data =
          line.slice(6).trim();

        if (data === '[DONE]') {
          res.write(
            `data: ${JSON.stringify({
              done: true
            })}\n\n`
          );

          res.end();
          return;
        }

        try {
          const parsed =
            JSON.parse(data);

          const chunk =
            parsed.choices?.[0]?.delta?.content ||
            '';

          if (chunk) {
            res.write(
              `data: ${JSON.stringify({
                chunk
              })}\n\n`
            );
          }

        } catch {
          // Ignore malformed stream chunks
        }
      }
    }

    res.write(
      `data: ${JSON.stringify({
        done: true
      })}\n\n`
    );

    res.end();

  } catch (err) {
    console.error(
      '❌ Stream error:',
      err.message
    );

    try {
      res.write(
        `data: ${JSON.stringify({
          error: err.message
        })}\n\n`
      );

      res.end();
    } catch {}
  }
});

// ─────────────────────────────────────────────────────────────
// EVALUATE ANSWER - FALLBACK
// ─────────────────────────────────────────────────────────────

app.post('/api/evaluate', async (req, res) => {
  try {
    const {
      question,
      answer,
      code,
      category,
      tip,
      track,
      difficulty,
      hasCoding
    } = req.body;

    const codeSection =
      hasCoding && code
        ? `\nCode:\n${code}`
        : '';

    const prompt = `
You are a senior ${track} interviewer.

Evaluate this ${difficulty} answer.

Question:
${question}

Category:
${category}

Should include:
${tip}

Answer:
${answer || '(none)'}

${codeSection}

Respond ONLY with valid JSON:

{
  "score": 1,
  "verdict": "3-4 words",
  "good": "what they got right",
  "missing": "what was missing",
  "modelAnswer": "ideal answer",
  "resources": ["topic 1", "topic 2"]
}
`;

    const text = await askGroq(
      prompt,
      1500,
      {
        type: 'json_object'
      }
    );

    res.json(JSON.parse(text));

  } catch (err) {
    console.error(
      '❌ Evaluation error:',
      err.message
    );

    res.status(500).json({
      error: err.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// RUN JS CODE
// ─────────────────────────────────────────────────────────────

app.post('/api/run-code', async (req, res) => {
  try {
    const {
      code,
      language
    } = req.body;

    if (!code) {
      return res.status(400).json({
        error: 'No code provided'
      });
    }

    // Non-JavaScript languages are simulated by Groq
    if (language !== 'javascript') {
      const result = await askGroq(
        `Simulate running this ${language} code.

Return ONLY the console output.
Do not explain anything.

\`\`\`${language}
${code}
\`\`\``,
        500
      );

      return res.json({
        output: result,
        simulated: true
      });
    }

    const logs = [];

    const mockConsole = {
      log: (...args) =>
        logs.push(
          args.map(String).join(' ')
        ),

      error: (...args) =>
        logs.push(
          'ERROR: ' + args.join(' ')
        ),

      warn: (...args) =>
        logs.push(
          'WARN: ' + args.join(' ')
        )
    };

    try {
      const fn =
        new Function(
          'console',
          code
        );

      fn(mockConsole);

      res.json({
        output:
          logs.join('\n') ||
          '(no output)',

        simulated: false
      });

    } catch (runErr) {
      res.json({
        output:
          `Error: ${runErr.message}`,

        isError: true
      });
    }

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// FINAL REPORT
// ─────────────────────────────────────────────────────────────

app.post('/api/report', async (req, res) => {
  try {
    const {
      track,
      difficulty,
      results
    } = req.body;

    const summary = results
      .map(
        (r, i) =>
          `Q${i + 1} [${r.category}]: ${r.score}/10 — ${r.verdict}`
      )
      .join('\n');

    const prompt = `
You are a senior interviewer giving final feedback after a
${track} (${difficulty}) interview.

Results summary:

${summary}

Respond ONLY with valid JSON:

{
  "overallVerdict": "2-3 sentences",
  "strongAreas": ["area 1", "area 2"],
  "weakAreas": ["area 1", "area 2"],
  "topPriorities": [
    "priority 1",
    "priority 2",
    "priority 3"
  ],
  "readiness": "Not ready",
  "encouragement": "1 motivating sentence"
}

The readiness field MUST be one of:

Not ready
Almost ready
Interview ready
Hire
`;

    const text = await askGroq(
      prompt,
      1200,
      {
        type: 'json_object'
      }
    );

    res.json(JSON.parse(text));

  } catch (err) {
    console.error(
      '❌ Report error:',
      err.message
    );

    res.status(500).json({
      error: err.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// RAG SERVICE
// ─────────────────────────────────────────────────────────────

const RAG_URL =
  process.env.RAG_SERVICE_URL ||
  'http://localhost:8000';

/// RAG Questions
app.post('/api/rag/questions', async (req, res) => {
  try {
    const response = await fetch(`${RAG_URL}/retrieve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        track: req.body.track,
        difficulty: req.body.difficulty,
        num_questions: req.body.numQuestions || 5,
        exclude_ids: req.body.excludeIds || []
      })
    });

    const text = await response.text();

    console.log('🔵 RAG status:', response.status);
    console.log('🔵 RAG response:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.detail || data.error || 'RAG service error'
      });
    }

    res.json(data);

  } catch (err) {
    console.error('❌ RAG connection error:', err);
    res.status(500).json({ error: err.message });
  }
});
// RAG Similarity
app.post('/api/rag/similarity', async (req, res) => {
  try {
    const response = await fetch(
      `${RAG_URL}/similarity`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(req.body)
      }
    );

    res.json(
      await response.json()
    );

  } catch (err) {
    res.status(500).json({
      error: 'Similarity unavailable'
    });
  }
});

// RAG Radar
app.post('/api/rag/radar', async (req, res) => {
  try {
    const {
      question,
      answer,
      category,
      track,
      difficulty
    } = req.body;

    const prompt = `
You are an expert ${track} interviewer.

Score this ${difficulty} answer on 5 dimensions.

Question:
${question}

Category:
${category}

Answer:
${answer}

Respond ONLY with valid JSON:

{
  "technical_accuracy": 1,
  "communication_clarity": 1,
  "depth_of_explanation": 1,
  "relevance_to_question": 1,
  "confidence_in_tone": 1,
  "overall": 1
}

Every score must be between 1 and 10.
`;

    const text = await askGroq(
      prompt,
      500,
      {
        type: 'json_object'
      }
    );

    res.json(
      JSON.parse(text)
    );

  } catch (err) {
    console.error(
      '❌ Radar error:',
      err.message
    );

    res.status(500).json({
      error: err.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────────────────────

app.use(
  (err, req, res, next) => {
    console.error(
      '❌ Server error:',
      err.message
    );

    res.status(500).json({
      error: err.message
    });
  }
);

// ─────────────────────────────────────────────────────────────
// MONGODB
// ─────────────────────────────────────────────────────────────

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(
      '✅ MongoDB connected successfully'
    );
  })
  .catch((error) => {
    console.error(
      '❌ MongoDB connection failed:',
      error.message
    );
  });

// ─────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(
    `✅ MockMate server running on http://localhost:${PORT}`
  );

  console.log(
    `🤖 Using Groq (${MODEL}) — FREE!`
  );

  console.log(
    `🔑 API Key: ${
      GROQ_API_KEY
        ? '✅ Found'
        : '❌ Missing — add GROQ_API_KEY to .env'
    }`
  );
});