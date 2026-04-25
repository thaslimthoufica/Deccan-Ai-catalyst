import Link from 'next/link';

export default function LandingPage() {
  return (
    <section className="space-y-6">
      <div className="card text-center max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-indigo-700">Skill Assessment Agent (Web App)</h1>
        <p className="text-slate-600 mt-2">
          Upload resume and job description on one page, run an adaptive interview, and get a personalized learning plan.
        </p>
        <Link className="inline-block mt-5 px-5 py-2 rounded-lg bg-indigo-600 text-white" href="/upload-resume">
          Start Intake
        </Link>
      </div>

      <div className="web-grid">
        <article className="card">
          <h3 className="font-semibold text-indigo-700">1) Intake Page</h3>
          <p className="text-sm text-slate-600 mt-2">Single page for PDF/DOCX upload + job description input.</p>
        </article>

        <article className="card">
          <h3 className="font-semibold text-indigo-700">2) Conversational Assessment</h3>
          <p className="text-sm text-slate-600 mt-2">Answer adaptive technical questions by required job skills.</p>
        </article>

        <article className="card">
          <h3 className="font-semibold text-indigo-700">3) Final Report</h3>
          <p className="text-sm text-slate-600 mt-2">Review scores, gaps, and realistic upskilling roadmap.</p>
        </article>
      </div>
    </section>
  );
}
