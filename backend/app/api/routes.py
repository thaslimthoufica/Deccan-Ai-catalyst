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
from app.services.parser import parse_docx, parse_pdf

router = APIRouter()
workflow = build_workflow()


@router.post('/upload-resume', response_model=StandardResponse)
async def upload_resume(user_id: str, file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename or 'resume'

    if filename.lower().endswith('.pdf'):
        text = parse_pdf(content)
    elif filename.lower().endswith('.docx'):
        text = parse_docx(content)
    else:
        raise HTTPException(status_code=400, detail='Only PDF and DOCX are supported.')

    resume_id = str(uuid4())
    data = {
        'id': resume_id,
        'user_id': user_id,
        'file_name': filename,
        'raw_text': text,
    }
    try:
        get_supabase().table('resumes').insert(data).execute()
    except Exception:
        pass

    return StandardResponse(success=True, message='Resume uploaded.', data={'resume_id': resume_id, 'text_preview': text[:600]})


@router.post('/submit-job-description', response_model=StandardResponse)
def submit_job_description(payload: JobDescriptionInput):
    jd_id = str(uuid4())
    record = {'id': jd_id, 'user_id': payload.user_id, 'title': payload.title, 'raw_text': payload.raw_text}
    try:
        get_supabase().table('job_descriptions').insert(record).execute()
    except Exception:
        pass
    return StandardResponse(success=True, message='Job description stored.', data={'jd_id': jd_id})


@router.post('/extract-skills', response_model=StandardResponse)
def extract_skills(payload: ExtractSkillsInput):
    supabase = get_supabase()
    resume_row = supabase.table('resumes').select('raw_text').eq('id', payload.resume_id).single().execute().data
    jd_row = supabase.table('job_descriptions').select('raw_text').eq('id', payload.jd_id).single().execute().data

    resume_data = extract_resume_structured(resume_row['raw_text'])
    jd_data = extract_jd_structured(jd_row['raw_text'])

    supabase.table('extracted_skills').insert(
        {
            'id': str(uuid4()),
            'user_id': payload.user_id,
            'resume_id': payload.resume_id,
            'jd_id': payload.jd_id,
            'resume_json': resume_data,
            'jd_json': jd_data,
        }
    ).execute()

    return StandardResponse(success=True, message='Skills extracted.', data={'resume_data': resume_data, 'jd_data': jd_data})


@router.post('/start-assessment', response_model=StandardResponse)
def start_assessment(payload: StartAssessmentInput):
    supabase = get_supabase()
    extracted = (
        supabase.table('extracted_skills')
        .select('resume_json,jd_json')
        .eq('resume_id', payload.resume_id)
        .eq('jd_id', payload.jd_id)
        .single()
        .execute()
        .data
    )

    initial_state = {
        'resume_data': extracted['resume_json'],
        'jd_data': extracted['jd_json'],
        'answers': [],
    }
    result = workflow.invoke(initial_state)
    assessment_id = str(uuid4())

    supabase.table('assessments').insert(
        {
            'id': assessment_id,
            'user_id': payload.user_id,
            'resume_id': payload.resume_id,
            'jd_id': payload.jd_id,
            'status': 'in_progress',
            'snapshot': result,
        }
    ).execute()

    question_rows = []
    for q in result.get('questions', []):
        question_id = str(uuid4())
        supabase.table('assessment_questions').insert(
            {
                'id': question_id,
                'assessment_id': assessment_id,
                'skill_name': q.get('skill'),
                'question_text': q.get('question'),
            }
        ).execute()
        question_rows.append({'id': question_id, 'skill': q.get('skill'), 'question': q.get('question')})

    return StandardResponse(success=True, message='Assessment started.', data={'assessment_id': assessment_id, 'questions': question_rows})


@router.post('/submit-answer', response_model=StandardResponse)
def submit_answer(payload: SubmitAnswerInput):
    supabase = get_supabase()
    q = supabase.table('assessment_questions').select('*').eq('id', payload.question_id).single().execute().data

    answer_id = str(uuid4())
    supabase.table('assessment_answers').insert(
        {
            'id': answer_id,
            'assessment_id': payload.assessment_id,
            'question_id': payload.question_id,
            'answer_text': payload.answer,
        }
    ).execute()

    snapshot = supabase.table('assessments').select('snapshot').eq('id', payload.assessment_id).single().execute().data['snapshot']
    snapshot.setdefault('answers', []).append({'skill': q['skill_name'], 'answer': payload.answer})

    updated = workflow.invoke(snapshot)
    supabase.table('assessments').update({'snapshot': updated, 'status': 'in_progress'}).eq('id', payload.assessment_id).execute()

    return StandardResponse(success=True, message='Answer submitted.', data={'answer_id': answer_id, 'current_scores': updated.get('scores', [])})


@router.get('/assessment-report/{user_id}', response_model=StandardResponse)
def assessment_report(user_id: str):
    supabase = get_supabase()
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

    return StandardResponse(success=True, message='Assessment report fetched.', data={'assessment': row[0]})


@router.post('/generate-learning-plan', response_model=StandardResponse)
def generate_learning_plan(payload: GenerateLearningPlanInput):
    supabase = get_supabase()
    assessment = supabase.table('assessments').select('snapshot').eq('id', payload.assessment_id).single().execute().data
    snapshot = assessment['snapshot']
    report = snapshot.get('report', {})

    plan = report.get('learning_plan', [])
    for item in plan:
        plan_id = str(uuid4())
        supabase.table('learning_plans').insert(
            {
                'id': plan_id,
                'assessment_id': payload.assessment_id,
                'user_id': payload.user_id,
                'skill_name': item.get('skill_name'),
                'current_level': item.get('current_level'),
                'target_level': item.get('target_level'),
                'learning_path': item.get('learning_path'),
                'estimated_time': item.get('estimated_time'),
                'mini_project': item.get('mini_project'),
            }
        ).execute()

    for group in report.get('resources', []):
        for resource in group.get('resources', []):
            supabase.table('learning_resources').insert(
                {
                    'id': str(uuid4()),
                    'assessment_id': payload.assessment_id,
                    'user_id': payload.user_id,
                    'skill_name': group.get('skill_name'),
                    'resource_title': resource.get('title'),
                    'resource_type': resource.get('type'),
                }
            ).execute()

    return StandardResponse(success=True, message='Learning plan generated and saved.', data={'items': len(plan)})
