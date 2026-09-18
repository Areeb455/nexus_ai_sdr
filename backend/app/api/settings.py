from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db, engine
from app.api.auth import get_current_user
from app.agents.llm_engine import llm_engine
from app.core.config import settings

router = APIRouter(prefix="/settings", tags=["Settings & System Status"])

@router.get("/system-status")
def get_system_status(db: Session = Depends(get_db)):
    db_dialect = engine.dialect.name
    return {
        "status": "healthy",
        "service": "Nexus AI SDR Core API",
        "database_dialect": db_dialect,
        "active_ai_provider": llm_engine.get_active_provider(),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "default_provider_setting": settings.DEFAULT_AI_PROVIDER,
        "icp_criteria": {
            "target_industries": ["B2B SaaS", "Enterprise Software", "Fintech", "Cloud Infrastructure", "Data Platforms"],
            "target_roles": ["VP of Sales", "Head of RevOps", "CRO", "CCO", "Director of Sales", "Founder / CEO"],
            "target_company_sizes": ["50-200", "200-500", "500-1000"],
            "qualification_thresholds": {
                "high_fit_min": 75,
                "medium_fit_min": 50,
                "low_fit_max": 49
            }
        }
    }
