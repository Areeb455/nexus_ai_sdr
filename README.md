# Nexus AI SDR — Autonomous Sales Development Platform

> An autonomous multi-agent B2B sales development platform powered by **Google Vertex AI (Gemini 3.7 Flash)**, **FastAPI**, and **Next.js**.

---

## ⚡ Overview & End-to-End Flow

Nexus AI SDR coordinates three specialized, cooperating AI agents to automate account research, lead qualification, and hyper-personalized cold outreach.

```
+-----------------------------------------------------------------------------------+
|                                 Next.js 14 Web UI                                 |
|          (Pipeline Cockpit, Lead Scorecards, Real-time Agent Execution)           |
+-----------------------------------------+-----------------------------------------+
                                          | REST API (JWT Auth)
                                          v
+-----------------------------------------------------------------------------------+
|                               FastAPI Core Backend                                |
|        (Lead Store, Workflow State Machine, SQLite / PostgreSQL Persistence)      |
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
|   (Pain Points,  +---------------->+ (ICP Fit Scoring, +--------->+ (Personalized    |
|   Tech Stack,    |  Intelligence   |  Signals & Flags) | Context  |  Cadence & Copy) |
| Decision Makers) |     Handoff     |                   | Handoff  |                  |
+--------+---------+                 +---------+---------+          +--------+---------+
         |                                     |                             |
         +-------------------------------------+-----------------------------+
                                               |
                                               v
                          +------------------------------------------+
                          |   LLM Engine: Google Cloud Vertex AI     |
                          |     gemini-3.7-flash (Cascade to 2.5)    |
                          +------------------------------------------+
```

---

## 🤖 The Multi-Agent Pipeline

1. **Research Agent**: Ingests prospect domain and metadata. Extracts business model, competitive landscape, tech stack, and strategic pain points.
2. **Qualification Agent**: Evaluates company scale, buyer authority, and ICP criteria. Generates an objective score (0–100), categorization (`HIGH_FIT`, `MEDIUM_FIT`, `LOW_FIT`), and rationale.
3. **Email Agent**: Synthesizes research and ICP context into hyper-personalized initial outreach and follow-up emails with value propositions and low-friction CTAs.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI (Python 3.10 / 3.11), SQLAlchemy ORM, Pydantic v2
- **Database**: SQLite (default local) / PostgreSQL (production ready)
- **AI Engine**: Google Cloud Vertex AI SDK (`gemini-3.7-flash` via Service Account)

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10+ or 3.11
- Node.js 18+ and npm

### 2. Backend Setup
```bash
cd backend

# Create & activate virtual environment (optional)
python -m venv venv
# Windows: venv\Scripts\activate | Linux/macOS: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations & start FastAPI server
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Access the application at `http://localhost:3000`.

---

## 🔐 Google Cloud Vertex AI Configuration

To run with live Gemini 3.7 Flash:
1. Place your GCP Service Account JSON key inside `backend/` as `gemini_friend_dedicated_key.json` (gitignored).
2. Configure settings in `backend/.env` or `backend/app/core/config.py`:
   ```env
   DEFAULT_AI_PROVIDER=vertex
   GCP_PROJECT_ID=kiitfest-backend-01455
   GCP_LOCATION=global
   GOOGLE_APPLICATION_CREDENTIALS=gemini_friend_dedicated_key.json
   ```

---

## 🧪 Testing

```bash
cd backend
pytest tests/
```

---

## 📄 License
MIT License.
