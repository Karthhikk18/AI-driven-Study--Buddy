import os
import shutil
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTask
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from app.database.session import get_db
from app.database.models import User, Workspace, Subject, Document, Chunk
from app.api.auth import get_current_user
from app.core.config import settings
from app.document_engine.parsers import DocumentParser
from app.rag.chunking import Chunker
from app.rag.vectorstore import VectorStore

router = APIRouter(prefix="/documents", tags=["Documents"])

class SubjectCreate(BaseModel):
    name: str

class SubjectResponse(BaseModel):
    id: int
    name: str
    workspace_id: int

@router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).filter(Workspace.user_id == current_user.id))
    workspaces = result.scalars().all()
    workspace_ids = [w.id for w in workspaces]

    if not workspace_ids:
        return []

    subj_result = await db.execute(select(Subject).filter(Subject.workspace_id.in_(workspace_ids)))
    return subj_result.scalars().all()

@router.post("/subjects", response_model=SubjectResponse)
async def create_subject(
    subj_in: SubjectCreate, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Workspace).filter(Workspace.user_id == current_user.id))
    workspace = result.scalars().first()
    if not workspace:
        workspace = Workspace(user_id=current_user.id, name="Default Workspace")
        db.add(workspace)
        await db.commit()
        await db.refresh(workspace)

    subject = Subject(workspace_id=workspace.id, name=subj_in.name)
    db.add(subject)
    await db.commit()
    await db.refresh(subject)
    return subject

async def _process_document_background(document_id: int, file_path: str, filename: str, subject_id: int, db: AsyncSession):
    """Async Document Processing Pipeline: Parse/OCR -> Chunk -> Document Intelligence -> Vector Index."""
    try:
        parsed = DocumentParser.parse_file(file_path, filename)
        
        # Split into chunks
        chunks = Chunker.chunk_document_pages(parsed["pages"])

        # Fetch document record
        result = await db.execute(select(Document).filter(Document.id == document_id))
        doc = result.scalars().first()
        
        if doc:
            doc.extracted_text = parsed["full_text"]
            doc.ocr_confidence = parsed["ocr_confidence"]
            doc.file_type = parsed["file_type"]
            doc.intelligence_metadata = parsed["intelligence_metadata"]
            doc.ocr_status = "completed"

            # Create chunk entities in DB
            db_chunks = []
            for c in chunks:
                chunk_entity = Chunk(
                    document_id=doc.id,
                    content=c["content"],
                    page_number=c["page_number"],
                    chunk_index=c["chunk_index"]
                )
                db.add(chunk_entity)
                db_chunks.append(chunk_entity)

            await db.commit()

            # Index into FAISS Vector Store
            vstore = VectorStore(subject_id=subject_id)
            vstore.add_chunks(chunks, document_id=doc.id, filename=filename)

    except Exception as e:
        print(f"Error processing document {document_id}: {e}")
        result = await db.execute(select(Document).filter(Document.id == document_id))
        doc = result.scalars().first()
        if doc:
            doc.ocr_status = "failed"
            await db.commit()

@router.post("/upload")
async def upload_document(
    subject_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Subject).filter(Subject.id == subject_id))
    subject = result.scalars().first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    user_storage = os.path.join(settings.STORAGE_DIR, f"user_{current_user.id}")
    os.makedirs(user_storage, exist_ok=True)
    
    file_location = os.path.join(user_storage, f"{int(datetime.datetime.utcnow().timestamp())}_{file.filename}")
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    file_type = "pdf" if ext == "pdf" else ("ppt" if ext in ["ppt", "pptx"] else "image")

    document = Document(
        subject_id=subject_id,
        filename=file.filename,
        file_path=file_location,
        file_type=file_type,
        ocr_status="processing",
        ocr_confidence=0.0
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    # Process pipeline immediately
    await _process_document_background(document.id, file_location, file.filename, subject_id, db)

    return {
        "id": document.id,
        "filename": document.filename,
        "status": "processing",
        "message": "File uploaded and document processing pipeline initiated."
    }

@router.get("/")
async def list_documents(
    subject_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Document)
    if subject_id:
        query = query.filter(Document.subject_id == subject_id)
    
    result = await db.execute(query)
    docs = result.scalars().all()
    
    return [
        {
            "id": d.id,
            "subject_id": d.subject_id,
            "filename": d.filename,
            "file_type": d.file_type,
            "ocr_status": d.ocr_status,
            "ocr_confidence": d.ocr_confidence,
            "intelligence_metadata": d.intelligence_metadata,
            "created_at": d.created_at
        } for d in docs
    ]
