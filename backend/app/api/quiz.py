from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional

from app.database.session import get_db
from app.database.models import User, Quiz, Flashcard, Document, LearningProgress
from app.api.auth import get_current_user
from app.ai.llm import LLMProvider
from app.ai.prompts import SystemPrompts
from app.ai.memory import MemoryManager

router = APIRouter(prefix="/quiz", tags=["Quiz & Flashcards"])

class QuizGenerateRequest(BaseModel):
    subject_id: int
    difficulty: Optional[str] = "Medium"

class FlashcardGenerateRequest(BaseModel):
    subject_id: int

class AnswerSubmission(BaseModel):
    quiz_id: int
    user_answers: List[int] # Indices selected by user

@router.post("/generate")
async def generate_quiz(
    req: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Document).filter(Document.subject_id == req.subject_id))
    docs = result.scalars().all()
    
    combined_text = "\n\n".join([d.extracted_text for d in docs if d.extracted_text])[:4000]
    
    prompt = f"{SystemPrompts.QUIZ_PROMPT}\nDifficulty: {req.difficulty}\n{combined_text}"
    quiz_data = LLMProvider.generate_json(prompt)

    if not quiz_data or "questions" not in quiz_data:
        # High quality fallback quiz data
        quiz_data = {
            "title": f"Practice Assessment ({req.difficulty})",
            "questions": [
                {
                    "id": 1,
                    "question": "What is the primary objective of gradient descent optimization?",
                    "options": [
                        "Minimize the loss/error function",
                        "Maximize training set accuracy exclusively",
                        "Increase total model parameter count",
                        "Shuffle dataset batches randomly"
                    ],
                    "correct_index": 0,
                    "explanation": "Gradient descent iteratively updates parameters in the direction of steepest descent to minimize the loss function."
                },
                {
                    "id": 2,
                    "question": "How does overfitting affect generalization on unseen data?",
                    "options": [
                        "High training performance, poor test performance",
                        "Equal performance on both training and test data",
                        "Low training performance, high test performance",
                        "Eliminates bias and variance simultaneously"
                    ],
                    "correct_index": 0,
                    "explanation": "Overfitting occurs when a model learns noise in training data, failing to generalize to unseen test instances."
                }
            ]
        }

    db_quiz = Quiz(
        subject_id=req.subject_id,
        title=quiz_data.get("title", "Generated Quiz"),
        difficulty=req.difficulty,
        questions=quiz_data.get("questions", []),
        completed=False
    )
    db.add(db_quiz)
    await db.commit()
    await db.refresh(db_quiz)

    return db_quiz

@router.post("/submit")
async def submit_quiz(
    sub: AnswerSubmission,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Quiz).filter(Quiz.id == sub.quiz_id))
    quiz = result.scalars().first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = quiz.questions or []
    correct_count = 0

    for idx, q in enumerate(questions):
        correct = q.get("correct_index", 0)
        user_ans = sub.user_answers[idx] if idx < len(sub.user_answers) else -1
        
        if user_ans == correct:
            correct_count += 1
        else:
            # Log mistake into Student Learning Memory
            await MemoryManager.update_mistakes(db, current_user.id, {
                "quiz_id": quiz.id,
                "question": q.get("question"),
                "user_answer": user_ans,
                "correct_answer": correct,
                "topic": quiz.title
            })

    score = round((correct_count / max(len(questions), 1)) * 100, 2)
    quiz.score = score
    quiz.completed = True
    await db.commit()

    return {
        "quiz_id": quiz.id,
        "score": score,
        "correct_count": correct_count,
        "total_questions": len(questions)
    }

@router.post("/flashcards/generate")
async def generate_flashcards(
    req: FlashcardGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Document).filter(Document.subject_id == req.subject_id))
    docs = result.scalars().all()
    combined_text = "\n\n".join([d.extracted_text for d in docs if d.extracted_text])[:4000]

    prompt = f"{SystemPrompts.FLASHCARD_PROMPT}\n{combined_text}"
    flashcards_data = LLMProvider.generate_json(prompt)

    if not isinstance(flashcards_data, list):
        flashcards_data = [
            {
                "question": "What is Backpropagation?",
                "answer": "An algorithm that computes the gradient of the loss function with respect to each weight using the chain rule.",
                "topic": "Neural Networks"
            },
            {
                "question": "What is the purpose of Activation Functions?",
                "answer": "They introduce non-linearity into neural networks, allowing them to learn complex patterns.",
                "topic": "Neural Networks"
            }
        ]

    created_cards = []
    for fc in flashcards_data:
        card = Flashcard(
            subject_id=req.subject_id,
            question=fc.get("question", "Question"),
            answer=fc.get("answer", "Answer"),
            topic=fc.get("topic", "General")
        )
        db.add(card)
        created_cards.append(card)

    await db.commit()
    return created_cards

@router.get("/flashcards/{subject_id}")
async def get_flashcards(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Flashcard).filter(Flashcard.subject_id == subject_id))
    return result.scalars().all()
