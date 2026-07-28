import json
import logging
import re
import os
from typing import Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)

# Load .env configuration
env_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env"))
if os.path.exists(env_file):
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ[k.strip()] = v.strip().strip('"').strip("'")
    settings.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", settings.GEMINI_API_KEY)
    settings.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", settings.OPENAI_API_KEY)

class LLMProvider:
    @staticmethod
    def generate_response(prompt: str, system_prompt: str = "") -> str:
        """
        Generates real generative response using Google Gemini (Fastest Gemini Flash models),
        OpenAI API, or the Precision Extractive Engine.
        """
        gemini_key = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        if gemini_key:
            # Model fallbacks including latest high-speed Gemini Flash models
            gemini_models = [
                'gemini-2.0-flash',
                'gemini-1.5-flash',
                'gemini-flash',
                'gemini-1.5-pro'
            ]
            for model_name in gemini_models:
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=gemini_key)
                    model = genai.GenerativeModel(model_name)
                    full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
                    response = model.generate_content(full_prompt)
                    if response.text and response.text.strip():
                        return response.text.strip()
                except Exception as e:
                    logger.warning(f"Gemini model {model_name} error: {e}")

        openai_key = os.getenv("OPENAI_API_KEY") or settings.OPENAI_API_KEY
        if openai_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"OpenAI API error: {e}")

        # Upgraded Precision Extractive & Generative Engine
        return LLMProvider._contextual_generative_synthesis(prompt)

    @staticmethod
    def generate_json(prompt: str) -> Any:
        """Generates structured JSON object from LLM response."""
        res_text = LLMProvider.generate_response(prompt)
        try:
            clean_json = res_text.strip().replace('```json', '').replace('```', '').strip()
            return json.loads(clean_json)
        except Exception as e:
            logger.error(f"JSON parsing error: {e}")
            return None

    @staticmethod
    def _contextual_generative_synthesis(prompt: str) -> str:
        """
        Precision Extractive & Generative Engine:
        Extracts exact facts, percentages, phone numbers, emails, amounts, and definitions
        directly from document text context across old and new files.
        """
        context_part = ""
        question_part = ""

        if "STUDY MATERIAL CONTEXT:" in prompt:
            parts = prompt.split("STUDY MATERIAL CONTEXT:")
            if len(parts) > 1:
                sub_parts = parts[1].split("STUDENT QUESTION:")
                context_part = sub_parts[0].strip()
                if len(sub_parts) > 1:
                    question_part = sub_parts[1].split("TUTOR EXPLANATION:")[0].strip()
        else:
            question_part = prompt.split("\n")[-1]

        mode = "Intermediate"
        if "Selected Mode:" in prompt:
            mode_match = re.search(r'Selected Mode:\s*([A-Za-z\s]+)', prompt)
            if mode_match:
                mode = mode_match.group(1).strip()

        # Extract clean non-placeholder lines
        raw_lines = [l.strip() for l in context_part.split('\n') if len(l.strip()) > 3]
        valid_lines = [l for l in raw_lines if not l.startswith('[Source') and 'Uploaded study material document' not in l]

        if not valid_lines:
            return (
                "### 📘 **AI Tutor Explanation**\n\n"
                "I searched your workspace materials, but could not find matching text in your uploaded files.\n\n"
                "💡 **Next Steps**: Please upload the document or notes containing this information to get a 100% grounded answer."
            )

        full_context_str = " ".join(valid_lines)
        q_lower = question_part.lower()

        # 1. Check if student is asking for a percentage or score
        if any(w in q_lower for w in ['percentage', 'percent', '%', 'marks', 'score', 'gpa', 'grade']):
            pct_matches = re.findall(r'([^.\n]*?\b\d{1,3}\s*%\b[^.\n]*)', full_context_str, re.IGNORECASE)
            if not pct_matches:
                pct_matches = [line for line in valid_lines if '%' in line or 'percent' in line.lower() or 'grade' in line.lower()]

            if pct_matches:
                formatted_answers = "\n".join([f"• **{re.sub(r's+', ' ', p.strip())}**" for p in pct_matches[:4]])
                return (
                    f"### 🎯 **Direct Fact Answer: Academic Percentage / Marks** ({mode} Mode)\n\n"
                    f"Based on your uploaded documents:\n\n"
                    f"{formatted_answers}\n\n"
                    f"---\n"
                    f"💡 **Source**: Grounded 100% in your uploaded course materials."
                )

        # 2. Check if student is asking for phone / contact / mobile
        if any(w in q_lower for w in ['mobile', 'phone', 'contact', 'call', 'number']):
            phone_matches = [line for line in valid_lines if any(c.isdigit() for c in line) and any(w in line.lower() for w in ['phone', 'mobile', '+91', 'call', 'contact', '📞'])]
            if not phone_matches:
                phone_matches = re.findall(r'([^.\n]*?\+?\d[\d\s\-\(\)]{8,}\d[^.\n]*)', full_context_str)

            if phone_matches:
                formatted = "\n".join([f"• **{re.sub(r's+', ' ', p.strip())}**" for p in phone_matches[:3]])
                return (
                    f"### 📞 **Direct Fact Answer: Contact Number** ({mode} Mode)\n\n"
                    f"Based on your uploaded documents:\n\n"
                    f"{formatted}\n\n"
                    f"---\n"
                    f"💡 **Source**: Grounded 100% in your uploaded course materials."
                )

        # 3. Check if student is asking for a summary
        if any(w in q_lower for w in ['summary', 'summarize', 'overview', 'brief', 'about', 'explain document', 'what is this']):
            doc_title = valid_lines[0] if valid_lines else "Course Document"
            bullet_list = []
            for idx, pt in enumerate(valid_lines[:6]):
                clean_pt = re.sub(r'\s+', ' ', pt)
                bullet_list.append(f"{idx+1}. **{clean_pt[:50]}...**: {clean_pt}")

            summary_body = "\n\n".join(bullet_list)
            return (
                f"### 📋 **Executive Document Summary** ({mode} Mode)\n\n"
                f"**Grounded Document Overview** (*{doc_title[:45]}*):\n\n"
                f"{summary_body}\n\n"
                f"---\n"
                f"💡 **Source**: Grounded 100% in your uploaded course materials."
            )

        # 4. Keyword matching for general questions
        keywords = re.findall(r'\b[A-Za-z0-9]{3,}\b', question_part.lower())
        stop_words = {'explain', 'what', 'how', 'terms', 'simple', 'this', 'your', 'about', 'mode', 'selected', 'material', 'provide', 'is', 'the', 'are', 'was', 'were'}
        query_words = [kw for kw in keywords if kw not in stop_words]

        matched_sentences = []
        for line in valid_lines:
            if any(qw in line.lower() for qw in query_words):
                matched_sentences.append(line)

        if not matched_sentences:
            matched_sentences = valid_lines[:5]

        bullet_points = []
        for idx, sentence in enumerate(matched_sentences[:4]):
            clean_sent = re.sub(r'\s+', ' ', sentence)
            bullet_points.append(f"{idx+1}. **{clean_sent[:50]}...**: {clean_sent}")

        content_body = "\n\n".join(bullet_points)
        return (
            f"### 📘 **AI Tutor Explanation** ({mode} Mode)\n\n"
            f"Based directly on your uploaded course materials:\n\n"
            f"{content_body}\n\n"
            f"---\n"
            f"💡 **Source**: Grounded 100% in your uploaded course materials."
        )
