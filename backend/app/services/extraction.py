from app.services.llm import LLMService

COMMON_SKILLS = [
    'Python',
    'SQL',
    'PostgreSQL',
    'FastAPI',
    'React',
    'Next.js',
    'JavaScript',
    'TypeScript',
    'OpenAI',
    'LangGraph',
    'Supabase',
    'Docker',
    'AWS',
    'Azure',
    'GCP',
    'ETL',
    'Spark',
    'Airflow',
    'Pandas',
    'Machine Learning',
    'Data Engineering',
    'APIs',
]


def _find_skills(text: str) -> list[str]:
    lowered = text.lower()
    return [skill for skill in COMMON_SKILLS if skill.lower() in lowered]


def extract_resume_structured(resume_text: str) -> dict:
    llm = LLMService()
    try:
        return llm.json_completion(
            system_prompt=(
                'Extract structured resume data. Return JSON with keys: '
                'skills, projects, experience, education, role_level.'
            ),
            user_prompt=resume_text,
        )
    except Exception:
        return {
            'skills': _find_skills(resume_text),
            'projects': [],
            'experience': [],
            'education': [],
            'role_level': 'Unknown',
        }


def extract_jd_structured(jd_text: str) -> dict:
    llm = LLMService()
    try:
        return llm.json_completion(
            system_prompt=(
                'Extract structured job description data. Return JSON with keys: '
                'required_skills, nice_to_have_skills, role_level, responsibilities, available_time.'
            ),
            user_prompt=jd_text,
        )
    except Exception:
        return {
            'required_skills': _find_skills(jd_text),
            'nice_to_have_skills': [],
            'role_level': 'Unknown',
            'responsibilities': [],
            'available_time': 'Not specified',
        }
