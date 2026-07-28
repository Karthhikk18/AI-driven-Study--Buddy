import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    workspaces = relationship("Workspace", back_populates="user", cascade="all, delete-orphan")
    learning_progress = relationship("LearningProgress", back_populates="user", cascade="all, delete-orphan")
    student_memory = relationship("StudentMemory", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Workspace(Base):
    __tablename__ = "workspaces"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="workspaces")
    subjects = relationship("Subject", back_populates="workspace", cascade="all, delete-orphan")

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    workspace = relationship("Workspace", back_populates="subjects")
    documents = relationship("Document", back_populates="subject", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="subject", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="subject", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False) # pdf, ppt, image, handwritten_note
    ocr_status = Column(String(50), default="pending") # pending, processing, completed, failed
    ocr_confidence = Column(Float, default=0.0)
    extracted_text = Column(Text, nullable=True)
    intelligence_metadata = Column(JSON, nullable=True) # {subject, topic, concepts, difficulty, formulas}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    subject = relationship("Subject", back_populates="documents")
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")

class Chunk(Base):
    __tablename__ = "chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, default=1)
    chunk_index = Column(Integer, default=0)
    embedding_id = Column(String(100), nullable=True)
    chunk_metadata = Column(JSON, nullable=True)
    
    document = relationship("Document", back_populates="chunks")

class Quiz(Base):
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    title = Column(String(200), nullable=False)
    difficulty = Column(String(50), default="Medium") # Easy, Medium, Hard
    questions = Column(JSON, nullable=False) # list of {question, options, correct_index, explanation}
    score = Column(Float, nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    subject = relationship("Subject", back_populates="quizzes")

class Flashcard(Base):
    __tablename__ = "flashcards"
    
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    topic = Column(String(100), default="General")
    confidence_level = Column(Integer, default=0) # 0-5
    last_reviewed = Column(DateTime, nullable=True)
    
    subject = relationship("Subject", back_populates="flashcards")

class LearningProgress(Base):
    __tablename__ = "learning_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic = Column(String(100), nullable=False)
    mastery_score = Column(Float, default=0.0) # 0.0 - 100.0
    total_quizzes = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    last_studied = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="learning_progress")

class StudentMemory(Base):
    __tablename__ = "student_memory"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    weak_concepts = Column(JSON, default=list) # ["Gradient Descent", "Backpropagation"]
    mistake_log = Column(JSON, default=list) # [{question, user_answer, correct_answer, topic, timestamp}]
    preferred_explanation_style = Column(String(50), default="Intermediate") # Beginner, Intermediate, Advanced, Exam Prep
    
    user = relationship("User", back_populates="student_memory")
