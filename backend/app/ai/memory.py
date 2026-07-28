from typing import List, Dict, Any
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import StudentMemory

class MemoryManager:
    @staticmethod
    async def get_or_create_memory(db: AsyncSession, user_id: int) -> StudentMemory:
        result = await db.execute(select(StudentMemory).filter(StudentMemory.user_id == user_id))
        memory = result.scalars().first()
        if not memory:
            memory = StudentMemory(
                user_id=user_id,
                weak_concepts=[],
                mistake_log=[],
                preferred_explanation_style="Intermediate"
            )
            db.add(memory)
            await db.commit()
            await db.refresh(memory)
        return memory

    @staticmethod
    async def update_mistakes(db: AsyncSession, user_id: int, mistake: Dict[str, Any]):
        memory = await MemoryManager.get_or_create_memory(db, user_id)
        mistake_log = list(memory.mistake_log or [])
        mistake_log.append(mistake)
        memory.mistake_log = mistake_log[-20:] # Keep last 20 mistakes

        topic = mistake.get("topic")
        if topic:
            weak = list(memory.weak_concepts or [])
            if topic not in weak:
                weak.append(topic)
                memory.weak_concepts = weak

        await db.commit()
