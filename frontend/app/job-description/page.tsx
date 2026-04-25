'use client';

import { FormEvent, useState } from 'react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { apiPost } from '@/lib/api';

export default function JobDescriptionPage() {
  const [title, setTitle] = useState('Backend AI Engineer');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function submitJD(e: FormEvent) {
    e.preventDefault();
    const userId = localStorage.getItem('user_id') || '00000000-0000-0000-0000-000000000001';
    setLoading(true);
    try {
      const data = await apiPost<any>('/submit-job-description', { user_id: userId, title, raw_text: rawText });
      localStorage.setItem('jd_id', data?.data?.jd_id ?? '');
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card max-w-3xl space-y-4">
      <h2 className="text-xl font-semibold">Submit Job Description</h2>
      <form className="space-y-3" onSubmit={submitJD}>
        <input className="w-full border rounded-lg p-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          className="w-full h-64 border rounded-lg p-2"
          placeholder="Paste job description..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
        <button className="px-4 py-2 bg-brand text-white rounded-lg" disabled={loading || rawText.length < 20}>Submit JD</button>
      </form>
      {loading && <LoadingSpinner label="Extracting JD metadata..." />}
      {result && <pre className="text-xs bg-slate-100 p-3 rounded-lg overflow-auto">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
