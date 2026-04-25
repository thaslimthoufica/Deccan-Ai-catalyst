from app.services.llm import LLMService


def extract_resume_structured(resume_text: str) -> dict:
    llm = LLMService()
    return llm.json_completion(
        system_prompt=(
            'Extract structured resume data. Return JSON with keys: '
            'skills, projects, experience, education, role_level.'
        ),
        user_prompt=resume_text,
    )


def extract_jd_structured(jd_text: str) -> dict:
    llm = LLMService()
    return llm.json_completion(
        system_prompt=(
            'Extract structured job description data. Return JSON with keys: '
            'required_skills, nice_to_have_skills, role_level, responsibilities.'
        ),
        user_prompt=jd_text,
    )
