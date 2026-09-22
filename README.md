# ⚡ MockMate — AI Interview Simulator

> **React + Node.js + Express + Claude AI + Web Speech API**

An AI-powered technical interview simulator built for CS students with Data Science and DevOps skills. Practice real interview questions, get scored per answer, and receive a full report card with study priorities.

---

## 🎯 Interview Tracks

| Track | Topics Covered |
|---|---|
| **SDE / DSA** | Arrays, Trees, DP, System Design, OOP, Complexity |
| **Data Science & ML** | ML Algorithms, Statistics, Pandas, Model Evaluation, Deep Learning, NLP |
| **DevOps & Cloud** | Docker, Kubernetes, CI/CD, AWS, Linux, Git, IaC, Networking |
| **HR / Behavioral** | STAR Method, Teamwork, Leadership, Career Goals |

## ✨ Features

- 🎤 **Voice answers** — Web Speech API transcribes your spoken answers in real time
- 🤖 **AI evaluation** — Claude scores each answer out of 10 with specific feedback
- 💡 **Ideal answers** — See the model answer after every question
- 🔄 **Follow-up questions** — Simulates real interview flow
- 📋 **Full report card** — Interview readiness verdict with strengths, gaps, and study priorities
- 📈 **Session history** — All past interviews saved locally to track progress
- 🎯 **3 difficulty levels** — Beginner, Intermediate, Advanced
- 📊 **3, 5, or 7 questions** — Choose your session length

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, CSS Variables, Custom Hooks |
| Backend | Node.js, Express |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Voice | Web Speech API (browser-native, free) |
| State | React hooks + localStorage |
| Deployment | Vercel (frontend) + Railway (backend) |

## 📁 Project Structure

```
mockmate/
├── client/                    # React frontend
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.js   # Hero + track overview
│       │   ├── SetupPage.js     # Track/difficulty/count picker
│       │   ├── InterviewPage.js # Live interview + voice + feedback
│       │   ├── ReportPage.js    # Full report card
│       │   └── HistoryPage.js   # Past sessions
│       ├── hooks/
│       │   ├── useVoice.js      # Web Speech API hook
│       │   └── useHistory.js    # localStorage hook
│       ├── api.js               # All backend API calls
│       └── App.js               # Root + routing
│
├── server/                    # Node.js + Express backend
│   └── index.js               # /api/questions, /api/evaluate, /api/report
│
└── package.json               # Root scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key — [console.anthropic.com](https://console.anthropic.com)

### Install & Run

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/mockmate.git
cd mockmate

# 2. Install all dependencies (root + client + server)
npm run install:all

# 3. Set up API key
cd server
cp .env.example .env
# Edit .env → add your ANTHROPIC_API_KEY

# 4. Run both frontend and backend
cd ..
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| POST | `/api/questions` | Generate interview questions |
| POST | `/api/evaluate` | Evaluate a single answer |
| POST | `/api/report` | Generate overall interview report |

## 🌐 Deployment

**Frontend → Vercel**
```bash
cd client && npm run build
# Deploy build/ to Vercel
```

**Backend → Railway**
1. Push to GitHub
2. Connect Railway to repo
3. Set `ANTHROPIC_API_KEY` environment variable
4. Deploy — Railway auto-detects Node.js

---

## 📄 Resume Bullet

> **MockMate** | React · Node.js · Express · Claude API · Web Speech API
> Full-stack AI interview simulator with 4 domain tracks (SDE, Data Science, DevOps, HR), voice recognition, per-answer scoring, follow-up questions, and a detailed report card. Supports 3 difficulty levels and tracks session history.

---

Built by [Your Name] · [LinkedIn](https://linkedin.com) · [GitHub](https://github.com)
