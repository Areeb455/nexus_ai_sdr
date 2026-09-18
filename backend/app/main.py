from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.api import auth, leads, agents, activity, settings as settings_api

# Automatically initialize database schema on launch
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NEXUS AI SDR API",
    description="""
# Nexus AI SDR — Multi-Agent Sales Development Platform
Autonomous sales intelligence, ICP qualification, and hyper-personalized outreach.

### Cooperating Multi-Agent Architecture
1. **Research Agent**: Deep prospect & company sales intelligence synthesis
2. **Qualification Agent**: Objective ICP scoring (0-100), categorization, and signal analysis
3. **Email Agent**: Hyper-personalized initial cold outreach, follow-ups, and rationale
""",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins() if settings.get_cors_origins() else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(leads.router, prefix=settings.API_V1_STR)
app.include_router(agents.router, prefix=settings.API_V1_STR)
app.include_router(activity.router, prefix=settings.API_V1_STR)
app.include_router(settings_api.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
def root():
    return {
        "service": "Nexus AI SDR Platform API",
        "status": "online",
        "documentation": "/docs",
        "version": "1.0.0"
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
