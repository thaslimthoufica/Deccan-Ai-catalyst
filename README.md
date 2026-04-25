# AI-Powered Skill Assessment & Personalized Learning Plan Agent (MVP)

This repository contains a deployment-ready MVP with:
- **Frontend**: Next.js + Tailwind CSS
- **Backend**: FastAPI + LangGraph + OpenAI
- **Database**: Supabase PostgreSQL + pgvector

## Project Structure

```
.
├── backend
│   ├── app
│   │   ├── api
│   │   │   └── routes.py
│   │   ├── core
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── models.py
│   │   ├── graph
│   │   │   └── workflow.py
│   │   ├── services
│   │   │   ├── extraction.py
│   │   │   ├── llm.py
│   │   │   └── parser.py
│   │   ├── schemas.py
│   │   └── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── sql
│       └── schema.sql
└── frontend
    ├── app
    │   ├── assessment/page.tsx
    │   ├── dashboard/page.tsx
    │   ├── job-description/page.tsx
    │   ├── upload-resume/page.tsx
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components
    │   ├── LoadingSpinner.tsx
    │   └── NavBar.tsx
    ├── lib
    │   └── api.ts
    ├── package.json
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── tsconfig.json
    ├── next.config.js
    └── .env.example
```

## 1) Backend Setup (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Backend will run at `http://localhost:8000`.

## 2) Frontend Setup (Next.js)

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend will run at `http://localhost:3000`.

## 3) Supabase SQL Setup

Run:
- `backend/sql/schema.sql`

in your Supabase SQL editor to create required tables and enable `pgvector`.

## 4) Environment Variables

### Backend (`backend/.env`)

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default `gpt-4.1-mini`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET`
- `CORS_ORIGINS` (comma separated, e.g. `http://localhost:3000`)

### Frontend (`frontend/.env.local`)

- `NEXT_PUBLIC_API_BASE_URL` (e.g. `http://localhost:8000`)

## 5) MVP Workflow

LangGraph workflow nodes:
1. `resume_parser_node`
2. `jd_parser_node`
3. `skill_matcher_node`
4. `assessment_question_generator_node`
5. `answer_evaluator_node`
6. `gap_analyzer_node`
7. `learning_plan_generator_node`
8. `resource_recommender_node`
9. `final_report_node`

## 6) API Endpoints

- `POST /upload-resume`
- `POST /submit-job-description`
- `POST /extract-skills`
- `POST /start-assessment`
- `POST /submit-answer`
- `GET /assessment-report/{user_id}`
- `POST /generate-learning-plan`

## 7) Deployment Notes

- **Frontend (Vercel):** set `NEXT_PUBLIC_API_BASE_URL` to backend URL.
- **Backend (Render/Railway):** set env vars and run `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- Use Supabase managed Postgres + Auth + Storage.

## 8) Scope Notes (MVP)

- Focuses on clear modularity, structured JSON LLM outputs, and resilient fallbacks.
- Includes practical defaults for parsing and assessment flow.
- Leaves advanced analytics and realtime sockets for later versions.
