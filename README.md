Nexus AI SDR

A multi-agent sales development platform. A user adds a lead (or enters a company domain), and three cooperating agents research the company, score it against an Ideal Customer Profile (ICP), and draft personalized outreach. Results are stored per lead and managed through a dashboard.

Frontend: https://nexus-sdr-frontend.onrender.com
Backend API: https://nexus-sdr-backend.onrender.com
API docs (Swagger): https://nexus-sdr-backend.onrender.com/docs

The services run on Render's free tier and spin down when idle. The first request after a period of inactivity can take up to a minute.

Demo account: demo@nexus.ai / password123

Features
JWT authentication (register, login, protected routes)
Lead management: create, list, search, filter by status and ICP tier, update, delete
Three agents, runnable individually or as a single pipeline
Autonomous prospecting: enter a company name or domain and the pipeline creates the lead and runs all three agents
Activity trail and pipeline metrics on the dashboard
Email drafts can be opened in Gmail or the default mail client; sending marks the lead as CONTACTED and records an activity entry
Architecture
REST + Bearer JWT
research profile
score + signals
Next.js frontend
FastAPI backend
PostgreSQL
Orchestrator
Research Agent
Qualification Agent
Email Agent
Google Gemini API
Agents
Agent	Input	Output
Research	Lead details, company website / domain	Company summary, industry, products, technology stack, pain points, buying signals, sources, confidence
Qualification	Lead + research output	ICP score (0-100), classification (HIGH_FIT, MEDIUM_FIT, LOW_FIT), positive drivers, risk factors, reasoning
Email	Lead + research + qualification	Initial email, follow-up (sent 3 days later), personalization rationale

Agents exchange validated Pydantic models rather than free-form text. Each agent's output is persisted with a timestamp so it can be displayed in the lead's history.

Qualification rubric

The score is based on four dimensions:

Role authority
Industry fit
Company scale
Urgency and intent signals
Tech stack
Layer	Technology
Frontend	Next.js (App Router), React, TypeScript, Tailwind CSS
Backend	FastAPI, Python 3.11, SQLAlchemy, Pydantic v2, HTTPX
Database	PostgreSQL (production), SQLite (local development)
LLM	Google Gemini via the google-genai SDK
Hosting	Render, deployed from main
Getting started
Prerequisites
Python 3.10+
Node.js 18+
A Google Gemini API key
Backend
bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then fill in the values below
python scripts/seed_data.py
uvicorn app.main:app --reload

The API serves interactive documentation at /docs.

Frontend
bash
cd frontend
npm install
cp .env.example .env.local      # then fill in the values below
npm run dev
Environment variables

Backend (backend/.env):

Variable	Description
GEMINI_API_KEY	Gemini API key (required)
DATABASE_URL	Database connection string. Defaults to a local SQLite file if unset
SECRET_KEY	Secret used to sign JWTs

Frontend (frontend/.env.local):

Variable	Description
NEXT_PUBLIC_API_URL	Base URL of the backend API

Never commit .env files. Only .env.example files belong in the repository.

API overview

All endpoints are prefixed with /api/v1 and require a Bearer token except registration and login. Full request and response schemas are available in the Swagger docs.

Leads
Method	Endpoint	Description
POST	/leads	Create a lead
GET	/leads	List leads; supports search and filters by status and ICP tier
GET	/leads/{id}	Lead detail with latest research, qualification and email drafts
PATCH	/leads/{id}	Update lead details or status
POST	/leads/autonomous-hunt	Create a lead from a company name or domain and run the full pipeline
GET	/leads/metrics	Pipeline statistics
Agents
Method	Endpoint	Description
POST	/leads/{id}/research	Run the Research Agent
POST	/leads/{id}/qualify	Run the Qualification Agent
POST	/leads/{id}/email	Run the Email Agent
POST	/leads/{id}/pipeline	Run all three agents in sequence
System
Method	Endpoint	Description
GET	/settings/system-status	Service health and active LLM provider
Lead lifecycle

NEW → RESEARCHED → QUALIFIED → CONTACTED

Project structure
backend/
  app/
    api/          Route handlers
    agents/       Research, qualification and email agents, orchestrator
    models/       Database models
    schemas/      Pydantic request/response models
  scripts/        Seed data
frontend/
  app/            Next.js routes and components
Assumptions and limitations
Research relies on publicly available information. Companies with little public presence produce lower-confidence results.
SQLite is used for local development only; PostgreSQL is the intended production database.
LLM output is validated against schemas, but content quality depends on the underlying model and should be reviewed by a person before sending.
License

MIT
