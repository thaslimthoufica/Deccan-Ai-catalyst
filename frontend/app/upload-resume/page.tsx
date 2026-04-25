'use client';

import { FormEvent, useState } from 'react';

import LoadingSpinner from '@/components/LoadingSpinner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export default function UploadResumePage() {
  const [userId, setUserId] = useState('00000000-0000-0000-0000-000000000001');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE_URL}/upload-resume?user_id=${userId}`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      setResult(data);
      localStorage.setItem('user_id', userId);
      localStorage.setItem('resume_id', data?.data?.resume_id ?? '');
    } catch {
      setError('Failed to upload resume.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card max-w-4xl">
      <h2 className="text-2xl font-semibold mb-4">Web Form: Upload Resume</h2>
      <p className="text-sm text-slate-600 mb-4">Supports PDF and DOCX resume files. This action stores parsed text for assessment.</p>

      <form className="grid gap-4 md:grid-cols-[2fr,1fr]" onSubmit={onSubmit}>
        <input className="border rounded-lg p-2" value={userId} onChange={(e) => setUserId(e.target.value)} />
        <input className="w-full" type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <div className="md:col-span-2">
          <button className="px-4 py-2 bg-brand text-white rounded-lg" disabled={loading || !file}>
            {loading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </div>
      </form>

      {loading && <div className="mt-4"><LoadingSpinner label="Parsing resume..." /></div>}
      {error && <p className="text-red-600 mt-3">{error}</p>}
      {result && <pre className="mt-4 text-xs bg-slate-100 p-3 rounded-lg overflow-auto">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
