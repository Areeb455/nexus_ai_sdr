# Antigravity Persistent Memory & Project Rules

This document serves as the persistent memory for the **Nexus AI SDR** workspace. Its contents are automatically loaded across all restarts, new conversations, and subagents.

---

## 🧠 Core Architecture & Decision Memory

### 1. LLM Model Selection & Priority
- **Primary Model**: Always prioritize **`gemini-3.6-flash`** (or `gemini-3.7-flash`).
- **NEVER use `gemini-2.5-flash` as primary**: It produces low-quality outputs, hallucinates fake company descriptions (e.g. falsely labeling tech companies as "branding & web design agencies"), and generates generic AI filler.
- **Failover Chain in `LLMEngine`**:
  `["gemini-3.6-flash", "gemini-3.7-flash", "gemini-2.5-flash"]`
- **Security & GitHub Push Protection**:
  - NEVER hardcode GCP API keys, Vertex AI credentials, or Service Account JSON secrets into repository files.
  - API keys must strictly live in `.env` or Render environment variables (`GEMINI_API_KEY`).
  - GitHub strictly blocks any commits containing GCP API keys (`AIzaSy...` or `AQ...`).

---

### 2. Anti-Hallucination & Research Telemetry
- **Multi-Source Scraping in `WebSearchService`**:
  1. Direct homepage scraper (`httpx` + `BeautifulSoup` extracting title, meta tags, and live product copy).
  2. Wikipedia API (`https://en.wikipedia.org/w/api.php`) for official corporate entities, founding year, and executive leadership.
  3. DuckDuckGo HTML scraper (`https://html.duckduckgo.com/html/`) and Instant Answer API (`https://api.duckduckgo.com/`).
  4. Verified registry fallbacks for demo targets if live networks or Cloudflare anti-bot blocks scraping (e.g. Thinklude = sign-language AI founded 2023 by Pranjal Rastogi & Prerit Rathi, backed by SACC; Lenskart = eyewear omnichannel founded 2010 by Peyush Bansal; Linear = issue tracking founded by Karri Saarinen).
- **Strict Anti-Slop Prompt Guardrails**:
  - Never hallucinate fabricated statistics like "SDRs spend 65% of their day" or "42% reduction in CAC".
  - Never use placeholder brackets like `Hi [Prospect Name]` or `Hi [Name]`. Always greet with the contact's real name (e.g. `Hi Pranjal`) or `Hi {Company} Team`.
  - Always ground pitches in the company's real products and operational bottlenecks.

---

### 3. Minimalist OLED Black UI Design System
- **Palette & Tokens**:
  - Base background: Pure OLED black (`#000000`) with subtle top ambient sheen.
  - Card surfaces: Obsidian dark (`bg-[#0a0a0c]` and `bg-[#060608]`) with hairline borders (`border-white/[0.08]`) and top inner edge highlights (`shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]`).
  - Headings: Crisp white (`text-white font-semibold tracking-tight`).
  - Micro-labels: Uppercase monospace zinc (`text-[10px] font-mono tracking-widest text-zinc-500`).
  - Primary CTAs: **Solid high-contrast white button with pure black text** (`bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.12)]`).
  - Secondary CTAs: Stealth zinc buttons (`bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08]`).
- **Dynamic Brand Logos**:
  - Rendered via `<CompanyLogo />` component (`frontend/src/components/CompanyLogo.tsx`).
  - Queries Google FaviconV2 CDN (`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`) and Unavatar with clean two-letter typography monogram fallback.
- **1-Click Email Redirection**:
  - Automatically redirects to **Gmail Web Composer** (`https://mail.google.com/mail/?view=cm&fs=1&to=...&su=...&body=...`) and native `mailto:` with recipient, subject, and drafted body pre-populated.
  - Automatically advances the lead status to **`CONTACTED`** in the PostgreSQL database and logs activity.

---

### 4. Deployments & Infrastructure
- **Frontend**: [nexus-sdr-frontend.onrender.com](https://nexus-sdr-frontend.onrender.com) (Next.js 16 App Router on Render)
- **Backend API**: [nexus-sdr-backend.onrender.com](https://nexus-sdr-backend.onrender.com) (FastAPI on Render)
- **Database**: PostgreSQL on Render (persisting leads, research, qualifications, and activity audit trails across service reboots)
- **Repository**: [github.com/Areeb455/nexus_ai_sdr](https://github.com/Areeb455/nexus_ai_sdr) on branch `main`.
