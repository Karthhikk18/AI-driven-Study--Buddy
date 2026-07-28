import logging
from typing import List
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingGenerator:
    @staticmethod
    def get_embeddings(texts: List[str]) -> List[List[float]]:
        """Generates dense embedding vectors for input texts."""
        if not texts:
            return []

        # 1. API embeddings if configured
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                res = genai.embed_content(
                    model="models/text-embedding-004",
                    content=texts,
                    task_type="retrieval_document"
                )
                return res['embedding']
            except Exception as e:
                logger.error(f"Gemini embedding error: {e}")

        # Deterministic lightweight pure-python embedding vector generator
        vectors = []
        for text in texts:
            words = text.lower().split()
            vec = [0.0] * 384
            for i, word in enumerate(words[:384]):
                vec[i % 384] += len(word)
            norm = math_sqrt = (sum(x**2 for x in vec)) ** 0.5
            if norm > 0:
                vec = [x / norm for x in vec]
            vectors.append(vec)
        return vectors
