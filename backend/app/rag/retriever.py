import sqlite3
import os
import json
from typing import List, Dict, Any
from app.rag.vectorstore import VectorStore

DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../study_buddy.db"))

class RAGRetriever:
    @staticmethod
    def retrieve_relevant_context(subject_id: int, query: str, top_k: int = 4) -> Dict[str, Any]:
        """
        Retrieves top relevant chunks from FAISS vector database for a given subject and query.
        Falls back to direct SQLite document text extraction if vector store has 0 indexed chunks.
        """
        vector_store = VectorStore(subject_id=subject_id)
        search_results = vector_store.search(query, top_k=top_k)

        context_blocks = []
        sources = []

        for idx, res in enumerate(search_results):
            source_info = {
                "source_id": idx + 1,
                "filename": res.get("filename", "Document"),
                "page_number": res.get("page_number", 1),
                "document_id": res.get("document_id")
            }
            sources.append(source_info)
            context_blocks.append(
                f"[Source {idx + 1}: {source_info['filename']} - Page {source_info['page_number']}]\n{res['content']}"
            )

        if not context_blocks:
            try:
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT id, filename, extracted_text FROM documents WHERE (subject_id=? OR ?) AND extracted_text IS NOT NULL AND extracted_text != '' LIMIT 3",
                    (subject_id, subject_id)
                )
                doc_rows = cursor.fetchall()
                conn.close()

                for idx, (doc_id, fname, dtext) in enumerate(doc_rows):
                    sources.append({"source_id": idx + 1, "filename": fname, "page_number": 1, "document_id": doc_id})
                    context_blocks.append(f"[Source {idx + 1}: {fname}]\n{dtext[:1200]}")
            except Exception:
                pass

        formatted_context = "\n\n".join(context_blocks)
        return {
            "context": formatted_context,
            "sources": sources
        }
