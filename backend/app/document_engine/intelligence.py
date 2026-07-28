import re
import json
import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class DocumentIntelligence:
    @staticmethod
    def analyze_document_content(text: str, filename: str) -> Dict[str, Any]:
        """
        Extracts structured document intelligence metadata:
        - subject & topic
        - key concepts
        - formulas & definitions
        - difficulty level
        """
        if not text or len(text.strip()) == 0:
            return {
                "subject": "General",
                "topic": filename,
                "concepts": ["Study Note"],
                "formulas": [],
                "difficulty": "Intermediate"
            }

        formulas = re.findall(r'([A-Za-z\s]+\s*=\s*[^.\n]+)', text)
        clean_formulas = [f.strip() for f in formulas if len(f.strip()) < 80][:5]

        if settings.GEMINI_API_KEY or settings.OPENAI_API_KEY:
            llm_metadata = DocumentIntelligence._extract_via_llm(text[:3000])
            if llm_metadata:
                return llm_metadata

        # Rule-based robust extraction
        lines = [line.strip() for line in text.split('\n') if len(line.strip()) > 3]
        concepts = list(set([line[:40] for line in lines[:8]]))
        if not concepts:
            concepts = ["Core Concepts", "Learning Takeaways"]

        return {
            "subject": "Computer Science / General",
            "topic": filename.rsplit('.', 1)[0].replace('_', ' ').replace('-', ' ').title(),
            "concepts": concepts[:5],
            "formulas": clean_formulas,
            "difficulty": "Intermediate"
        }

    @staticmethod
    def _extract_via_llm(text_sample: str) -> Dict[str, Any]:
        prompt = (
            "Analyze the following snippet and return valid JSON with keys 'subject', 'topic', 'concepts', 'formulas', 'difficulty'.\n\n"
            f"Snippet:\n{text_sample}\n\nJSON output:"
        )

        try:
            if settings.GEMINI_API_KEY:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(prompt)
                raw_json = response.text.strip().replace('```json', '').replace('```', '')
                return json.loads(raw_json)
        except Exception as e:
            logger.warning(f"LLM Document Intelligence extraction error: {e}")

        return None
