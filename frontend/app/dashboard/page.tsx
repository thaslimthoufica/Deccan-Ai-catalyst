'use client';

import { useEffect, useState } from 'react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { apiGet, apiPost } from '@/lib/api';

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    async function loadReport() {
      const userId = localStorage.getItem('user_id');
      if (!userId) return;
      setLoading(true);
      try {
        const assessmentReport = await apiGet<any>(`/assessment-report/${userId}`);
        setReport(assessmentReport.data.assessment);
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
    try {
      await apiPost('/generate-learning-plan', { user_id: userId, assessment_id: assessmentId });
      const refreshed = await apiGet<any>(`/assessment-report/${userId}`);
      setReport(refreshed.data.assessment);
    } finally {
      setLoading(false);
    }
  }

  const finalReport = report?.snapshot?.report;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Final Report Dashboard (Web)</h2>
        <button className="px-4 py-2 bg-brand text-white rounded-lg" onClick={generateLearningPlan} disabled={loading}>
          Save Learning Plan to DB
        </button>
      </div>

      {loading && <LoadingSpinner label="Loading report..." />}
      {!loading && !finalReport && <p className="text-slate-600">No report available yet.</p>}

      {finalReport && (
        <div className="grid xl:grid-cols-12 gap-4">
          <section className="card xl:col-span-4">
            <h3 className="font-semibold mb-2">Gap Analysis</h3>
            <pre className="text-xs bg-slate-100 p-3 rounded-lg overflow-auto">{JSON.stringify(finalReport.gaps, null, 2)}</pre>
          </section>
          <section className="card xl:col-span-4">
            <h3 className="font-semibold mb-2">Skill Scores</h3>
            <pre className="text-xs bg-slate-100 p-3 rounded-lg overflow-auto">{JSON.stringify(finalReport.scores, null, 2)}</pre>
          </section>
          <section className="card xl:col-span-4">
            <h3 className="font-semibold mb-2">Skill Match</h3>
            <pre className="text-xs bg-slate-100 p-3 rounded-lg overflow-auto">{JSON.stringify(finalReport.skill_match, null, 2)}</pre>
          </section>
          <section className="card xl:col-span-12">
            <h3 className="font-semibold mb-2">Personalized Learning Plan</h3>
            <pre className="text-xs bg-slate-100 p-3 rounded-lg overflow-auto">{JSON.stringify(finalReport.learning_plan, null, 2)}</pre>
          </section>
        </div>
      )}
    </div>
  );
}
