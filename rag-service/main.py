from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import anthropic
import os
from dotenv import load_dotenv
from vectorstore import retrieve_questions, compute_similarity

load_dotenv()

app = FastAPI(title="MockMate RAG Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ─── REQUEST MODELS ───────────────────────────────────────────────────

class QuestionRequest(BaseModel):
    track: str
    difficulty: str
    num_questions: int = 5
    exclude_ids: List[str] = []

class SimilarityRequest(BaseModel):
    candidate_answer: str
    ideal_answer: str
    question: str

class RadarRequest(BaseModel):
    question: str
    answer: str
    category: str
    track: str
    difficulty: str

# ─── ROUTES ───────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "service": "MockMate RAG", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy", "embeddings": "all-MiniLM-L6-v2", "vectordb": "ChromaDB"}

@app.post("/retrieve")
def retrieve(req: QuestionRequest):
    """
    RAG retrieval endpoint — fetches semantically relevant real company questions.
    This is the core RAG step: embed query → search vector DB → return top-k results.
    """
    try:
        questions = retrieve_questions(
            track=req.track,
            difficulty=req.difficulty,
            n=req.num_questions,
            exclude_ids=req.exclude_ids
        )
        if not questions:
            raise HTTPException(status_code=404, detail=f"No questions found for track={req.track}, difficulty={req.difficulty}")
        return {
            "questions": questions,
            "retrieved_count": len(questions),
            "embedding_model": "all-MiniLM-L6-v2",
            "vector_db": "ChromaDB"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/similarity")
def similarity(req: SimilarityRequest):
    """
    Semantic similarity between candidate answer and ideal answer.
    Uses sentence transformer embeddings + cosine similarity.
    This is a core Data Science concept — shows ML knowledge!
    """
    try:
        score = compute_similarity(req.candidate_answer, req.ideal_answer)
        # Interpret score
        if score >= 0.85:
            interpretation = "Excellent — very close to ideal answer"
        elif score >= 0.70:
            interpretation = "Good — captures main concepts"
        elif score >= 0.55:
            interpretation = "Partial — missing some key points"
        else:
            interpretation = "Needs improvement — review the topic"

        return {
            "similarity_score": score,
            "percentage": round(score * 100, 1),
            "interpretation": interpretation,
            "model": "all-MiniLM-L6-v2",
            "method": "cosine similarity on 384-dim embeddings"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/radar")
def radar_scores(req: RadarRequest):
    """
    Generate 5-dimensional answer quality radar chart scores using Claude.
    Returns scores for: Technical Accuracy, Clarity, Depth, Relevance, Confidence.
    """
    try:
        msg = claude.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=400,
            messages=[{
                "role": "user",
                "content": f"""You are an expert {req.track} interviewer. Score this {req.difficulty} answer on 5 dimensions.

Question: {req.question}
Category: {req.category}
Answer: {req.answer}

Respond ONLY with valid JSON (no markdown):
{{
  "technical_accuracy": <1-10>,
  "communication_clarity": <1-10>,
  "depth_of_explanation": <1-10>,
  "relevance_to_question": <1-10>,
  "confidence_in_tone": <1-10>,
  "overall": <1-10>
}}"""
            }]
        )
        import json
        text = msg.content[0].text.replace("```json", "").replace("```", "").strip()
        scores = json.loads(text)
        return scores
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
