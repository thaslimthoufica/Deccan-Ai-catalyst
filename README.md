# Deccan-Ai-catalyst

## AI-Powered Skill Assessment & Personalized Learning Plan Agent

### Step 1: Recommended Tech Stack

| Layer | Recommended Stack | Why this choice |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | Fast UI iteration, built-in routing, and production-ready deployment on Vercel. |
| Backend API | FastAPI (Python) | Strong ecosystem for NLP/resume parsing, typed APIs, async performance, and clean separation of orchestration logic. |
| AI Model | OpenAI GPT-4.1 / GPT-4o | Reliable reasoning + conversational assessment quality for skill probing and personalized plans. |
| Agent Framework | LangGraph | Best for multi-step stateful workflows (parse -> assess -> gap analysis -> plan generation). |
| Database | Supabase PostgreSQL | Managed Postgres with strong DX, SQL flexibility, and native integration with auth/storage. |
| Vector Store | Supabase pgvector | Keep embeddings close to transactional data; ideal for resource and skill similarity search. |
| File Parsing | pdfplumber, PyMuPDF, python-docx | Robust extraction pipeline across PDF/DOCX with fallback parsing paths. |
| Structured Extraction | LLM JSON schema output | Convert JD/resume to normalized skill objects and proficiency signals. |
| Authentication | Supabase Auth | Quick role-based auth setup for recruiter/candidate/admin workflows. |
| Deployment | Vercel (frontend) + Render/Railway (backend) | Scalable split deployment with minimal DevOps overhead. |
| Resource Search | Tavily API / SerpAPI + curated resource DB | Fresh external discovery plus curated high-quality learning content. |

### Suggested Implementation Baseline (MVP)

1. Build `JD + Resume Ingestion` service with structured JSON extraction.
2. Add `Assessment Engine` that generates adaptive, conversational skill probes.
3. Score proficiency with rubric levels (Beginner/Intermediate/Advanced).
4. Compute `Skill Gap + Adjacent Skill Path` using embedding similarity + rules.
5. Generate a personalized learning plan with effort estimates (hours/week, total duration).
6. Store all outcomes in Supabase for candidate progress tracking.
