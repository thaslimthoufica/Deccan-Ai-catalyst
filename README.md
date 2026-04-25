# AI-Powered Skill Assessment & Personalized Learning Plan Agent (MVP)

This repository contains a deployment-ready **web app** MVP with:
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


## VS Code Quick Start (if you can't see the app)

If you open the repo root in VS Code, the runnable app is split into two folders:
- `frontend/` → Next.js UI (what you'll see in browser)
- `backend/` → FastAPI API

### Steps
1. Open this folder in VS Code: `Deccan-Ai-catalyst`
2. Create env files:
   - `backend/.env` from `backend/.env.example`
   - `frontend/.env.local` from `frontend/.env.example`
3. In VS Code terminal #1:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```
4. In VS Code terminal #2:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. Open:
   - Frontend app: `http://localhost:3000`
   - Backend docs: `http://localhost:8000/docs`

### Why you may think there is no app
- If you only run the backend, no UI will appear; UI is in `frontend/`.
- If dependencies are not installed in `frontend/`, Next.js won't start.
- If `NEXT_PUBLIC_API_URL` is not set in `frontend/.env.local`, the UI cannot call backend endpoints.

### Optional VS Code Task Runner
This repo now includes `.vscode/tasks.json` and `.vscode/launch.json` so you can run backend/frontend from **Terminal → Run Task** and debug FastAPI from **Run and Debug**.

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

- `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000`)

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

- **Frontend (Vercel):** set `NEXT_PUBLIC_API_URL` to backend URL.
- **Backend (Render/Railway):** set env vars and run `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- Use Supabase managed Postgres + Auth + Storage.

## 8) Scope Notes (MVP)

- Focuses on clear modularity, structured JSON LLM outputs, and resilient fallbacks.
- Includes practical defaults for parsing and assessment flow.
- Leaves advanced analytics and realtime sockets for later versions.


## Web App UX Notes

- This project is built as a desktop-first browser web app (not a mobile app).
- Main navigation appears as a left sidebar on medium/large screens.
- Use `http://localhost:3000` in a desktop browser for the best experience.


## Upload Troubleshooting


- Backend now has an in-memory fallback store when Supabase env vars are missing, so local assessment flow can run without cloud DB during development.
- Resume upload supports only `.pdf` and `.docx` files.
- If upload fails, the API now returns explicit parser errors such as:
  - `No readable text found in PDF.`
  - `Could not parse DOCX file.`
- Intake is now combined on one page: `/upload-resume` (resume + job description together).
