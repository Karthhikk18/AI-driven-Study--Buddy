import os
import json
import math
import logging
from typing import List, Dict, Any
from app.core.config import settings
from app.rag.embeddings import EmbeddingGenerator

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self, subject_id: int):
        self.subject_id = subject_id
        self.meta_file = os.path.join(settings.FAISS_INDEX_DIR, f"subject_{subject_id}.json")
        
        self.metadata_store = [] # List of {document_id, page_number, content, vector: list[float]}
        self._load_or_create()

    def _load_or_create(self):
        if os.path.exists(self.meta_file):
            try:
                with open(self.meta_file, 'r', encoding='utf-8') as f:
                    self.metadata_store = json.load(f)
                return
            except Exception as e:
                logger.error(f"Error loading vector index for subject {self.subject_id}: {e}")

        self.metadata_store = []

    def add_chunks(self, chunks: List[Dict[str, Any]], document_id: int, filename: str):
        if not chunks:
            return

        texts = [c["content"] for c in chunks]
        embeddings = EmbeddingGenerator.get_embeddings(texts) # list of list of floats

        for idx, chunk in enumerate(chunks):
            vector = embeddings[idx] if idx < len(embeddings) else [0.0] * 384
            self.metadata_store.append({
                "document_id": document_id,
                "filename": filename,
                "page_number": chunk.get("page_number", 1),
                "content": chunk["content"],
                "vector": vector
            })

        self.save()

    def search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        if not self.metadata_store:
            return []

        query_vectors = EmbeddingGenerator.get_embeddings([query])
        query_vector = query_vectors[0] if query_vectors else [0.0] * 384

        results_with_dist = []
        for item in self.metadata_store:
            vec = item.get("vector", [0.0] * len(query_vector))
            # Calculate Euclidean distance between query_vector and chunk vector
            dist = math.sqrt(sum((a - b) ** 2 for a, b in zip(query_vector, vec)))
            
            meta = {
                "document_id": item["document_id"],
                "filename": item["filename"],
                "page_number": item["page_number"],
                "content": item["content"],
                "score": float(dist)
            }
            results_with_dist.append((dist, meta))

        results_with_dist.sort(key=lambda x: x[0])
        return [r[1] for r in results_with_dist[:top_k]]

    def save(self):
        with open(self.meta_file, 'w', encoding='utf-8') as f:
            json.dump(self.metadata_store, f, indent=2)
