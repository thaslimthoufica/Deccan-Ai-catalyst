'use client';

import { FormEvent, useState } from 'react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { apiPost } from '@/lib/api';

export default function IntakePage() {
  const [userId, setUserId] = useState('00000000-0000-0000-0000-000000000001');
  const [title, setTitle] = useState('Backend AI Engineer');
  const [jdText, setJdText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF or DOCX resume.');
      return;
    }
    if (jdText.trim().length < 20) {
      setError('Please paste a valid job description (at least 20 characters).');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const form = new FormData();
      form.append('file', file);

      const uploadJson = await apiPost<any>(`/upload-resume?user_id=${encodeURIComponent(userId)}`, form);

      const resumeId = uploadJson?.data?.resume_id;
      const jdRes = await apiPost<any>('/submit-job-description', {
        user_id: userId,
        title,
        raw_text: jdText,
      });

      const jdId = jdRes?.data?.jd_id;
      localStorage.setItem('user_id', userId);
      localStorage.setItem('resume_id', resumeId ?? '');
      localStorage.setItem('jd_id', jdId ?? '');

      setSuccess('Resume and job description saved successfully. You can now open Assessment.');
    } catch (err: any) {
      setError(err?.message || 'Failed to upload data.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center">
      <div className="w-full max-w-4xl rounded-2xl p-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400">
        <section className="card rounded-2xl border-0">
          <h2 className="text-2xl font-bold text-center">Candidate Intake (Resume + Job Description)</h2>
          <p className="text-center text-slate-600 mt-2">Upload PDF/DOCX and paste JD on the same page.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="border rounded-lg p-3"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="User ID"
              />
              <input
                className="border rounded-lg p-3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Job title"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Resume file (PDF or DOCX)</label>
              <input
                className="w-full mt-1"
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Job Description</label>
              <textarea
                className="w-full h-56 border rounded-lg p-3"
                placeholder="Paste the full JD here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            </div>

            <div className="flex justify-center">
              <button
                className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Save Resume + JD'}
              </button>
            </div>
          </form>

          {loading && (
            <div className="mt-4 flex justify-center">
              <LoadingSpinner label="Uploading and parsing files..." />
            </div>
          )}
          {error && <p className="mt-4 text-center text-red-600">{error}</p>}
          {success && <p className="mt-4 text-center text-emerald-700">{success}</p>}
        </section>
      </div>
    </div>
  );
}
