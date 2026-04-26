# AI-Powered Skill Assessment and Learning Plan Agent

Local MVP for uploading a resume, submitting a job description, running a skill assessment, and viewing a learning-plan dashboard.

## Stack

- Frontend: Next.js 14, React, Tailwind CSS
- Backend: FastAPI, LangGraph, Python
- Database: Supabase PostgreSQL with `pgvector`
- LLM: Hugging Face Inference Providers by default
- Optional fallback: OpenAI, if API billing is available

## Prerequisites

- Git
- Python 3.11+
- Node.js 18+
- npm
- Supabase account/project
- Hugging Face account/token

## 1. Clone

```powershell
git clone <your-repository-url>
cd Deccan-Ai-catalyst
```

## 2. Create Hugging Face Token

1. Go to:

```text
https://huggingface.co/settings/tokens
```

2. Create a token.
3. Use a fine-grained token if available.
4. Enable permission to make calls to Inference Providers.
5. Copy the token. It usually starts with `hf_`.

This app uses Hugging Face's OpenAI-compatible router:

```text
https://router.huggingface.co/v1
```

Default model:

```text
Qwen/Qwen2.5-7B-Instruct-1M:fastest
```

If that model is unavailable for your HF account, try:

```text
Qwen/Qwen2.5-7B-Instruct-1M:cheapest
meta-llama/Llama-3.1-8B-Instruct:fastest
```

## 3. Supabase SQL Setup

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Open local file:

```text
backend/sql/schema.sql
```

4. Copy the full SQL.
5. Paste and run it in Supabase.

This creates all required tables and enables `pgvector`.

## 4. Backend Environment

Create the backend env file:

```powershell
cd backend
copy .env.example .env
```

Edit `backend/.env`:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

LLM_PROVIDER=huggingface
HF_TOKEN=hf_your_token_here
HF_BASE_URL=https://router.huggingface.co/v1
HF_MODEL=Qwen/Qwen2.5-7B-Instruct-1M:fastest

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_BUCKET=resumes
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Find Supabase values here:

- `SUPABASE_URL`: Supabase Dashboard -> Project Settings -> API -> Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard -> Project Settings -> API -> `service_role`

Never put `SUPABASE_SERVICE_ROLE_KEY` in frontend files.

## 5. Run Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

If activation is blocked:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

Health check:

```text
http://127.0.0.1:8000/health
```

Expected:

```json
{"status":"ok"}
```

## 6. Run Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The frontend uses a Next.js proxy:

```text
/backend-api/* -> http://127.0.0.1:8000/*
```

So normal local setup does not need `NEXT_PUBLIC_API_BASE_URL`.

## 7. Demo Flow

Use the app in this order:

1. Open `http://localhost:3000`.
2. Go to **Upload Resume**.
3. Upload a `.pdf` or `.docx` resume.
4. Go to **Job Description**.
5. Paste and submit a job description.
6. Go to **Assessment**.
7. Answer all skill questions.
8. Go to **Dashboard**.
9. Review skill fit, gaps, scores, learning plan, and resources.

## 8. API Endpoints

- `GET /health`
- `POST /upload-resume?user_id=<uuid>`
- `POST /submit-job-description`
- `POST /extract-skills`
- `POST /start-assessment`
- `POST /submit-answer`
- `GET /assessment-report/{user_id}`
- `POST /generate-learning-plan`

## 9. Troubleshooting

### Hugging Face returns auth or permission error

Check:

- `HF_TOKEN` is set in `backend/.env`
- token starts with `hf_`
- token has permission for Inference Providers
- backend was restarted after editing `.env`

### Hugging Face model unavailable

Change `HF_MODEL` in `backend/.env`:

```env
HF_MODEL=Qwen/Qwen2.5-7B-Instruct-1M:cheapest
```

or:

```env
HF_MODEL=meta-llama/Llama-3.1-8B-Instruct:fastest
```

Restart backend after changing it.

### Cannot reach backend

Start FastAPI:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Check:

```text
http://127.0.0.1:8000/health
```

### Port 8000 already in use

```powershell
netstat -ano | Select-String ':8000'
taskkill /PID <pid> /F
```

### Supabase credentials are missing

Check `backend/.env`:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Restart backend.

### `No module named 'supabase'`

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Dashboard output looks generic

The backend has fallback logic if the LLM call fails. Check the backend terminal for the real error, usually missing HF token, model unavailable, or provider limit.

## 10. Switch To OpenAI Optional

Only use this if OpenAI API billing/quota is available:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
```

Restart backend.

## 11. Project Structure

```text
.
+-- backend
|   +-- app
|   |   +-- api/routes.py
|   |   +-- core/config.py
|   |   +-- core/database.py
|   |   +-- graph/workflow.py
|   |   +-- services/extraction.py
|   |   +-- services/llm.py
|   |   +-- services/parser.py
|   |   +-- schemas.py
|   |   +-- main.py
|   +-- sql/schema.sql
|   +-- requirements.txt
|   +-- .env.example
+-- frontend
    +-- app
    +-- components
    +-- lib/api.ts
    +-- next.config.js
    +-- package.json
```

## Evaluator Quick Start

After Supabase SQL is run and `backend/.env` is filled:

Terminal 1:

```powershell
cd Deccan-Ai-catalyst\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Terminal 2:

```powershell
cd Deccan-Ai-catalyst\frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```
