import Link from 'next/link';

export default function LandingPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Skill Assessment Agent (Web App)</h1>
        <p className="text-slate-600 mt-2 max-w-4xl">
          This is a browser-based web app for hiring teams and candidates. Upload resume + job description,
          run adaptive skill interviews, and generate a personalized learning plan with realistic timelines.
        </p>
      </div>

      <div className="web-grid">
        <article className="card">
          <h3 className="font-semibold">Step 1: Resume Intake</h3>
          <p className="text-sm text-slate-600 mt-2">Upload a PDF/DOCX resume and extract candidate profile data.</p>
          <Link className="inline-block mt-4 px-4 py-2 bg-brand text-white rounded-lg" href="/upload-resume">Open Resume Upload</Link>
        </article>

        <article className="card">
          <h3 className="font-semibold">Step 2: Job Description</h3>
          <p className="text-sm text-slate-600 mt-2">Paste target role JD to identify required and optional skills.</p>
          <Link className="inline-block mt-4 px-4 py-2 bg-brand text-white rounded-lg" href="/job-description">Open JD Intake</Link>
        </article>

        <article className="card">
          <h3 className="font-semibold">Step 3: Interview + Report</h3>
          <p className="text-sm text-slate-600 mt-2">Run conversational assessment and generate a final scorecard dashboard.</p>
          <div className="flex gap-2 mt-4">
            <Link className="px-4 py-2 border rounded-lg" href="/assessment">Assessment</Link>
            <Link className="px-4 py-2 border rounded-lg" href="/dashboard">Dashboard</Link>
          </div>
        </article>
      </div>
    </section>
  );
}
