from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional

from app.database.session import get_db
from app.database.models import User
from app.api.auth import get_current_user
from app.rag.retriever import RAGRetriever
from app.ai.prompts import SystemPrompts
from app.ai.llm import LLMProvider
from app.ai.memory import MemoryManager

router = APIRouter(prefix="/chat", tags=["AI Tutor Chat"])

class ChatRequest(BaseModel):
    subject_id: int
    query: str
    mode: Optional[str] = "Intermediate" # Beginner, Intermediate, Advanced, Exam Preparation

class Citation(BaseModel):
    source_id: int
    filename: str
    page_number: int

class ChatResponse(BaseModel):
    response: str
    mode: str
    sources: List[Citation]

@router.post("/", response_model=ChatResponse)
async def chat_with_tutor(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch Student Learning Memory
    memory = await MemoryManager.get_or_create_memory(db, current_user.id)
    weak_concepts = memory.weak_concepts or []

    # 2. Retrieve relevant context using RAG
    rag_data = RAGRetriever.retrieve_relevant_context(
        subject_id=request.subject_id, 
        query=request.query, 
        top_k=4
    )

    # 3. Construct tutor prompt
    prompt = SystemPrompts.build_chat_prompt(
        context=rag_data["context"],
        query=request.query,
        mode=request.mode,
        weak_concepts=weak_concepts
    )

    # 4. Generate tutor response via LLM
    response_text = LLMProvider.generate_response(prompt)

    sources = [
        Citation(
            source_id=s["source_id"],
            filename=s["filename"],
            page_number=s["page_number"]
        ) for s in rag_data["sources"]
    ]

    return ChatResponse(
        response=response_text,
        mode=request.mode,
        sources=sources
    )
