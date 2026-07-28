from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database.session import get_db
from app.database.models import User, Document, Quiz, Flashcard
from app.api.auth import get_current_user
from app.ai.memory import MemoryManager

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
async def get_dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    memory = await MemoryManager.get_or_create_memory(db, current_user.id)

    # Documents total
    doc_res = await db.execute(select(Document))
    docs = doc_res.scalars().all()

    # Quizzes total
    quiz_res = await db.execute(select(Quiz).filter(Quiz.completed == True))
    quizzes = quiz_res.scalars().all()
    avg_score = round(sum([q.score or 0 for q in quizzes]) / max(len(quizzes), 1), 1)

    # Flashcards total
    fc_res = await db.execute(select(Flashcard))
    flashcards = fc_res.scalars().all()

    return {
        "user_name": current_user.name,
        "total_documents": len(docs),
        "total_quizzes_taken": len(quizzes),
        "average_quiz_score": avg_score,
        "total_flashcards": len(flashcards),
        "weak_concepts": memory.weak_concepts or [],
        "preferred_explanation_style": memory.preferred_explanation_style,
        "recent_mistakes": (memory.mistake_log or [])[-5:]
    }
