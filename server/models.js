const mongoose = require('mongoose');

// ─── USER MODEL ───────────────────────────────────────────
const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  displayName: { type: String },
  avatarUrl: { type: String },
  profileUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
});

// ─── SESSION MODEL ────────────────────────────────────────
const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  track: { type: String, required: true },
  difficulty: { type: String, required: true },
  totalScore: { type: Number, default: 0 },
  usedRAG: { type: Boolean, default: false },
  results: [{
    question: String,
    category: String,
    answer: String,
    score: Number,
    verdict: String,
    good: String,
    missing: String,
    modelAnswer: String,
  }],
  report: {
    overallVerdict: String,
    strongAreas: [String],
    weakAreas: [String],
    topPriorities: [String],
    readiness: String,
    encouragement: String,
  },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Session = mongoose.model('Session', sessionSchema);

module.exports = { User, Session };
