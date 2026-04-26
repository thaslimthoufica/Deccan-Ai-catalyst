'use client';

import { useEffect, useMemo, useState } from 'react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { apiGet, apiPost } from '@/lib/api';

type SkillScore = {
  skill?: string;
  level?: string;
  score_label?: string;
  reason?: string;
  rationale?: string;
};

type LearningPlanItem = {
  skill_name?: string;
  current_level?: string;
  target_level?: string;
  why_this_matters?: string;
  important_topics?: string[];
  roadmap_steps?: Array<{
    week_or_phase?: string;
    focus?: string;
    topics?: string[];
    output?: string;
    checkpoint?: string;
  }>;
  learning_path?: string;
  practice_steps?: string[];
  resource_guidance?: Array<{
    title?: string;
    type?: string;
    where_to_find?: string;
    why_useful?: string;
  }>;
  estimated_time?: string;
  mini_project?: string;
};

type ResourceGroup = {
  skill_name?: string;
  resources?: Array<{ title?: string; type?: string; resource_url?: string; where_to_find?: string; why_useful?: string }>;
};

type FinalReport = {
  skill_match?: {
    strong?: string[];
    missing?: string[];
  };
  scores?: SkillScore[];
  gaps?: {
    strong_skills?: string[];
    weak_skills?: string[];
    missing_skills?: string[];
    adjacent_skills?: string[];
  };
  learning_plan?: LearningPlanItem[];
  resources?: ResourceGroup[];
  available_time?: string;
};

function uniqueList(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return Array.from(new Set(items.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)));
}

function Chip({ children, tone = 'slate' }: { children: string; tone?: 'green' | 'amber' | 'blue' | 'slate' }) {
  const classes = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return <span className={`inline-flex rounded-full border px-3 py-1 text-sm ${classes[tone]}`}>{children}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">{text}</p>;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReport() {
      const userId = localStorage.getItem('user_id');
      if (!userId) return;
      setLoading(true);
      setError('');
      try {
        const assessmentReport = await apiGet<any>(`/assessment-report/${userId}`);
        setReport(assessmentReport.data.assessment);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load report.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, []);

  async function generateLearningPlan() {
    const userId = localStorage.getItem('user_id');
    const assessmentId = localStorage.getItem('assessment_id');
    if (!userId || !assessmentId) return;
    setLoading(true);
    setError('');
    try {
      await apiPost('/generate-learning-plan', { user_id: userId, assessment_id: assessmentId });
      const refreshed = await apiGet<any>(`/assessment-report/${userId}`);
      setReport(refreshed.data.assessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save learning plan.');
    } finally {
      setLoading(false);
    }
  }

  const finalReport = report?.snapshot?.report as FinalReport | undefined;

  const summary = useMemo(() => {
    const strong = uniqueList(finalReport?.skill_match?.strong ?? finalReport?.gaps?.strong_skills);
    const missing = uniqueList(finalReport?.skill_match?.missing ?? finalReport?.gaps?.missing_skills);
    const weak = uniqueList(finalReport?.gaps?.weak_skills);
    const adjacent = uniqueList(finalReport?.gaps?.adjacent_skills);
    const plan = Array.isArray(finalReport?.learning_plan) ? finalReport.learning_plan : [];
    const scores = Array.isArray(finalReport?.scores) ? finalReport.scores : [];

    return { strong, missing, weak, adjacent, plan, scores };
  }, [finalReport]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Assessment Dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">A readable summary of skill fit, assessment results, and next steps.</p>
          {finalReport?.available_time && <p className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">Roadmap timeline: {finalReport.available_time}</p>}
        </div>
        <button className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60" onClick={generateLearningPlan} disabled={loading}>
          Save Learning Plan
        </button>
      </div>

      {loading && <LoadingSpinner label="Loading report..." />}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!loading && !finalReport && <EmptyState text="No report available yet. Complete the assessment first, then return here." />}

      {finalReport && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <section className="card">
              <p className="text-sm text-slate-500">Matched Skills</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-700">{summary.strong.length}</p>
            </section>
            <section className="card">
              <p className="text-sm text-slate-500">Missing Skills</p>
              <p className="mt-2 text-3xl font-semibold text-amber-700">{summary.missing.length}</p>
            </section>
            <section className="card">
              <p className="text-sm text-slate-500">Questions Scored</p>
              <p className="mt-2 text-3xl font-semibold text-blue-700">{summary.scores.length}</p>
            </section>
            <section className="card">
              <p className="text-sm text-slate-500">Plan Items</p>
              <p className="mt-2 text-3xl font-semibold text-slate-800">{summary.plan.length}</p>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Skill Fit</h3>
                <p className="text-sm text-slate-600">What already matches the job and what needs attention.</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Matched</p>
                <div className="flex flex-wrap gap-2">
                  {summary.strong.length ? summary.strong.map((skill) => <Chip key={skill} tone="green">{skill}</Chip>) : <EmptyState text="No matched skills were detected." />}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Missing or Needs Practice</p>
                <div className="flex flex-wrap gap-2">
                  {summary.missing.length ? summary.missing.map((skill) => <Chip key={skill} tone="amber">{skill}</Chip>) : <EmptyState text="No missing skills were detected." />}
                </div>
              </div>
            </section>

            <section className="card space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Skill Scores</h3>
                <p className="text-sm text-slate-600">Evaluation from your submitted assessment answers.</p>
              </div>
              {summary.scores.length ? (
                <div className="space-y-3">
                  {summary.scores.map((score, index) => {
                    const level = score.level ?? score.score_label ?? 'Pending';
                    return (
                      <div key={`${score.skill ?? 'skill'}-${index}`} className="rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-slate-900">{score.skill ?? 'Skill'}</p>
                          <Chip tone={level === 'Advanced' ? 'green' : level === 'Beginner' ? 'amber' : 'blue'}>{level}</Chip>
                        </div>
                        {(score.reason || score.rationale) && <p className="mt-2 text-sm text-slate-600">{score.reason || score.rationale}</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState text="No answer scores yet. Submit assessment answers to populate this section." />
              )}
            </section>
          </div>

          <section className="card space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Personalized Learning Plan</h3>
              <p className="text-sm text-slate-600">Prioritized actions based on your gaps and target role.</p>
            </div>
            {summary.plan.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {summary.plan.map((item, index) => (
                  <article key={`${item.skill_name ?? 'plan'}-${index}`} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-semibold text-slate-950">{item.skill_name ?? `Focus Area ${index + 1}`}</h4>
                      {item.estimated_time && <Chip tone="slate">{item.estimated_time}</Chip>}
                    </div>
                    {(item.current_level || item.target_level) && (
                      <p className="mt-2 text-sm text-slate-600">
                        {item.current_level ?? 'Current'} to {item.target_level ?? 'Target'}
                      </p>
                    )}
                    {item.why_this_matters && (
                      <div className="mt-4 rounded-lg bg-amber-50 p-3">
                        <p className="text-sm font-medium text-amber-900">Why This Matters</p>
                        <p className="mt-1 text-sm leading-6 text-amber-900">{item.why_this_matters}</p>
                      </div>
                    )}
                    {Array.isArray(item.important_topics) && item.important_topics.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-slate-900">Important Topics To Cover</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.important_topics.map((topic) => <Chip key={topic} tone="blue">{topic}</Chip>)}
                        </div>
                      </div>
                    )}
                    {Array.isArray(item.roadmap_steps) && item.roadmap_steps.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-slate-900">Step-by-Step Roadmap</p>
                        <div className="mt-3 space-y-3">
                          {item.roadmap_steps.map((step, stepIndex) => (
                            <div key={`${step.week_or_phase ?? 'phase'}-${stepIndex}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <Chip tone="slate">{step.week_or_phase ?? `Step ${stepIndex + 1}`}</Chip>
                                {step.focus && <p className="font-medium text-slate-900">{step.focus}</p>}
                              </div>
                              {Array.isArray(step.topics) && step.topics.length > 0 && (
                                <p className="mt-2 text-sm text-slate-700">Cover: {step.topics.join(', ')}</p>
                              )}
                              {step.output && <p className="mt-2 text-sm text-slate-700">Output: {step.output}</p>}
                              {step.checkpoint && <p className="mt-2 text-sm text-slate-600">Checkpoint: {step.checkpoint}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.learning_path && <p className="mt-3 text-sm leading-6 text-slate-700">{item.learning_path}</p>}
                    {Array.isArray(item.practice_steps) && item.practice_steps.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-slate-900">Practice Steps</p>
                        <ol className="mt-2 space-y-2 text-sm text-slate-700">
                          {item.practice_steps.map((step, stepIndex) => (
                            <li key={`${step}-${stepIndex}`} className="flex gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                                {stepIndex + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {item.mini_project && (
                      <div className="mt-4 rounded-lg bg-blue-50 p-3">
                        <p className="text-sm font-medium text-blue-900">Mini Project</p>
                        <p className="mt-1 text-sm text-blue-800">{item.mini_project}</p>
                      </div>
                    )}
                    {Array.isArray(item.resource_guidance) && item.resource_guidance.length > 0 && (
                      <div className="mt-4 rounded-lg bg-emerald-50 p-3">
                        <p className="text-sm font-medium text-emerald-900">Where To Learn</p>
                        <ul className="mt-2 space-y-2">
                          {item.resource_guidance.map((resource, resourceIndex) => (
                            <li key={`${resource.title ?? 'resource'}-${resourceIndex}`} className="text-sm text-emerald-900">
                              <span className="font-medium">{resource.title ?? 'Resource'}</span>
                              {resource.type && <span> - {resource.type}</span>}
                              {resource.where_to_find && <p className="text-emerald-800">Find it: {resource.where_to_find}</p>}
                              {resource.why_useful && <p className="text-emerald-700">Why: {resource.why_useful}</p>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState text="No learning plan items yet. The fallback mode may keep this minimal until OpenAI quota is available." />
            )}
          </section>

          <section className="card space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Recommended Resources</h3>
              <p className="text-sm text-slate-600">Reference material grouped by skill.</p>
            </div>
            {Array.isArray(finalReport.resources) && finalReport.resources.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {finalReport.resources.map((group, index) => (
                  <article key={`${group.skill_name ?? 'resource'}-${index}`} className="rounded-lg border border-slate-200 p-4">
                    <h4 className="font-semibold text-slate-950">{group.skill_name ?? 'Skill Resources'}</h4>
                    <ul className="mt-3 space-y-2">
                      {(group.resources ?? []).map((resource, resourceIndex) => (
                        <li key={`${resource.title ?? 'resource'}-${resourceIndex}`} className="text-sm text-slate-700">
                          <span className="font-medium">{resource.title ?? 'Resource'}</span>
                          {resource.type && <span className="text-slate-500"> - {resource.type}</span>}
                          {resource.where_to_find && <p className="text-slate-600">Find it: {resource.where_to_find}</p>}
                          {resource.why_useful && <p className="text-slate-500">Why: {resource.why_useful}</p>}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState text="No resources were generated yet." />
            )}
          </section>
        </>
      )}
    </div>
  );
}
