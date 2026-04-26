'use client';

import { useEffect, useMemo, useState } from 'react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { apiPost } from '@/lib/api';

export default function AssessmentPage() {
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [error, setError] = useState('');

  const userId = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('user_id') ?? '' : '', []);
  const resumeId = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('resume_id') ?? '' : '', []);
  const jdId = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('jd_id') ?? '' : '', []);
  const availableTime = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('available_time') ?? '' : '', []);

  useEffect(() => {
    async function boot() {
      if (!userId || !resumeId || !jdId) return;
      setLoading(true);
      setError('');
      try {
        await apiPost('/extract-skills', { user_id: userId, resume_id: resumeId, jd_id: jdId });
        const started = await apiPost<any>('/start-assessment', { user_id: userId, resume_id: resumeId, jd_id: jdId });
        setAssessment(started.data);
        localStorage.setItem('assessment_id', started.data.assessment_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start assessment.');
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, [userId, resumeId, jdId]);

  async function submitAnswer() {
    if (!assessment) return;
    const q = assessment.questions?.[activeIdx];
    if (!q) return;
    setLoading(true);
    setError('');
    try {
      const result = await apiPost<any>('/submit-answer', {
        user_id: userId,
        assessment_id: assessment.assessment_id,
        question_id: q.id,
        answer: currentAnswer,
      });
      setCurrentAnswer('');
      setActiveIdx((p) => p + 1);
      setAssessment((prev: any) => ({ ...prev, latest: result.data }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer.');
    } finally {
      setLoading(false);
    }
  }

  const question = assessment?.questions?.[activeIdx];

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="card w-full max-w-3xl">
        <div className="mb-5">
          <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">Step 3</span>
          <h2 className="mt-3 text-2xl font-semibold">Conversational Skill Assessment</h2>
          {availableTime && <p className="mt-2 text-sm text-slate-600">Roadmap timeline: <span className="font-medium text-slate-800">{availableTime}</span></p>}
        </div>
        {loading && <LoadingSpinner label="Running adaptive assessment..." />}
        {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!loading && !assessment && <p className="text-slate-600">Upload resume and JD first.</p>}
        {question && (
          <div className="mt-4 space-y-4">
            <p className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">Skill: {question.skill}</p>
            <p className="text-lg font-medium text-slate-950">{question.question}</p>
            <textarea className="field h-32 resize-none" value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} />
            <button className="primary-button" onClick={submitAnswer} disabled={loading || !currentAnswer.trim()}>
              Submit Answer
            </button>
          </div>
        )}
        {assessment && !question && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">Assessment complete. Open dashboard for your timeline-aware report.</p>}
      </div>
    </div>
  );
}
