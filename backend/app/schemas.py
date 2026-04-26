from typing import Any

from pydantic import BaseModel, Field


class JobDescriptionInput(BaseModel):
    user_id: str
    title: str | None = None
    raw_text: str = Field(min_length=20)
    available_time: str | None = None


class ExtractSkillsInput(BaseModel):
    user_id: str
    resume_id: str
    jd_id: str


class StartAssessmentInput(BaseModel):
    user_id: str
    resume_id: str
    jd_id: str


class SubmitAnswerInput(BaseModel):
    user_id: str
    assessment_id: str
    question_id: str
    answer: str = Field(min_length=2)


class GenerateLearningPlanInput(BaseModel):
    user_id: str
    assessment_id: str


class StandardResponse(BaseModel):
    success: bool
    message: str
    data: dict[str, Any] | None = None
