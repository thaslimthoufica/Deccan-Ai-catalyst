'use client';

import { FormEvent, useState } from 'react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { apiPost } from '@/lib/api';

export default function JobDescriptionPage() {
  const [title, setTitle] = useState('Backend AI Engineer');
  const [rawText, setRawText] = useState('');
  const [availableTime, setAvailableTime] = useState('4 weeks, 6 hours per week');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function submitJD(e: FormEvent) {
    e.preventDefault();
    const userId = localStorage.getItem('user_id') || '00000000-0000-0000-0000-000000000001';
    setLoading(true);
    setError('');
    try {
      const data = await apiPost<any>('/submit-job-description', { user_id: userId, title, raw_text: rawText, available_time: availableTime });
      localStorage.setItem('jd_id', data?.data?.jd_id ?? '');
      localStorage.setItem('available_time', availableTime);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit job description.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="card w-full max-w-3xl space-y-5">
        <div className="text-center">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">Step 2</span>
          <h2 className="mt-3 text-2xl font-semibold">Submit Job Description</h2>
          <p className="mt-2 text-sm text-slate-600">Add the role details and your available learning time so the roadmap fits your schedule.</p>
        </div>
        <form className="space-y-4" onSubmit={submitJD}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Target Role</span>
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Available Time To Develop Missing Skills</span>
            <input
              className="field"
              placeholder="Example: 4 weeks, 6 hours per week"
              value={availableTime}
              onChange={(e) => setAvailableTime(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Job Description</span>
            <textarea
              className="field h-64 resize-none"
              placeholder="Paste job description..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </label>
          <button className="primary-button w-full" disabled={loading || rawText.length < 20 || !availableTime.trim()}>Submit Job Description</button>
        </form>
        {loading && <LoadingSpinner label="Extracting JD metadata..." />}
        {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {result && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Job description saved. Continue to the assessment.</p>}
      </div>
    </div>
  );
}
