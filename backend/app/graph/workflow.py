from __future__ import annotations

from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.services.llm import LLMService


SKILL_ROADMAP_DEFAULTS = {
    'Spark': {
        'topics': ['Spark architecture', 'DataFrames and Spark SQL', 'transformations and actions', 'joins and aggregations', 'partitioning and caching', 'reading/writing Parquet or CSV', 'basic performance tuning'],
        'resources': [
            {'title': 'Apache Spark Documentation', 'type': 'documentation', 'where_to_find': 'Search "Apache Spark SQL DataFrames Datasets Guide" on spark.apache.org.'},
            {'title': 'Databricks Spark tutorials', 'type': 'tutorial', 'where_to_find': 'Search "Databricks Apache Spark tutorial".'},
            {'title': 'PySpark practice notebooks', 'type': 'practice', 'where_to_find': 'Search GitHub for "pyspark dataframe exercises".'},
        ],
    },
    'SQL': {
        'topics': ['SELECT filtering and sorting', 'joins', 'grouping and aggregation', 'subqueries and CTEs', 'window functions', 'indexes and query plans', 'data modeling basics'],
        'resources': [
            {'title': 'Mode SQL Tutorial', 'type': 'tutorial', 'where_to_find': 'Search "Mode SQL tutorial".'},
            {'title': 'PostgreSQL Documentation', 'type': 'documentation', 'where_to_find': 'Search "PostgreSQL SELECT documentation".'},
            {'title': 'SQL practice problems', 'type': 'practice', 'where_to_find': 'Use HackerRank SQL or LeetCode Database practice sets.'},
        ],
    },
    'Python': {
        'topics': ['core syntax', 'functions and modules', 'file handling', 'virtual environments', 'error handling', 'APIs with requests', 'pandas basics', 'testing basics'],
        'resources': [
            {'title': 'Python Official Tutorial', 'type': 'documentation', 'where_to_find': 'Search "Python official tutorial".'},
            {'title': 'Real Python guides', 'type': 'tutorial', 'where_to_find': 'Search Real Python for the specific topic.'},
            {'title': 'Python practice exercises', 'type': 'practice', 'where_to_find': 'Use Exercism Python or HackerRank Python.'},
        ],
    },
    'ETL': {
        'topics': ['data extraction patterns', 'data cleaning', 'schema mapping', 'incremental loads', 'validation checks', 'logging and retries', 'scheduling', 'monitoring'],
        'resources': [
            {'title': 'Airflow tutorials', 'type': 'tutorial', 'where_to_find': 'Search "Apache Airflow tutorial DAG ETL".'},
            {'title': 'dbt fundamentals', 'type': 'course', 'where_to_find': 'Search "dbt Learn fundamentals".'},
            {'title': 'ETL project examples', 'type': 'practice', 'where_to_find': 'Search GitHub for "ETL pipeline Python project".'},
        ],
    },
}


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
    available_time: str


llm = LLMService()


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
    try:
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
        try:
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
    available_time = state.get('available_time') or state.get('jd_data', {}).get('available_time') or 'Not specified'
    prompt = (
        'Create a personalized learning plan in JSON key plan as an array of objects. '
        'Each object must include skill_name,current_level,target_level,why_this_matters,'
        'important_topics,roadmap_steps,learning_path,practice_steps,resource_guidance,'
        'estimated_time,mini_project. '
        'For important_topics, list the exact topics/subtopics the candidate must cover. '
        'For roadmap_steps, create ordered steps with week_or_phase, focus, topics, output, and checkpoint. '
        'For resource_guidance, recommend where to find documentation, tutorials, and practice material; include title,type,where_to_find, and why_useful. '
        'Make it specific, practical, and explain why each skill matters for the target role. '
        'Fit the roadmap inside the candidate available learning timeline. '
        f'Available learning timeline: {available_time}. '
        f"Resume data: {state.get('resume_data', {})}. "
        f"Job description data: {state.get('jd_data', {})}. "
        f"Skill gaps: {state.get('gaps', {})}. "
        f'Skills to prioritize: {skills}'
    )
    try:
        result = llm.json_completion('Generate practical upskilling plans for working professionals.', prompt)
        state['plan'] = result.get('plan', [])
    except Exception:
        state['plan'] = [
            {
                'skill_name': s,
                'current_level': 'Beginner',
                'target_level': 'Intermediate',
                'why_this_matters': f'{s} appears in the target job requirements but was not strongly matched in the resume or answers, so improving it can close a visible role-fit gap.',
                'important_topics': _skill_topics(s),
                'roadmap_steps': _roadmap_steps(s, available_time),
                'learning_path': f'Use the available timeline ({available_time}) to cover core {s} concepts first, then spend the remaining time on guided practice and one realistic project.',
                'practice_steps': [
                    f'Block the first part of the timeline for core {s} concepts and common interview scenarios.',
                    f'Use the middle part for 3-5 hands-on exercises focused on realistic {s} tasks.',
                    f'Use the final part to build, document, and explain one mini project using {s}.',
                ],
                'resource_guidance': _resource_guidance(s),
                'estimated_time': available_time,
                'mini_project': f'Build a small pipeline or service that uses {s}, includes sample input/output data, and explains the business problem it solves.',
            }
            for s in skills
        ]
    return state


def _skill_topics(skill: str) -> list[str]:
    return SKILL_ROADMAP_DEFAULTS.get(skill, {}).get(
        'topics',
        [
            f'{skill} fundamentals',
            f'common {skill} tools and terminology',
            f'hands-on {skill} exercises',
            f'{skill} use cases in the target role',
            f'interview questions and project explanation for {skill}',
        ],
    )


def _roadmap_steps(skill: str, available_time: str) -> list[dict[str, Any]]:
    topics = _skill_topics(skill)
    return [
        {
            'week_or_phase': 'Phase 1',
            'focus': 'Foundation',
            'topics': topics[:2],
            'output': f'Create short notes explaining the core ideas of {skill}.',
            'checkpoint': f'Explain when and why {skill} is used in the target role.',
        },
        {
            'week_or_phase': 'Phase 2',
            'focus': 'Guided Practice',
            'topics': topics[2:5],
            'output': f'Complete small exercises that use {skill} in realistic tasks.',
            'checkpoint': f'Solve one practice problem without copying the solution.',
        },
        {
            'week_or_phase': 'Final Phase',
            'focus': 'Portfolio Project',
            'topics': topics[5:] or topics[-2:],
            'output': f'Build a mini project using {skill} and document the decisions.',
            'checkpoint': f'Prepare a 2-minute explanation of the project, tradeoffs, and what you learned within {available_time}.',
        },
    ]


def _resource_guidance(skill: str) -> list[dict[str, str]]:
    return SKILL_ROADMAP_DEFAULTS.get(skill, {}).get(
        'resources',
        [
            {'title': f'{skill} official documentation', 'type': 'documentation', 'where_to_find': f'Search for "{skill} official documentation".', 'why_useful': 'Use it to learn correct terminology and reference core concepts.'},
            {'title': f'{skill} beginner tutorial', 'type': 'tutorial', 'where_to_find': f'Search YouTube or freeCodeCamp for "{skill} beginner tutorial".', 'why_useful': 'Use it for a guided first pass before practice.'},
            {'title': f'{skill} hands-on exercises', 'type': 'practice', 'where_to_find': f'Search GitHub, Kaggle, HackerRank, or LeetCode for "{skill} exercises".', 'why_useful': 'Use it to turn theory into proof of skill.'},
        ],
    )


def resource_recommender_node(state: AssessmentState) -> AssessmentState:
    resources = []
    for item in state.get('plan', []):
        skill = item.get('skill_name')
        guided_resources = item.get('resource_guidance') or _resource_guidance(skill)
        resources.append(
            {
                'skill_name': skill,
                'resources': guided_resources,
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
        'available_time': state.get('available_time') or state.get('jd_data', {}).get('available_time'),
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
