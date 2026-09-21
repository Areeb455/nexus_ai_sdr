# Nexus AI SDR Project Memory & Rules

## 1. LLM Model Selection & Priority
- Primary model: `gemini-3.6-flash` (or `gemini-3.7-flash`).
- NEVER use `gemini-2.5-flash` as primary: it hallucinates fake company services (e.g. branding agencies) and outputs generic AI filler.
- Failover chain in `LLMEngine`: `["gemini-3.6-flash", "gemini-3.7-flash", "gemini-2.5-flash"]`.
- Never commit API keys or GCP secrets to git (GitHub Push Protection blocks them).

## 2. Research Agent & Web Search Service
- Direct website scraper (`httpx` + `BeautifulSoup`), Wikipedia API, DuckDuckGo HTML & Instant Answer API.
- Verified registry fallbacks for key targets (Thinklude, Lenskart, Linear) when live networks block scrapes.
- Strict anti-slop rules: no fabricated statistics, no bracketed `[Prospect Name]` placeholders, no generic marketing templates.

## 3. Minimalist OLED Black UI Design System
- Pitch black `#000000` base with obsidian `#0a0a0c` / `#060608` cards, hairline `border-white/[0.08]`, and inner top highlights `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]`.
- High-contrast pure white primary buttons (`bg-white text-black hover:bg-zinc-200`).
- Dynamic company logos fetched via Google FaviconV2 CDN and Unavatar with typography monogram fallback (`CompanyLogo` component).
- 1-Click email compose redirection to Gmail Web Compose and native `mailto:` with pre-filled drafted text, automatically advancing lead status to `CONTACTED`.

## 4. Production Deployments
- Frontend: https://nexus-sdr-frontend.onrender.com (Next.js 16)
- Backend: https://nexus-sdr-backend.onrender.com (FastAPI)
- Database: PostgreSQL on Render
- Repo: https://github.com/Areeb455/nexus_ai_sdr
