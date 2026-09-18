from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Enum, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class LeadStatus(str, enum.Enum):
    NEW = "NEW"
    RESEARCHED = "RESEARCHED"
    QUALIFIED = "QUALIFIED"
    DISQUALIFIED = "DISQUALIFIED"
    CONTACTED = "CONTACTED"
    FOLLOW_UP = "FOLLOW_UP"
    MEETING_BOOKED = "MEETING_BOOKED"
    CONVERTED = "CONVERTED"
    NOT_INTERESTED = "NOT_INTERESTED"

class FitCategory(str, enum.Enum):
    HIGH_FIT = "HIGH_FIT"
    MEDIUM_FIT = "MEDIUM_FIT"
    LOW_FIT = "LOW_FIT"

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    
    leads = relationship("Lead", back_populates="owner", cascade="all, delete-orphan")
    activities = relationship("ActivityLog", back_populates="user")

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    company_name = Column(String(255), nullable=False, index=True)
    contact_name = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=True, index=True)
    role = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    industry = Column(String(100), nullable=True, index=True)
    company_size = Column(String(50), nullable=True)
    location = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default=LeadStatus.NEW.value, index=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    owner = relationship("User", back_populates="leads")
    research_results = relationship("ResearchResult", back_populates="lead", cascade="all, delete-orphan", order_by="desc(ResearchResult.created_at)")
    qualification_results = relationship("QualificationResult", back_populates="lead", cascade="all, delete-orphan", order_by="desc(QualificationResult.created_at)")
    email_outputs = relationship("EmailOutput", back_populates="lead", cascade="all, delete-orphan", order_by="desc(EmailOutput.created_at)")
    activities = relationship("ActivityLog", back_populates="lead", cascade="all, delete-orphan", order_by="desc(ActivityLog.timestamp)")

class ResearchResult(Base):
    __tablename__ = "research_results"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    summary = Column(Text, nullable=True)
    company_overview = Column(Text, nullable=True)
    target_pain_points = Column(JSON, nullable=True)  # list of strings
    key_decision_makers = Column(JSON, nullable=True)  # list of profiles/signals
    technology_stack = Column(JSON, nullable=True)  # list of detected tech
    growth_signals = Column(JSON, nullable=True)  # list of recent signals
    sources = Column(JSON, nullable=True)  # list of sources / domains researched
    confidence_score = Column(Float, default=0.85)
    raw_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    lead = relationship("Lead", back_populates="research_results")

class QualificationResult(Base):
    __tablename__ = "qualification_results"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    score = Column(Integer, nullable=False)  # 0 to 100
    fit_category = Column(String(50), nullable=False)  # HIGH_FIT, MEDIUM_FIT, LOW_FIT
    reasoning = Column(Text, nullable=False)
    positive_signals = Column(JSON, nullable=True)  # list of strings
    negative_signals = Column(JSON, nullable=True)  # list of strings
    icp_fit_breakdown = Column(JSON, nullable=True)  # dict with role, industry, size, intent scores
    created_at = Column(DateTime, default=utcnow)

    lead = relationship("Lead", back_populates="qualification_results")

class EmailOutput(Base):
    __tablename__ = "email_outputs"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    follow_up_subject = Column(String(255), nullable=True)
    follow_up_body = Column(Text, nullable=True)
    personalization_rationale = Column(Text, nullable=True)
    tone = Column(String(50), default="professional_concise")
    metadata_info = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    lead = relationship("Lead", back_populates="email_outputs")

class ActivityLog(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    agent_name = Column(String(50), nullable=True)  # "RESEARCH_AGENT", "QUALIFICATION_AGENT", "EMAIL_AGENT", "HUMAN"
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=utcnow, index=True)

    lead = relationship("Lead", back_populates="activities")
    user = relationship("User", back_populates="activities")
