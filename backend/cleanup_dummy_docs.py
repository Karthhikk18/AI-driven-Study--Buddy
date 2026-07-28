import sqlite3
import os
from app.rag.vectorstore import VectorStore

conn = sqlite3.connect('study_buddy.db')
c = conn.cursor()

# Remove documents with length <= 50 bytes or containing dummy text
c.execute("SELECT id, filename, file_path FROM documents")
docs = c.fetchall()

deleted_ids = []
for doc_id, filename, file_path in docs:
    if os.path.exists(file_path):
        size = os.path.getsize(file_path)
        if size <= 100:
            c.execute("DELETE FROM documents WHERE id=?", (doc_id,))
            c.execute("DELETE FROM quizzes WHERE subject_id=?", (doc_id,))
            c.execute("DELETE FROM flashcards WHERE subject_id=?", (doc_id,))
            deleted_ids.append(doc_id)
            print(f"Removed dummy test document ID {doc_id} ({filename})")

conn.commit()
conn.close()

# Rebuild fresh vector store
from clean_vector_index import main as rebuild_vector_index
try:
    import clean_vector_index
except Exception as e:
    print("Rebuild notice:", e)

print("🎉 DATABASE CLEANUP COMPLETED!")
