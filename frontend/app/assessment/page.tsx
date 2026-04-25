'use client';

import { useEffect, useMemo, useState } from 'react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { apiPost } from '@/lib/api';

export default function AssessmentPage() {
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  const userId = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('user_id') ?? '' : '', []);
  const resumeId = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('resume_id') ?? '' : '', []);
  const jdId = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('jd_id') ?? '' : '', []);

  useEffect(() => {
    async function boot() {
      if (!userId || !resumeId || !jdId) return;
      setLoading(true);
      try {
        await apiPost('/extract-skills', { user_id: userId, resume_id: resumeId, jd_id: jdId });
        const started = await apiPost<any>('/start-assessment', { user_id: userId, resume_id: resumeId, jd_id: jdId });
        setAssessment(started.data);
        localStorage.setItem('assessment_id', started.data.assessment_id);
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
    } finally {
      setLoading(false);
    }
  }

  const question = assessment?.questions?.[activeIdx];

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-xl font-semibold">Conversational Skill Assessment</h2>
        {loading && <LoadingSpinner label="Running adaptive assessment..." />}
        {!loading && !assessment && <p className="text-slate-600">Upload resume and JD first.</p>}
        {question && (
          <div className="space-y-3 mt-4">
            <p className="font-medium">Skill: {question.skill}</p>
            <p>{question.question}</p>
            <textarea className="w-full h-28 border rounded-lg p-2" value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} />
            <button className="px-4 py-2 bg-brand text-white rounded-lg" onClick={submitAnswer} disabled={loading || !currentAnswer.trim()}>
              Submit Answer
            </button>
          </div>
        )}
        {assessment && !question && <p className="mt-4">Assessment complete. Open dashboard for report.</p>}
      </div>
    </div>
  );
}
