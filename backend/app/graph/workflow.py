from __future__ import annotations

from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.services.llm import LLMService


class AssessmentState(TypedDict, total=False):
    resume_data: dict[str, Any]
    jd_data: dict[str, Any]
    matched_skills: dict[str, Any]
    questions: list[dict[str, Any]]
    answers: list[dict[str, Any]]
    scores: list[dict[str, Any]]
    gaps: dict[str, Any]
    plan: list[dict[str, Any]]
    resources: list[dict[str, Any]]
    report: dict[str, Any]


def _llm_or_none():
    try:
        return LLMService()
    except Exception:
        return None


def resume_parser_node(state: AssessmentState) -> AssessmentState:
    return state


def jd_parser_node(state: AssessmentState) -> AssessmentState:
    return state


def skill_matcher_node(state: AssessmentState) -> AssessmentState:
    resume_skills = set(state.get('resume_data', {}).get('skills', []))
    jd_required = set(state.get('jd_data', {}).get('required_skills', []))
    state['matched_skills'] = {
        'strong': sorted(list(resume_skills & jd_required)),
        'missing': sorted(list(jd_required - resume_skills)),
    }
    return state


def assessment_question_generator_node(state: AssessmentState) -> AssessmentState:
    skills = state.get('jd_data', {}).get('required_skills', [])[:8]
    prompt = f"Generate adaptive questions for skills: {skills}. Return JSON array 'questions' with skill, question."
    llm = _llm_or_none()
    try:
        if not llm:
            raise ValueError('LLM unavailable')
        result = llm.json_completion('Generate concise technical assessment questions.', prompt)
        state['questions'] = result.get('questions', [])
    except Exception:
        state['questions'] = [{'skill': s, 'question': f'Explain your hands-on experience with {s}.'} for s in skills]
    return state


def answer_evaluator_node(state: AssessmentState) -> AssessmentState:
    answers = state.get('answers', [])
    scores = []
    for item in answers:
        prompt = (
            'Evaluate answer and return JSON with skill, level(one of Beginner/Intermediate/Advanced), '
            'reason (short).'
            f"\nSkill: {item.get('skill')}\nAnswer: {item.get('answer')}"
        )
        llm = _llm_or_none()
        try:
            if not llm:
                raise ValueError('LLM unavailable')
            eval_result = llm.json_completion('You are a strict technical interviewer.', prompt)
            scores.append(eval_result)
        except Exception:
            scores.append({'skill': item.get('skill'), 'level': 'Intermediate', 'reason': 'Fallback heuristic score.'})
    state['scores'] = scores
    return state


def gap_analyzer_node(state: AssessmentState) -> AssessmentState:
    scores = state.get('scores', [])
    missing = state.get('matched_skills', {}).get('missing', [])
    weak = [s['skill'] for s in scores if s.get('level') == 'Beginner']
    strong = [s['skill'] for s in scores if s.get('level') == 'Advanced']
    state['gaps'] = {
        'strong_skills': strong,
        'weak_skills': weak,
        'missing_skills': missing,
        'adjacent_skills': list(dict.fromkeys((missing + weak)))[:6],
    }
    return state


def learning_plan_generator_node(state: AssessmentState) -> AssessmentState:
    skills = state.get('gaps', {}).get('adjacent_skills', [])
    prompt = (
        'Create a personalized learning plan in JSON key plan as array of objects with '
        'skill_name,current_level,target_level,learning_path,estimated_time,mini_project.'
        f' Skills: {skills}'
    )
    llm = _llm_or_none()
    try:
        if not llm:
            raise ValueError('LLM unavailable')
        result = llm.json_completion('Generate practical upskilling plans for working professionals.', prompt)
        state['plan'] = result.get('plan', [])
    except Exception:
        state['plan'] = [
            {
                'skill_name': s,
                'current_level': 'Beginner',
                'target_level': 'Intermediate',
                'learning_path': 'Foundations -> guided practice -> mini project',
                'estimated_time': '3-4 weeks',
                'mini_project': f'Build a small project demonstrating {s}.',
            }
            for s in skills
        ]
    return state


def resource_recommender_node(state: AssessmentState) -> AssessmentState:
    resources = []
    for item in state.get('plan', []):
        skill = item.get('skill_name')
        resources.append(
            {
                'skill_name': skill,
                'resources': [
                    {'title': f'{skill} official docs', 'type': 'documentation'},
                    {'title': f'{skill} practical course', 'type': 'course'},
                    {'title': f'{skill} interview exercises', 'type': 'practice'},
                ],
            }
        )
    state['resources'] = resources
    return state


def final_report_node(state: AssessmentState) -> AssessmentState:
    state['report'] = {
        'skill_match': state.get('matched_skills', {}),
        'scores': state.get('scores', []),
        'gaps': state.get('gaps', {}),
        'learning_plan': state.get('plan', []),
        'resources': state.get('resources', []),
    }
    return state


def build_workflow():
    graph = StateGraph(AssessmentState)
    graph.add_node('resume_parser_node', resume_parser_node)
    graph.add_node('jd_parser_node', jd_parser_node)
    graph.add_node('skill_matcher_node', skill_matcher_node)
    graph.add_node('assessment_question_generator_node', assessment_question_generator_node)
    graph.add_node('answer_evaluator_node', answer_evaluator_node)
    graph.add_node('gap_analyzer_node', gap_analyzer_node)
    graph.add_node('learning_plan_generator_node', learning_plan_generator_node)
    graph.add_node('resource_recommender_node', resource_recommender_node)
    graph.add_node('final_report_node', final_report_node)

    graph.set_entry_point('resume_parser_node')
    graph.add_edge('resume_parser_node', 'jd_parser_node')
    graph.add_edge('jd_parser_node', 'skill_matcher_node')
    graph.add_edge('skill_matcher_node', 'assessment_question_generator_node')
    graph.add_edge('assessment_question_generator_node', 'answer_evaluator_node')
    graph.add_edge('answer_evaluator_node', 'gap_analyzer_node')
    graph.add_edge('gap_analyzer_node', 'learning_plan_generator_node')
    graph.add_edge('learning_plan_generator_node', 'resource_recommender_node')
    graph.add_edge('resource_recommender_node', 'final_report_node')
    graph.add_edge('final_report_node', END)

    return graph.compile()
