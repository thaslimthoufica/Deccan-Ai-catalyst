create extension if not exists vector;

create table if not exists users (
  id uuid primary key,
  email text unique not null,
  created_at timestamptz default now()
);

create table if not exists resumes (
  id uuid primary key,
  user_id uuid not null,
  file_name text not null,
  raw_text text,
  embedding vector(1536),
  created_at timestamptz default now()
);

create table if not exists job_descriptions (
  id uuid primary key,
  user_id uuid not null,
  title text,
  raw_text text,
  embedding vector(1536),
  created_at timestamptz default now()
);

create table if not exists extracted_skills (
  id uuid primary key,
  user_id uuid not null,
  resume_id uuid not null,
  jd_id uuid not null,
  resume_json jsonb not null,
  jd_json jsonb not null,
  created_at timestamptz default now()
);

create table if not exists assessments (
  id uuid primary key,
  user_id uuid not null,
  resume_id uuid not null,
  jd_id uuid not null,
  status text not null default 'in_progress',
  snapshot jsonb,
  created_at timestamptz default now()
);

create table if not exists assessment_questions (
  id uuid primary key,
  assessment_id uuid not null,
  skill_name text not null,
  question_text text not null,
  created_at timestamptz default now()
);

create table if not exists assessment_answers (
  id uuid primary key,
  assessment_id uuid not null,
  question_id uuid not null,
  answer_text text not null,
  created_at timestamptz default now()
);

create table if not exists skill_scores (
  id uuid primary key,
  assessment_id uuid not null,
  skill_name text not null,
  score_label text not null check (score_label in ('Beginner', 'Intermediate', 'Advanced')),
  rationale text,
  created_at timestamptz default now()
);

create table if not exists learning_plans (
  id uuid primary key,
  assessment_id uuid not null,
  user_id uuid not null,
  skill_name text not null,
  current_level text,
  target_level text,
  learning_path text,
  estimated_time text,
  mini_project text,
  created_at timestamptz default now()
);

create table if not exists learning_resources (
  id uuid primary key,
  assessment_id uuid not null,
  user_id uuid not null,
  skill_name text not null,
  resource_title text not null,
  resource_type text,
  resource_url text,
  created_at timestamptz default now()
);
