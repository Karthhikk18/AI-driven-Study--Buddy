import os

class Settings:
    PROJECT_NAME: str = "AI Study Buddy - AI Learning OS"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production-study-buddy-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database & Storage Paths
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./study_buddy.db")
    STORAGE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage"))
    FAISS_INDEX_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage/faiss_index"))
    
    # OCR & Document Processing
    OCR_CONFIDENCE_THRESHOLD: float = 75.0
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", None)
    
    # AI Providers
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", None)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", None)
    DEFAULT_LLM_PROVIDER: str = os.getenv("DEFAULT_LLM_PROVIDER", "gemini")

settings = Settings()

os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(settings.FAISS_INDEX_DIR, exist_ok=True)
