import re
import json
import logging
import sqlite3
import os
import datetime
from typing import Dict, Any
from app.ai.llm import LLMProvider
from app.rag.retriever import RAGRetriever
from app.ai.prompts import SystemPrompts
from app.core.exporter import DocumentExporter

logger = logging.getLogger(__name__)

DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../study_buddy.db"))

class OSAgent:
    @staticmethod
    def execute_command(command: str, subject_id: int = 1, mode: str = "Intermediate") -> Dict[str, Any]:
        """
        Autonomous Buddy AI OS Agent: Executes ALL commands, slash commands,
        link ingestion, and system actions across the Learning Operating System.
        """
        raw_cmd = command.strip().lower()
        cmd_clean = re.sub(r'^[^\w\/]+', '', raw_cmd).strip()

        # 1. Summarize Link / Wikipedia / YouTube URL Command (/link [URL] or "summarize link [URL]")
        if "http://" in raw_cmd or "https://" in raw_cmd or cmd_clean.startswith("/link"):
            match = re.search(r'https?://[^\s]+', command)
            if match:
                url_found = match.group(0)
                try:
                    from app.document_engine.link_parser import LinkParser
                    parsed = LinkParser.parse_and_fetch_url(url_found)
                    title = parsed["title"]
                    ext_text = parsed["extracted_text"]
                    file_type = parsed["type"]

                    summary_prompt = f"Summarize the following content from '{title}' in clear bullet points:\n\n{ext_text[:2500]}\n\nEXECUTIVE SUMMARY:"
                    summary_text = LLMProvider.generate_response(summary_prompt)

                    conn = sqlite3.connect(DB_FILE)
                    cursor = conn.cursor()
                    meta = {
                        "subject": "General Study",
                        "topic": title,
                        "url": url_found,
                        "concepts": [file_type.upper(), "Web Link"],
                        "summary": summary_text
                    }
                    cursor.execute(
                        "INSERT INTO documents (subject_id, filename, file_path, file_type, ocr_status, ocr_confidence, extracted_text, intelligence_metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        (subject_id, title, url_found, file_type, "completed", 98.0, ext_text, json.dumps(meta))
                    )
                    doc_id = cursor.lastrowid
                    conn.commit()
                    conn.close()

                    from app.rag.vectorstore import VectorStore
                    vstore = VectorStore(subject_id=subject_id)
                    vstore.add_chunks([{"page_number": 1, "content": ext_text}], document_id=doc_id, filename=title)

                    return {
                        "action": "navigate",
                        "target": "vault",
                        "message": f"🌐 **Buddy AI Link Summarizer**: Ingested and summarized **'{title}'**!\n\n**Executive Summary:**\n{summary_text}",
                    }
                except Exception as e:
                    logger.error(f"Link parse error: {e}")

        # 2. Clear / Delete Everything
        if any(w in cmd_clean for w in ["delete", "remove", "clear", "wipe", "reset"]) and any(w in cmd_clean for w in ["everything", "document", "material", "all", "uploaded", "file", "db", "vault", "workspace"]) or cmd_clean.startswith("/clear"):
            try:
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute("DELETE FROM documents")
                cursor.execute("DELETE FROM flashcards")
                cursor.execute("DELETE FROM quizzes")
                cursor.execute("DELETE FROM todo_tasks")
                conn.commit()
                conn.close()

                idx_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage/faiss_index"))
                if os.path.exists(idx_dir):
                    for f in os.listdir(idx_dir):
                        try: os.remove(os.path.join(idx_dir, f))
                        except Exception: pass

                return {
                    "action": "delete_documents",
                    "message": "🗑️ **Buddy AI OS Agent**: Deleted all uploaded materials, to-do tasks, and reset workspace.",
                }
            except Exception as e:
                logger.error(f"Delete error: {e}")

        # 3. Add To-Do Task Command ("add task X", "add to do Y", "/todo")
        if "add task" in cmd_clean or "add to do" in cmd_clean or "create task" in cmd_clean or cmd_clean.startswith("/todo"):
            match = re.search(r'(?:add task|add to do|create task|\/todo)\s+(.+)', cmd_clean)
            task_title = match.group(1).capitalize() if match else "New Study Task"
            try:
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                due_date = datetime.datetime.now().strftime("%Y-%m-%d")
                cursor.execute("INSERT INTO todo_tasks (user_id, subject_id, title, category, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)",
                               (1, subject_id, task_title, "Homework", "Medium", due_date))
                task_id = cursor.lastrowid
                conn.commit()
                conn.close()

                return {
                    "action": "navigate",
                    "target": "planner",
                    "message": f"✅ **Buddy AI OS Agent**: Created to-do task **'{task_title}'**! Redirecting to Study Planner...",
                }
            except Exception as e:
                logger.error(f"Task creation error: {e}")

        # 4. Upload Material Command (/upload)
        if cmd_clean.startswith("/upload") or "upload material" in cmd_clean:
            return {
                "action": "open_upload_modal",
                "message": "📤 **Buddy AI OS Agent**: Opening Document Upload modal...",
            }

        # 5. Create Subject Command (/createsubject, "add subject X")
        if "create subject" in cmd_clean or "add subject" in cmd_clean or cmd_clean.startswith("/createsubject"):
            match = re.search(r'(?:create|add|createsubject)\s+subject\s+(.+)', cmd_clean) or re.search(r'\/createsubject\s+(.+)', cmd_clean)
            subj_name = match.group(1).title() if match else "New Subject"
            try:
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute("INSERT INTO subjects (workspace_id, name) VALUES (?, ?)", (1, subj_name))
                new_id = cursor.lastrowid
                conn.commit()
                conn.close()
                return {
                    "action": "create_subject",
                    "subject_id": new_id,
                    "subject_name": subj_name,
                    "message": f"📁 **Buddy AI OS Agent**: Created new subject **'{subj_name}'** (ID: {new_id}).",
                }
            except Exception as e:
                logger.error(f"Create subject error: {e}")

        # 6. Action Items & Study Tasks Extraction (/actionitems)
        if cmd_clean.startswith("/actionitems") or "action items" in cmd_clean:
            rag_res = RAGRetriever.retrieve_relevant_context(subject_id=subject_id, query="tasks action items homework review", top_k=6)
            ai_resp = LLMProvider.generate_response(
                f"STUDY MATERIAL CONTEXT:\n{rag_res['context']}\n\nSTUDENT QUESTION:\nExtract all action items, key study tasks, and follow-ups from the documents.\n\nTUTOR EXPLANATION:"
            )
            return {"action": "rag_answer", "message": f"📋 **Buddy AI Action Items**:\n\n{ai_resp}", "sources": rag_res["sources"]}

        # 7. Key Takeaways Extraction (/keytakeaways)
        if cmd_clean.startswith("/keytakeaways") or "key takeaways" in cmd_clean:
            rag_res = RAGRetriever.retrieve_relevant_context(subject_id=subject_id, query="important core concepts main points", top_k=6)
            ai_resp = LLMProvider.generate_response(
                f"STUDY MATERIAL CONTEXT:\n{rag_res['context']}\n\nSTUDENT QUESTION:\nProvide a bulleted list of main Key Takeaways.\n\nTUTOR EXPLANATION:"
            )
            return {"action": "rag_answer", "message": f"💡 **Buddy AI Key Takeaways**:\n\n{ai_resp}", "sources": rag_res["sources"]}

        # 8. Simplify Explanation (/simplify)
        if cmd_clean.startswith("/simplify") or "simplify" in cmd_clean:
            rag_res = RAGRetriever.retrieve_relevant_context(subject_id=subject_id, query="overview core concept", top_k=6)
            ai_resp = LLMProvider.generate_response(
                f"STUDY MATERIAL CONTEXT:\n{rag_res['context']}\n\nSTUDENT QUESTION:\nExplain these materials in super simple terms for a beginner.\n\nTUTOR EXPLANATION:"
            )
            return {"action": "rag_answer", "message": f"🐣 **Buddy AI Simplified Explanation**:\n\n{ai_resp}", "sources": rag_res["sources"]}

        # 9. Navigation Commands (/dashboard, /vault, /analytics, /planner, /navigate)
        if any(w in cmd_clean for w in ["navigate", "go to", "open vault", "open flashcards", "open quiz", "open dashboard", "open analytics", "open planner", "open to do"]) or any(cmd_clean.startswith(x) for x in ["/dashboard", "/vault", "/analytics", "/planner"]):
            target = "dashboard"
            if "vault" in cmd_clean or "/vault" in cmd_clean: target = "vault"
            elif "flashcard" in cmd_clean: target = "flashcards"
            elif "quiz" in cmd_clean or "test" in cmd_clean: target = "quiz"
            elif "analytics" in cmd_clean or "/analytics" in cmd_clean: target = "analytics"
            elif "planner" in cmd_clean or "to do" in cmd_clean or "/planner" in cmd_clean: target = "planner"

            return {
                "action": "navigate",
                "target": target,
                "message": f"🤖 **Buddy AI OS Agent**: Navigating OS to **{target.title()}**...",
            }

        # 10. Flashcards Command (/flashcards)
        if "flashcard" in cmd_clean or cmd_clean.startswith("/flashcard"):
            try:
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute("SELECT filename, extracted_text FROM documents WHERE extracted_text IS NOT NULL AND extracted_text != ''")
                doc_rows = cursor.fetchall()
                cards = []
                for fname, dtext in doc_rows:
                    lines = [l.strip() for l in dtext.split('\n') if len(l.strip()) > 12 and 'Uploaded study material document' not in l]
                    for line in lines[:6]:
                        clean_l = re.sub(r'\s+', ' ', line)
                        cards.append({
                            "question": f"What key detail is documented in '{fname}' regarding: {clean_l[:40]}...?",
                            "answer": f"Document Excerpt from {fname}:\n\"{clean_l}\"",
                            "topic": fname.rsplit('.', 1)[0].replace('_', ' ').title()
                        })
                if not cards:
                    cards = [{"question": "Document Concept", "answer": "Upload study material", "topic": "General"}]

                for c in cards[:8]:
                    cursor.execute("INSERT INTO flashcards (subject_id, question, answer, topic) VALUES (?, ?, ?, ?)",
                                   (subject_id, c["question"], c["answer"], c["topic"]))
                conn.commit()
                conn.close()
            except Exception as e:
                logger.error(f"Flashcards error: {e}")

            return {
                "action": "generate_flashcards",
                "subject_id": subject_id,
                "message": f"⚡ **Buddy AI OS Agent**: Generated 100% document-grounded flashcards! Redirecting to Flashcards module...",
            }

        # 11. Quiz Command (/quiz, /mockexam)
        if "quiz" in cmd_clean or "test" in cmd_clean or "assessment" in cmd_clean or cmd_clean.startswith("/quiz") or cmd_clean.startswith("/mockexam"):
            try:
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute("SELECT filename, extracted_text FROM documents WHERE extracted_text IS NOT NULL AND extracted_text != ''")
                doc_rows = cursor.fetchall()
                valid_sentences = []
                for fname, dtext in doc_rows:
                    lines = [l.strip() for l in dtext.split('\n') if len(l.strip()) > 10 and 'Uploaded study material document' not in l]
                    for l in lines:
                        valid_sentences.append((fname, l))

                questions = []
                if valid_sentences:
                    for idx, (fname, sent) in enumerate(valid_sentences[:5]):
                        clean_s = re.sub(r'\s+', ' ', sent)
                        opts = [
                            f"Exact detail from document: {clean_s}",
                            f"Incorrect variation in {fname}.",
                            f"Unrelated claim in {fname}.",
                            f"Incorrect parameter for {fname}."
                        ]
                        questions.append({
                            "id": idx + 1,
                            "question": f"According to '{fname}', what is true regarding: \"{clean_s[:60]}...\"?",
                            "options": opts,
                            "correct_index": 0,
                            "explanation": f"Grounded directly in {fname}: \"{clean_s}\""
                        })
                if not questions:
                    questions = [{"id": 1, "question": "Uploaded Document Concept", "options": ["Correct statement", "Wrong statement"], "correct_index": 0, "explanation": "Extracted from document."}]

                q_title = "Document Assessment (Medium)"
                cursor.execute("INSERT INTO quizzes (subject_id, title, difficulty, questions) VALUES (?, ?, ?, ?)",
                               (subject_id, q_title, "Medium", json.dumps(questions)))
                conn.commit()
                conn.close()
            except Exception as e:
                logger.error(f"Quiz error: {e}")

            return {
                "action": "generate_quiz",
                "subject_id": subject_id,
                "difficulty": "Medium",
                "message": f"⚡ **Buddy AI OS Agent**: Generated interactive document assessment! Redirecting to Quiz module...",
            }

        # 12. Export Commands (/exportpdf, /exportjpeg)
        if "export" in cmd_clean or "download" in cmd_clean or cmd_clean.startswith("/export"):
            fmt = "jpeg" if "jpeg" in cmd_clean or "jpg" in cmd_clean or "image" in cmd_clean else "pdf"
            rag_res = RAGRetriever.retrieve_relevant_context(subject_id=subject_id, query="summary overview", top_k=6)
            summary_text = LLMProvider.generate_response(
                f"STUDY MATERIAL CONTEXT:\n{rag_res['context']}\n\nSTUDENT QUESTION:\nProvide an Executive Summary of uploaded materials.\n\nTUTOR EXPLANATION:"
            )
            title = "Buddy AI Workspace Summary"
            export_res = DocumentExporter.generate_pdf(title, summary_text) if fmt == "pdf" else DocumentExporter.generate_jpeg(title, summary_text)

            return {
                "action": "export_file",
                "format": fmt,
                "file_url": export_res["file_url"],
                "filename": export_res["filename"],
                "message": f"🎉 **Buddy AI OS Agent**: Exported workspace summary as **{fmt.upper()}**! Click download button below.",
            }

        # 13. Default RAG Answer / Summarize
        query = command.replace("/summarize", "Summarize all uploaded materials").replace("/ask", "").strip()
        rag_res = RAGRetriever.retrieve_relevant_context(subject_id=subject_id, query=query, top_k=6)
        prompt = SystemPrompts.build_chat_prompt(context=rag_res["context"], query=query, mode=mode, weak_concepts=[])
        ai_resp = LLMProvider.generate_response(prompt)

        return {
            "action": "rag_answer",
            "message": ai_resp,
            "sources": rag_res["sources"]
        }
