# Nexus AI SDR — Autonomous Multi-Agent Sales Platform

> Autonomous Sales Development Representative (SDR) powered by cooperating **Research**, **Qualification**, and **Email** agents built on **Gemini 3.6 Flash**, **FastAPI**, and a **Next.js (App Router)** minimalist OLED dark interface.

---

## 🌐 Live Deployments

| Component | Service URL | Status |
| :--- | :--- | :---: |
| **Frontend Web App** | [nexus-sdr-frontend.onrender.com](https://nexus-sdr-frontend.onrender.com) | 🟢 Live |
| **Backend API (FastAPI)** | [nexus-sdr-backend.onrender.com](https://nexus-sdr-backend.onrender.com) | 🟢 Live |
| **Interactive API Docs (Swagger)** | [nexus-sdr-backend.onrender.com/docs](https://nexus-sdr-backend.onrender.com/docs) | 🟢 Live |
| **GitHub Repository** | [github.com/Areeb455/nexus_ai_sdr](https://github.com/Areeb455/nexus_ai_sdr) | 🟢 Active |

---

## ✨ Key Platform Capabilities

### 1. Autonomous Multi-Agent Pipeline
- **🔍 Research Agent**:
  - Crawls public web presence and grounded corporate registries in real time.
  - Extracts verified products, business models, tech stack components, and operational GTM bottlenecks.
  - Enforces strict anti-hallucination guardrails to avoid generic filler.
- **🎯 Qualification Agent**:
  - Evaluates prospects against an objective Ideal Customer Profile (ICP) rubric across 4 dimensions: *Role Authority*, *Industry Fit*, *Company Scale*, and *Urgency/Intent Signals*.
  - Generates a quantified ICP score (0–100), classification (`HIGH_FIT`, `MEDIUM_FIT`, `LOW_FIT`), positive drivers, and risk factors.
- **✉️ Outreach Email Studio**:
  - Generates hyper-personalized multi-touch outbound cadences (**Touch 1 Introduction** + **Touch 2 Follow-Up Bump** after 3 days).
  - Automatically personalizes based on the lead's role, company context, and verified operational bottlenecks.
  - Strictly prohibits bracketed placeholders (`[Prospect Name]`) or generic templates.

### 2. ⚡ Autonomous 1-Click Prospector (Company Hunter)
- Enter any company name or domain (e.g. `zomato.com`, `linear.app`, `stripe.com`, `datadoghq.com`).
- The multi-agent orchestrator autonomously:
  1. Inspects the target's web presence and telemetry.
  2. Synthesizes executive decision-maker personas.
  3. Executes deep commercial research.
  4. Computes ICP qualification scores.
  5. Drafts tailored multi-touch email campaigns.

### 3. 🎨 Minimalist OLED Black Interface
- **Obsidian Dark Aesthetic**: Built on pure OLED black surfaces (`#000000` / `#0a0a0c`), subtle inner highlights, and crisp hairline borders (`border-white/[0.08]`).
- **Fluid Micro-Interactions**: Powered by `framer-motion` for staggered entrances, interactive tabs, and layout transitions.
- **Dynamic Brand Logo Engine**: Automatically queries Google's FaviconV2 CDN and Unavatar to render official high-res brand logos with an automatic typography monogram fallback.
- **1-Click Pre-Filled Email Dispatch**:
  - **Open & Send in Gmail**: Launches the official Gmail Web Composer in a new tab with recipient, subject, and the agent's drafted email body pre-populated.
  - **Default Mail Client (`mailto:`)**: Supports local email clients (Outlook, Apple Mail).
  - Automatically marks the prospect as `CONTACTED` and records an audit log entry.

---

## ⚡ Architecture & Agent Workflow

```
+-----------------------------------------------------------------------------------+
|                        Next.js Web UI (OLED Minimalist)                           |
|       (Pipeline Cockpit, Lead Bento Workspace, Live Email Dispatch, Hunter)       |
+-----------------------------------------+-----------------------------------------+
                                          | REST API (Bearer JWT)
                                          v
+-----------------------------------------------------------------------------------+
|                              FastAPI Core Backend                                 |
|         (Lead Engine, Multi-Agent Orchestrator, PostgreSQL Persistence)          |
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
                          |      LLM Engine (High-Reasoning)         |
                          |   gemini-3.6-flash / gemini-3.7-flash    |
                          +------------------------------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | FastAPI, Python 3.11, SQLAlchemy ORM, Pydantic v2, HTTPX |
| **Database** | PostgreSQL (Production on Render) / SQLite (Local dev) |
| **AI Models** | Google Gemini 3.6 Flash / Gemini 3.7 Flash (`google-genai` SDK) |
| **Deployment** | Render (Web Services with continuous deployment from GitHub `main`) |

---

## 📡 Key REST API Endpoints

### Autonomous Prospecting & Leads
- `POST /api/v1/leads/autonomous-hunt` — 1-click autonomous prospector (ingests domain, runs all agents, returns enriched lead).
- `GET /api/v1/leads` — List leads with search and filter by status (`NEW`, `RESEARCHED`, `QUALIFIED`, `CONTACTED`) and ICP tier.
- `GET /api/v1/leads/{id}` — Retrieve full lead profile with latest research, qualification scorecard, and email drafts.
- `POST /api/v1/leads` — Create a prospect lead manually.
- `PATCH /api/v1/leads/{id}` — Update lead status or contact details.
- `DELETE /api/v1/leads/dev/clear-all` — Clean slate purge (for testing).

### Agent Execution Triggers
- `POST /api/v1/leads/{id}/pipeline` — Execute full multi-agent cooperative workflow.
- `POST /api/v1/leads/{id}/research` — Execute Research Agent individually.
- `POST /api/v1/leads/{id}/qualify` — Execute Qualification Agent individually.
- `POST /api/v1/leads/{id}/email` — Execute Outreach Email Agent individually.

### System & Metrics
- `GET /api/v1/leads/metrics` — Pipeline statistics (total leads, ICP breakdown, outbound volume, velocity).
- `GET /api/v1/settings/system-status` — Health telemetry and active AI provider state.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Python 3.10 or 3.11
- Node.js 18+ and npm

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables in backend/.env
# GEMINI_API_KEY=your_gemini_api_key

# Seed database with demo accounts & default leads
python scripts/seed_data.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
- Local API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Demo Account: `demo@nexus.ai` / `password123`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
- Local Web App: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Production Verification

To build and verify the Next.js production bundle:
```bash
cd frontend
npm run build
```

---

## 📄 License
MIT License.
