'use client';

import { useEffect, useState } from 'react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { apiPost } from '@/lib/api';

export default function AssessmentPage() {
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [resumeId, setResumeId] = useState('');
  const [jdId, setJdId] = useState('');

  useEffect(() => {
    setUserId(localStorage.getItem('user_id') ?? '');
    setResumeId(localStorage.getItem('resume_id') ?? '');
    setJdId(localStorage.getItem('jd_id') ?? '');
  }, []);

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
      } catch (err: any) {
        setError(err?.message || 'Could not initialize assessment. Ensure resume and JD are uploaded first.');
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
    } catch (err: any) {
      setError(err?.message || 'Failed to submit answer.');
    } finally {
      setLoading(false);
    }
  }

  const question = assessment?.questions?.[activeIdx];

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="card">
        <h2 className="text-2xl font-semibold">Conversational Assessment (Web)</h2>
        <p className="text-sm text-slate-600 mt-1">Answer each question with specific examples from your work.</p>

        {loading && <div className="mt-4"><LoadingSpinner label="Running adaptive assessment..." /></div>}
        {error && <p className="text-red-600 mt-3 whitespace-pre-wrap">{error}</p>}
        {!loading && !assessment && !error && (!userId || !resumeId || !jdId) && (
          <p className="text-slate-600 mt-3">Please complete intake first (resume + JD).</p>
        )}

        {question && (
          <div className="space-y-3 mt-6">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Question {activeIdx + 1} of {assessment?.questions?.length ?? 0}</span>
              <span>Skill: {question.skill}</span>
            </div>
            <p className="font-medium">{question.question}</p>
            <textarea className="w-full h-36 border rounded-lg p-3" value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} />
            <button className="px-4 py-2 bg-brand text-white rounded-lg" onClick={submitAnswer} disabled={loading || !currentAnswer.trim()}>
              Submit Answer
            </button>
          </div>
        )}

        {assessment && !question && <p className="mt-6 text-emerald-700">Assessment complete. Open Report page to review final output.</p>}
      </div>
    </div>
  );
}
