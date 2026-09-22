import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from questions_data import QUESTIONS
import os

# Load embedding model — all-MiniLM-L6-v2 is fast, small, and great for semantic search
print("Loading embedding model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Embedding model loaded")

# ChromaDB persistent client
chroma_client = chromadb.PersistentClient(path="./chroma_db")

def get_or_create_collection():
    """Get existing collection or create and populate it."""
    try:
        collection = chroma_client.get_collection("interview_questions")
        print(f"✅ Loaded existing ChromaDB with {collection.count()} questions")
        return collection
    except:
        print("Creating new ChromaDB collection...")
        collection = chroma_client.create_collection(
            name="interview_questions",
            metadata={"hnsw:space": "cosine"}  # cosine similarity
        )
        populate_collection(collection)
        return collection

def populate_collection(collection):
    """Embed all questions and store in ChromaDB."""
    print(f"Embedding {len(QUESTIONS)} questions...")
    texts = [q["question"] for q in QUESTIONS]
    ids = [q["id"] for q in QUESTIONS]

    # Generate embeddings in batch (fast)
    embeddings = model.encode(texts, batch_size=32, show_progress_bar=True).tolist()

    # Store with metadata for filtering
    metadatas = [{
        "category": q["category"],
        "track": q["track"],
        "difficulty": q["difficulty"],
        "company": q["company"],
        "year": q["year"],
        "type": q["type"],
        "tip": q["tip"]
    } for q in QUESTIONS]

    collection.add(
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids
    )
    print(f"✅ Stored {len(QUESTIONS)} questions in ChromaDB")

def retrieve_questions(track: str, difficulty: str, n: int = 5, exclude_ids: list = []):
    """
    Retrieve semantically relevant questions for a track + difficulty.
    Uses cosine similarity on embeddings — this is the RAG retrieval step.
    """
    collection = get_or_create_collection()

    # Create a query from track + difficulty context
    query = f"{difficulty} {track} interview questions technical skills"
    query_embedding = model.encode([query])[0].tolist()

    # Filter by track and difficulty
    where_filter = {
        "$and": [
            {"track": {"$eq": track}},
            {"difficulty": {"$eq": difficulty}}
        ]
    }

    # Query ChromaDB — returns most semantically similar questions
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(n + len(exclude_ids) + 5, 20),
        where=where_filter,
        include=["documents", "metadatas", "distances"]
    )

    # Build question objects, exclude already-asked ones
    questions = []
    for i, doc_id in enumerate(results["ids"][0]):
        if doc_id in exclude_ids:
            continue
        if len(questions) >= n:
            break

        # Find full question data
        q_data = next((q for q in QUESTIONS if q["id"] == doc_id), None)
        if q_data:
            similarity = 1 - results["distances"][0][i]  # Convert distance to similarity
            questions.append({
                **q_data,
                "similarity_score": round(similarity, 3),
                "hasCoding": q_data["type"] == "Coding",
                "codeStarter": "// Write your solution here\n",
                "expectedOutput": "",
                "followUp": f"Can you explain the time and space complexity of your approach?"
            })

    return questions

def compute_similarity(answer: str, ideal_answer: str) -> float:
    """
    Compute semantic similarity between candidate answer and ideal answer.
    Uses cosine similarity on sentence embeddings — core DS skill!
    """
    embeddings = model.encode([answer, ideal_answer])
    # Cosine similarity
    dot_product = float(sum(a*b for a, b in zip(embeddings[0], embeddings[1])))
    norm_a = float(sum(a**2 for a in embeddings[0]) ** 0.5)
    norm_b = float(sum(b**2 for b in embeddings[1]) ** 0.5)
    similarity = dot_product / (norm_a * norm_b)
    return round(max(0, min(1, similarity)), 3)

# Initialize collection on startup
print("Initializing vector store...")
collection = get_or_create_collection()
