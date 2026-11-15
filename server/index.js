@@
 const cors = require('cors');
 const crypto = require('crypto');
 const jwt = require('jsonwebtoken');
+const { retrieveQuestions, computeSimilarity } = require('./questions');
 
 const app = express();
@@
-// ─────────────────────────────────────────────────────────────
-// RAG SERVICE
-// ─────────────────────────────────────────────────────────────
-
-const RAG_URL =
-  process.env.RAG_SERVICE_URL ||
-  'http://localhost:8000';
-
 /// RAG Questions
 app.post('/api/rag/questions', async (req, res) => {
   try {
-    const response = await fetch(`${RAG_URL}/retrieve`, {
-      method: 'POST',
-      headers: {
-        'Content-Type': 'application/json'
-      },
-      body: JSON.stringify({
-        track: req.body.track,
-        difficulty: req.body.difficulty,
-        num_questions: req.body.numQuestions || 5,
-        exclude_ids: req.body.excludeIds || []
-      })
+    const questions = await retrieveQuestions({
+      track: req.body.track,
+      difficulty: req.body.difficulty,
+      numQuestions: req.body.numQuestions || 5,
+      excludeIds: req.body.excludeIds || []
     });
 
-    const text = await response.text();
-
-    console.log('🔵 RAG status:', response.status);
-    console.log('🔵 RAG response:', text);
-
-    let data;
-    try {
-      data = JSON.parse(text);
-    } catch {
-      data = { error: text };
-    }
-
-    if (!response.ok) {
-      return res.status(response.status).json({
-        error: data.detail || data.error || 'RAG service error'
-      });
-    }
-
-    res.json(data);
+    res.json({ questions });
 
   } catch (err) {
-    console.error('❌ RAG connection error:', err);
+    console.error('❌ RAG questions error:', err);
     res.status(500).json({ error: err.message });
   }
 });
+
 // RAG Similarity
 app.post('/api/rag/similarity', async (req, res) => {
   try {
-    const response = await fetch(
-      `${RAG_URL}/similarity`,
-      {
-        method: 'POST',
-
-        headers: {
-          'Content-Type': 'application/json'
-        },
-
-        body: JSON.stringify(req.body)
-      }
+    const score = await computeSimilarity(
+      req.body.candidate_answer,
+      req.body.ideal_answer
     );
 
-    res.json(
-      await response.json()
-    );
+    res.json({ similarity_score: score });
 
   } catch (err) {
     res.status(500).json({
