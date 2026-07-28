from typing import List, Dict, Any

class Chunker:
    @staticmethod
    def chunk_document_pages(
        pages: List[Dict[str, Any]], 
        chunk_size: int = 500, 
        overlap: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Splits extracted pages into overlapping chunks while preserving page number and metadata.
        """
        chunks = []
        global_index = 0

        for page in pages:
            page_num = page.get("page_number", 1)
            text = page.get("text", "").strip()

            if not text:
                continue

            # Paragraph or sliding window splitting
            words = text.split()
            if len(words) <= chunk_size:
                chunks.append({
                    "chunk_index": global_index,
                    "page_number": page_num,
                    "content": text,
                    "word_count": len(words)
                })
                global_index += 1
            else:
                step = chunk_size - overlap
                for i in range(0, len(words), step):
                    chunk_words = words[i : i + chunk_size]
                    chunk_text = " ".join(chunk_words)
                    if len(chunk_text.strip()) > 10:
                        chunks.append({
                            "chunk_index": global_index,
                            "page_number": page_num,
                            "content": chunk_text,
                            "word_count": len(chunk_words)
                        })
                        global_index += 1

        return chunks
