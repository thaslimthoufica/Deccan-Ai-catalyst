import re

from app.core.config import settings
from app.services.llm import LLMService

COMMON_SKILLS = {
    'python', 'java', 'javascript', 'typescript', 'sql', 'fastapi', 'django', 'flask', 'react', 'next.js',
    'node.js', 'aws', 'docker', 'kubernetes', 'langchain', 'langgraph', 'postgresql', 'supabase', 'git',
    'machine learning', 'deep learning', 'nlp', 'pandas', 'numpy', 'pytorch', 'tensorflow',
}


def _keyword_extract(text: str, skill_source: set[str] | None = None) -> list[str]:
    pool = skill_source or COMMON_SKILLS
    lowered = text.lower()
    return sorted([skill for skill in pool if skill in lowered])


def extract_resume_structured(resume_text: str) -> dict:
    if not settings.openai_api_key:
        return {
            'skills': _keyword_extract(resume_text),
            'projects': [],
            'experience': [],
            'education': [],
            'role_level': 'Unknown',
        }

    try:
        llm = LLMService()
        return llm.json_completion(
            system_prompt=(
                'Extract structured resume data. Return JSON with keys: '
                'skills, projects, experience, education, role_level.'
            ),
            user_prompt=resume_text,
        )
    except Exception:
        return {
            'skills': _keyword_extract(resume_text),
            'projects': [],
            'experience': [],
            'education': [],
            'role_level': 'Unknown',
        }


def extract_jd_structured(jd_text: str) -> dict:
    if not settings.openai_api_key:
        required = _keyword_extract(jd_text)
        role_level = 'Senior' if re.search(r'\bsenior\b', jd_text.lower()) else 'Mid'
        return {
            'required_skills': required,
            'nice_to_have_skills': [],
            'role_level': role_level,
            'responsibilities': [],
        }

    try:
        llm = LLMService()
        return llm.json_completion(
            system_prompt=(
                'Extract structured job description data. Return JSON with keys: '
                'required_skills, nice_to_have_skills, role_level, responsibilities.'
            ),
            user_prompt=jd_text,
        )
    except Exception:
        required = _keyword_extract(jd_text)
        role_level = 'Senior' if re.search(r'\bsenior\b', jd_text.lower()) else 'Mid'
        return {
            'required_skills': required,
            'nice_to_have_skills': [],
            'role_level': role_level,
            'responsibilities': [],
        }
