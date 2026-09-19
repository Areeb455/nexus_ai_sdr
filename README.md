<div align="center">

# NEXUS AI SDR

## Autonomous Multi-Agent Sales Platform

Autonomous Sales Development Representative (SDR) powered by cooperating **Research**, **Qualification**, and **Email** agents built on **Gemini**, **FastAPI**, and **Next.js**.

</div>

---

## Live Deployments

| Component | Service URL |
| :--- | :--- |
| **Frontend Web App** | [nexus-sdr-frontend.onrender.com](https://nexus-sdr-frontend.onrender.com) |
| **Backend API (FastAPI)** | [nexus-sdr-backend.onrender.com](https://nexus-sdr-backend.onrender.com) |
| **Interactive API Docs (Swagger)** | [nexus-sdr-backend.onrender.com/docs](https://nexus-sdr-backend.onrender.com/docs) |
| **GitHub Repository** | [github.com/Areeb455/nexus_ai_sdr](https://github.com/Areeb455/nexus_ai_sdr) |

> Services run on Render's free tier and spin down when idle. The first request after inactivity can take up to a minute.

**Demo account:** `demo@nexus.ai` / `password123`

---

## Overview

Nexus AI SDR helps a sales team discover prospects, understand and qualify them, and generate personalized outreach. Three specialized agents own research, qualification, and email generation. They pass structured data to one another, and every output is persisted so the full lifecycle of a lead can be reviewed from the dashboard.

---

## Key Platform Capabilities

### 1. Multi-Agent Pipeline

**Research Agent**

- Gathers public information about the target company and its website.
- Extracts products, business model, technology stack, and operational pain points.
- Applies guardrails against generic or unsupported claims.

**Qualification Agent**

- Evaluates each prospect against an Ideal Customer Profile (ICP) rubric across four dimensions: *Role Authority*, *Industry Fit*, *Company Scale*, and *Urgency / Intent Signals*.
- Produces an ICP score (0-100), a classification (`HIGH_FIT`, `MEDIUM_FIT`, `LOW_FIT`), positive drivers, and risk factors.

**Email Agent**

- Generates a two-touch outbound cadence: an introduction email and a follow-up sent three days later.
- Personalizes each message using the lead's role, company context, and researched pain points.
- Does not produce bracketed placeholders or generic templates.

### 2. Autonomous Prospector

Enter a company name or domain (for example `stripe.com` or `linear.app`) and the orchestrator will:

1. Inspect the target's web presence.
2. Identify likely decision-maker personas.
3. Run commercial research.
4. Compute the ICP qualification score.
5. Draft the email cadence.

### 3. Dashboard

- Pipeline overview with lead counts, ICP breakdown, and outbound volume.
- Searchable and filterable lead list.
- Lead workspace showing research, qualification scorecard, email drafts, and activity history.
- Company logos resolved automatically, with a text monogram fallback.
- Email dispatch through Gmail (pre-filled in a new tab) or the default mail client (`mailto:`). Sending marks the lead as `CONTACTED` and records an activity entry.

---

## Architecture

```
+-----------------------------------------------------------------------------------+
|                                  Next.js Web UI                                   |
|       (Pipeline Cockpit, Lead Workspace, Email Dispatch, Autonomous Prospector)   |
+-----------------------------------------+-----------------------------------------+
                                          | REST API (Bearer JWT)
                                          v
+-----------------------------------------------------------------------------------+
|                              FastAPI Core Backend                                 |
|         (Lead Engine, Multi-Agent Orchestrator, PostgreSQL Persistence)           |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
                     +-----------------------------------------+
                     |         Multi-Agent Orchestrator        |
                     +----+--------------------+----------+----+
                          |                    |          |
        +-----------------+                    |          +------------------+
        v                                      v                             v
+------------------+                 +-------------------+          +------------------+
|  Research Agent  |                 |Qualification Agent|          |   Email Agent    |
|  (Web Telemetry, +---------------->+ (ICP Rubric 0-100,|--------->+ (Multi-Touch     |
|   Tech Stack,    |  Intelligence   |  Drivers & Risks) | Context  |  Cadence & Copy) |
|  Pain Points)    |     Handoff     |                   | Handoff  |                  |
+--------+---------+                 +---------+---------+          +--------+---------+
         |                                     |                             |
         +-------------------------------------+-----------------------------+
                                               |
                                               v
                          +------------------------------------------+
                          |               LLM Engine                 |
                          |       Google Gemini (google-genai)       |
                          +------------------------------------------+
```

### Agent Contracts

| Agent | Input | Output |
| :--- | :--- | :--- |
| **Research** | Lead details, company website or domain | Summary, industry, products, technology stack, pain points, buying signals, sources, confidence |
| **Qualification** | Lead + research output | ICP score, classification, positive drivers, risk factors, reasoning |
| **Email** | Lead + research + qualification | Initial email, follow-up, personalization rationale |

Agents exchange validated Pydantic models rather than free-form text, and each output is stored with a timestamp for the activity history.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | FastAPI, Python 3.11, SQLAlchemy ORM, Pydantic v2, HTTPX |
| **Database** | PostgreSQL (production on Render), SQLite (local development) |
| **AI** | Google Gemini Flash models via the `google-genai` SDK |
| **Deployment** | Render, continuous deployment from GitHub `main` |

---

## REST API

All endpoints are prefixed with `/api/v1` and require a Bearer token, except registration and login. Full schemas are available in the Swagger docs.

### Leads

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/leads` | Create a lead manually |
| `GET` | `/leads` | List leads; search and filter by status and ICP tier |
| `GET` | `/leads/{id}` | Full lead profile with latest research, qualification, and email drafts |
| `PATCH` | `/leads/{id}` | Update lead status or contact details |
| `POST` | `/leads/autonomous-hunt` | Ingest a domain, run all agents, return the enriched lead |
| `GET` | `/leads/metrics` | Pipeline statistics |
| `DELETE` | `/leads/dev/clear-all` | Purge all leads (testing only) |

### Agent Execution

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/leads/{id}/pipeline` | Run the full multi-agent workflow |
| `POST` | `/leads/{id}/research` | Run the Research Agent |
| `POST` | `/leads/{id}/qualify` | Run the Qualification Agent |
| `POST` | `/leads/{id}/email` | Run the Email Agent |

### System

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/settings/system-status` | Service health and active AI provider |

---

## Lead Lifecycle

`NEW` → `RESEARCHED` → `QUALIFIED` → `CONTACTED`

---

## Local Development

### Prerequisites

- Python 3.10 or 3.11
- Node.js 18+ and npm
- A Google Gemini API key

### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (see below)
cp .env.example .env

# Seed the database with the demo account and sample leads
python scripts/seed_data.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

Interactive API docs are served at `/docs` on the running backend.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Variables

**Backend** (`backend/.env`)

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Gemini API key (required) |
| `DATABASE_URL` | Database connection string; defaults to local SQLite if unset |
| `SECRET_KEY` | Secret used to sign JWTs |

**Frontend** (`frontend/.env.local`)

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |

Never commit `.env` files. Only `.env.example` belongs in the repository.

---

## Production Build Verification

```bash
cd frontend
npm run build
```

---

## Assumptions and Limitations

- Research relies on publicly available information. Companies with little public presence yield lower-confidence results.
- SQLite is for local development only; PostgreSQL is the intended production database.
- Generated content should be reviewed by a person before it is sent.

---

## License

MIT License.
