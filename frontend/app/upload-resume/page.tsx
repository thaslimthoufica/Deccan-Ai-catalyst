'use client';

import { FormEvent, useState } from 'react';

import LoadingSpinner from '@/components/LoadingSpinner';

const API_BASE_URL = '/backend-api';

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
      if (!res.ok) {
        throw new Error(data?.detail || `Upload failed with status ${res.status}`);
      }
      setResult(data);
      localStorage.setItem('user_id', userId);
      localStorage.setItem('resume_id', data?.data?.resume_id ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload resume.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="card w-full max-w-2xl">
        <div className="mb-6 text-center">
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">Step 1</span>
          <h2 className="mt-3 text-2xl font-semibold">Upload Resume</h2>
          <p className="mt-2 text-sm text-slate-600">Use a PDF or DOCX resume so the app can extract your skills and experience.</p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">User ID</span>
            <input className="field" value={userId} onChange={(e) => setUserId(e.target.value)} />
          </label>
          <label className="block rounded-2xl border border-dashed border-blue-300 bg-blue-50/60 p-6 text-center">
            <span className="block text-sm font-medium text-slate-700">{file ? file.name : 'Choose resume file'}</span>
            <span className="mt-1 block text-xs text-slate-500">PDF or DOCX only</span>
            <input className="sr-only" type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <button className="primary-button w-full" disabled={loading || !file}>
            {loading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </form>
        {loading && <div className="mt-4"><LoadingSpinner label="Parsing resume..." /></div>}
        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {result && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Resume uploaded. Continue to the job description step.</p>}
      </div>
    </div>
  );
}
