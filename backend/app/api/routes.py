from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.database import get_supabase
from app.graph.workflow import build_workflow
from app.schemas import (
    ExtractSkillsInput,
    GenerateLearningPlanInput,
    JobDescriptionInput,
    StandardResponse,
    StartAssessmentInput,
    SubmitAnswerInput,
)
from app.services.extraction import extract_jd_structured, extract_resume_structured
from app.services.parser import ParserError, parse_docx, parse_pdf

router = APIRouter()
workflow = build_workflow()

# In-memory fallback store for local/dev runtime when Supabase is not configured.
MEMORY_DB: dict[str, dict] = {
    'resumes': {},
    'job_descriptions': {},
    'extracted_skills': {},
    'assessments': {},
    'assessment_questions': {},
    'assessment_answers': {},
    'learning_plans': {},
    'learning_resources': {},
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _supabase_client():
    try:
        return get_supabase()
    except Exception:
        return None


@router.post('/upload-resume', response_model=StandardResponse)
async def upload_resume(user_id: str, file: UploadFile = File(...)):
    filename = (file.filename or 'resume').strip()
    extension = filename.lower().split('.')[-1] if '.' in filename else ''

    if extension not in {'pdf', 'docx'}:
        raise HTTPException(status_code=400, detail='Only PDF and DOCX are supported.')

    content = await file.read()
    try:
        text = parse_pdf(content) if extension == 'pdf' else parse_docx(content)
    except ParserError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    resume_id = str(uuid4())
    record = {
        'id': resume_id,
        'user_id': user_id,
        'file_name': filename,
        'raw_text': text,
        'created_at': _now(),
    }

    supabase = _supabase_client()
    if supabase:
        try:
            supabase.table('resumes').insert(record).execute()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f'Failed to save resume: {exc}') from exc
    else:
        MEMORY_DB['resumes'][resume_id] = record

    return StandardResponse(
        success=True,
        message='Resume uploaded successfully.',
        data={'resume_id': resume_id, 'file_type': extension, 'text_preview': text[:600]},
    )


@router.post('/submit-job-description', response_model=StandardResponse)
def submit_job_description(payload: JobDescriptionInput):
    jd_id = str(uuid4())
    record = {
        'id': jd_id,
        'user_id': payload.user_id,
        'title': payload.title,
        'raw_text': payload.raw_text,
        'created_at': _now(),
    }

    supabase = _supabase_client()
    if supabase:
        try:
            supabase.table('job_descriptions').insert(record).execute()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f'Failed to save job description: {exc}') from exc
    else:
        MEMORY_DB['job_descriptions'][jd_id] = record

    return StandardResponse(success=True, message='Job description stored.', data={'jd_id': jd_id})


@router.post('/extract-skills', response_model=StandardResponse)
def extract_skills(payload: ExtractSkillsInput):
    supabase = _supabase_client()

    if supabase:
        try:
            resume_row = supabase.table('resumes').select('raw_text').eq('id', payload.resume_id).single().execute().data
            jd_row = supabase.table('job_descriptions').select('raw_text').eq('id', payload.jd_id).single().execute().data
        except Exception as exc:
            raise HTTPException(status_code=404, detail=f'Resume/JD not found: {exc}') from exc
    else:
        resume_row = MEMORY_DB['resumes'].get(payload.resume_id)
        jd_row = MEMORY_DB['job_descriptions'].get(payload.jd_id)
        if not resume_row or not jd_row:
            raise HTTPException(status_code=404, detail='Resume or Job Description not found in local storage.')

    resume_data = extract_resume_structured(resume_row['raw_text'])
    jd_data = extract_jd_structured(jd_row['raw_text'])

    extracted_id = str(uuid4())
    extracted_record = {
        'id': extracted_id,
        'user_id': payload.user_id,
        'resume_id': payload.resume_id,
        'jd_id': payload.jd_id,
        'resume_json': resume_data,
        'jd_json': jd_data,
        'created_at': _now(),
    }

    if supabase:
        supabase.table('extracted_skills').insert(extracted_record).execute()
    else:
        MEMORY_DB['extracted_skills'][extracted_id] = extracted_record

    return StandardResponse(success=True, message='Skills extracted.', data={'resume_data': resume_data, 'jd_data': jd_data})


@router.post('/start-assessment', response_model=StandardResponse)
def start_assessment(payload: StartAssessmentInput):
    supabase = _supabase_client()

    if supabase:
        extracted = (
            supabase.table('extracted_skills')
            .select('resume_json,jd_json')
            .eq('resume_id', payload.resume_id)
            .eq('jd_id', payload.jd_id)
            .order('created_at', desc=True)
            .limit(1)
            .execute()
            .data
        )
        if not extracted:
            raise HTTPException(status_code=404, detail='No extracted skill record found. Run /extract-skills first.')
        extracted_data = extracted[0]
    else:
        extracted_rows = [
            row for row in MEMORY_DB['extracted_skills'].values()
            if row['resume_id'] == payload.resume_id and row['jd_id'] == payload.jd_id
        ]
        if not extracted_rows:
            raise HTTPException(status_code=404, detail='No extracted skill record found. Run /extract-skills first.')
        extracted_data = sorted(extracted_rows, key=lambda r: r['created_at'], reverse=True)[0]

    initial_state = {
        'resume_data': extracted_data['resume_json'],
        'jd_data': extracted_data['jd_json'],
        'answers': [],
    }
    result = workflow.invoke(initial_state)
    assessment_id = str(uuid4())

    assessment_record = {
        'id': assessment_id,
        'user_id': payload.user_id,
        'resume_id': payload.resume_id,
        'jd_id': payload.jd_id,
        'status': 'in_progress',
        'snapshot': result,
        'created_at': _now(),
    }

    if supabase:
        supabase.table('assessments').insert(assessment_record).execute()
    else:
        MEMORY_DB['assessments'][assessment_id] = assessment_record

    question_rows = []
    for q in result.get('questions', []):
        question_id = str(uuid4())
        q_record = {
            'id': question_id,
            'assessment_id': assessment_id,
            'skill_name': q.get('skill'),
            'question_text': q.get('question'),
            'created_at': _now(),
        }
        if supabase:
            supabase.table('assessment_questions').insert(q_record).execute()
        else:
            MEMORY_DB['assessment_questions'][question_id] = q_record
        question_rows.append({'id': question_id, 'skill': q.get('skill'), 'question': q.get('question')})

    return StandardResponse(success=True, message='Assessment started.', data={'assessment_id': assessment_id, 'questions': question_rows})


@router.post('/submit-answer', response_model=StandardResponse)
def submit_answer(payload: SubmitAnswerInput):
    supabase = _supabase_client()

    if supabase:
        q = supabase.table('assessment_questions').select('*').eq('id', payload.question_id).single().execute().data
    else:
        q = MEMORY_DB['assessment_questions'].get(payload.question_id)

    if not q:
        raise HTTPException(status_code=404, detail='Assessment question not found.')

    answer_id = str(uuid4())
    answer_record = {
        'id': answer_id,
        'assessment_id': payload.assessment_id,
        'question_id': payload.question_id,
        'answer_text': payload.answer,
        'created_at': _now(),
    }

    if supabase:
        supabase.table('assessment_answers').insert(answer_record).execute()
        snapshot = supabase.table('assessments').select('snapshot').eq('id', payload.assessment_id).single().execute().data['snapshot']
    else:
        MEMORY_DB['assessment_answers'][answer_id] = answer_record
        assessment = MEMORY_DB['assessments'].get(payload.assessment_id)
        if not assessment:
            raise HTTPException(status_code=404, detail='Assessment not found.')
        snapshot = assessment['snapshot']

    snapshot.setdefault('answers', []).append({'skill': q['skill_name'], 'answer': payload.answer})
    updated = workflow.invoke(snapshot)

    if supabase:
        supabase.table('assessments').update({'snapshot': updated, 'status': 'in_progress'}).eq('id', payload.assessment_id).execute()
    else:
        MEMORY_DB['assessments'][payload.assessment_id]['snapshot'] = updated
        MEMORY_DB['assessments'][payload.assessment_id]['status'] = 'in_progress'

    return StandardResponse(success=True, message='Answer submitted.', data={'answer_id': answer_id, 'current_scores': updated.get('scores', [])})


@router.get('/assessment-report/{user_id}', response_model=StandardResponse)
def assessment_report(user_id: str):
    supabase = _supabase_client()

    if supabase:
        row = (
            supabase.table('assessments')
            .select('id,snapshot,created_at')
            .eq('user_id', user_id)
            .order('created_at', desc=True)
            .limit(1)
            .execute()
            .data
        )
        if not row:
            raise HTTPException(status_code=404, detail='No assessment found for this user.')
        assessment = row[0]
    else:
        all_rows = [r for r in MEMORY_DB['assessments'].values() if r['user_id'] == user_id]
        if not all_rows:
            raise HTTPException(status_code=404, detail='No assessment found for this user.')
        assessment = sorted(all_rows, key=lambda r: r['created_at'], reverse=True)[0]

    return StandardResponse(success=True, message='Assessment report fetched.', data={'assessment': assessment})


@router.post('/generate-learning-plan', response_model=StandardResponse)
def generate_learning_plan(payload: GenerateLearningPlanInput):
    supabase = _supabase_client()

    if supabase:
        assessment = supabase.table('assessments').select('snapshot').eq('id', payload.assessment_id).single().execute().data
        snapshot = assessment['snapshot']
    else:
        assessment = MEMORY_DB['assessments'].get(payload.assessment_id)
        if not assessment:
            raise HTTPException(status_code=404, detail='Assessment not found.')
        snapshot = assessment['snapshot']

    report = snapshot.get('report', {})
    plan = report.get('learning_plan', [])

    for item in plan:
        plan_id = str(uuid4())
        row = {
            'id': plan_id,
            'assessment_id': payload.assessment_id,
            'user_id': payload.user_id,
            'skill_name': item.get('skill_name'),
            'current_level': item.get('current_level'),
            'target_level': item.get('target_level'),
            'learning_path': item.get('learning_path'),
            'estimated_time': item.get('estimated_time'),
            'mini_project': item.get('mini_project'),
            'created_at': _now(),
        }
        if supabase:
            supabase.table('learning_plans').insert(row).execute()
        else:
            MEMORY_DB['learning_plans'][plan_id] = row

    for group in report.get('resources', []):
        for resource in group.get('resources', []):
            resource_id = str(uuid4())
            row = {
                'id': resource_id,
                'assessment_id': payload.assessment_id,
                'user_id': payload.user_id,
                'skill_name': group.get('skill_name'),
                'resource_title': resource.get('title'),
                'resource_type': resource.get('type'),
                'created_at': _now(),
            }
            if supabase:
                supabase.table('learning_resources').insert(row).execute()
            else:
                MEMORY_DB['learning_resources'][resource_id] = row

    return StandardResponse(success=True, message='Learning plan generated and saved.', data={'items': len(plan)})
