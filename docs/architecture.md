# NEXUS AI SDR — System Architecture & Multi-Agent Design

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer (Frontend)"
        Browser["User Browser"]
        NextApp["Next.js 14+ Dashboard<br/>(React, Lucide, Modular Glassmorphic CSS)"]
        Browser <--> NextApp
    end

    subgraph "API & Security Layer (FastAPI)"
        FastAPIServer["FastAPI Application Gateway (:8000)"]
        AuthMiddleware["JWT Authentication & RBAC Guard"]
        RouterAuth["/api/v1/auth (Registration, Login, Token)"]
        RouterLeads["/api/v1/leads (CRUD, Filters, Metrics)"]
        RouterAgents["/api/v1/leads/:id/agent (Research, Qualify, Email, Pipeline)"]
        RouterActivity["/api/v1/activity (Audit Trail, History)"]
        
        NextApp -->|Bearer JWT + HTTP REST| FastAPIServer
        FastAPIServer --> AuthMiddleware
        AuthMiddleware --> RouterAuth
        AuthMiddleware --> RouterLeads
        AuthMiddleware --> RouterAgents
        AuthMiddleware --> RouterActivity
    end

    subgraph "Orchestration & AI Agent Engine"
        Orchestrator["Agent Orchestrator (State Machine)"]
        State["Typed Workflow State (AgentWorkflowState)"]
        
        Agent1["1. Research Agent<br/>(Company Context, Tech Stack, Pain Points)"]
        Agent2["2. Qualification Agent<br/>(ICP Scoring 0-100, Tier, Pos/Neg Signals)"]
        Agent3["3. Email Agent<br/>(Hyper-Personalized Outreach, Bump, Rationale)"]
        
        LLMEngine["Unified LLM Provider Engine"]
        GeminiAPI["Google Gemini 1.5 Flash / Pro"]
        OpenAIAPI["OpenAI GPT-4o-mini"]
        HeuristicAI["Deterministic Heuristic Fallback Engine"]
        
        RouterAgents --> Orchestrator
        Orchestrator <--> State
        Orchestrator --> Agent1
        Agent1 -->|Enriched Research Context| Agent2
        Agent2 -->|Score, Signals & Recommendation| Agent3
        
        Agent1 -.-> LLMEngine
        Agent2 -.-> LLMEngine
        Agent3 -.-> LLMEngine
        
        LLMEngine --> GeminiAPI
        LLMEngine --> OpenAIAPI
        LLMEngine --> HeuristicAI
    end

    subgraph "Persistence Layer (PostgreSQL / SQLite Fallback)"
        SQLAlchemy["SQLAlchemy 2.0 ORM Engine"]
        PG[(PostgreSQL Database / SQLite File)]
        
        UsersTable["users"]
        LeadsTable["leads"]
        ResearchTable["research_results"]
        QualTable["qualification_results"]
        EmailTable["email_outputs"]
        ActivityTable["activities (Audit Log)"]
        
        RouterLeads --> SQLAlchemy
        Orchestrator --> SQLAlchemy
        SQLAlchemy --> PG
        PG --> UsersTable
        PG --> LeadsTable
        PG --> ResearchTable
        PG --> QualTable
        PG --> EmailTable
        PG --> ActivityTable
    end
```

---

## 2. Multi-Agent Data Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    actor SalesRep as Sales Rep / Recruiter
    participant UI as Next.js Dashboard
    participant API as FastAPI Backend
    participant Orch as Agent Orchestrator
    participant State as AgentWorkflowState
    participant R_Agent as 1. Research Agent
    participant Q_Agent as 2. Qualification Agent
    participant E_Agent as 3. Email Agent
    participant DB as Database (PostgreSQL)

    SalesRep->>UI: Clicks "Run Full Multi-Agent Pipeline"
    UI->>API: POST /api/v1/leads/{id}/pipeline
    API->>Orch: execute_pipeline(lead_id)
    Orch->>DB: Load Lead Profile
    Orch->>State: Initialize State (Company, Contact, Role, Industry, Notes)

    rect rgb(20, 35, 60)
        Note over Orch,R_Agent: Step 1: Research Agent Execution
        Orch->>R_Agent: run(state)
        R_Agent->>R_Agent: Inspect website metadata + LLM sales synthesis
        R_Agent-->>State: ResearchResult (Summary, Pain Points, Tech Stack, Growth Signals)
        Orch->>DB: Persist research_results & Log Activity
    end

    rect rgb(30, 50, 40)
        Note over Orch,Q_Agent: Step 2: Qualification Agent Execution
        Orch->>Q_Agent: run(state)
        Q_Agent->>Q_Agent: Evaluate ICP Fit (Role Authority + Industry + Scale + Signals)
        Q_Agent-->>State: QualificationResult (Score: 0-100, HIGH/MED/LOW, Pos/Neg Signals)
        Orch->>DB: Persist qualification_results, Update Lead Status & Log Activity
    end

    rect rgb(50, 30, 60)
        Note over Orch,E_Agent: Step 3: Email Agent Execution
        Orch->>E_Agent: run(state)
        E_Agent->>E_Agent: Synthesize pain points & growth into targeted outreach
        E_Agent-->>State: EmailOutput (Subject, Tailored Body, Follow-up, Rationale)
        Orch->>DB: Persist email_outputs & Log Activity
    end

    Orch-->>API: Return Complete Pipeline State
    API-->>UI: 200 OK (Research + Qualification + Email + Status)
    UI-->>SalesRep: Visual cockpit displays score gauge, signals & send-ready email
```

---

## 3. Ideal Customer Profile (ICP) Scoring Matrix

The Qualification Agent evaluates each prospect against a 4-dimensional objective rubric:

| Dimension | Evaluation Criteria | Max Points |
| :--- | :--- | :---: |
| **Role Authority** | Executive Decision Maker (VP Sales, CRO, CCO, Head of RevOps, Founder) | **30** |
| **Industry Relevance** | B2B SaaS, Cloud Infrastructure, Fintech, Data Analytics Platforms | **30** |
| **Company Scale** | 20 – 500 employees (sweet spot where SDR efficiency yields highest ROI) | **25** |
| **Growth & Buying Signals** | Headcount surges, active SDR hiring, expansion announcements | **15** |

### Tier Thresholds:
- **`HIGH_FIT` (75 – 100)**: Immediate priority outbound sequence with executive tone.
- **`MEDIUM_FIT` (50 – 74)**: Targeted nurture cadence focusing on workflow enablement.
- **`LOW_FIT` (< 50)**: Disqualified or held; low conversion probability (e.g. solopreneurs, non-tech).

---

## 4. Lead Status State Transitions

```mermaid
stateDiagram-v2
    [*] --> NEW: Lead Created
    NEW --> RESEARCHED: Research Agent Finishes
    RESEARCHED --> QUALIFIED: Qual Agent Score >= 50
    RESEARCHED --> DISQUALIFIED: Qual Agent Score < 50
    QUALIFIED --> CONTACTED: Email Outbound Dispatched
    CONTACTED --> FOLLOW_UP: Bump Cadence (3 Days)
    FOLLOW_UP --> MEETING_BOOKED: Positive Reply
    FOLLOW_UP --> NOT_INTERESTED: Negative Reply
    MEETING_BOOKED --> CONVERTED: Deal Closed
```
