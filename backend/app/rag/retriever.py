from typing import List, Dict, Any
from app.rag.vectorstore import VectorStore

class RAGRetriever:
    @staticmethod
    def retrieve_relevant_context(subject_id: int, query: str, top_k: int = 4) -> Dict[str, Any]:
        """
        Retrieves top relevant chunks from FAISS vector database for a given subject and query.
        Returns formatted context string and structured source citations.
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

        formatted_context = "\n\n".join(context_blocks)
        return {
            "context": formatted_context,
            "sources": sources
        }
