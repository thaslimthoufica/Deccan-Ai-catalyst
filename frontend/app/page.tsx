import Link from 'next/link';

export default function LandingPage() {
  return (
    <section className="flex min-h-[70vh] items-center">
      <div className="max-w-3xl space-y-6">
        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">Resume to roadmap in one guided flow</span>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">AI-Powered Skill Assessment and Learning Plan</h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-600">
          Upload a resume, compare it with a job description, answer targeted questions, and get a timeline-aware roadmap for the missing skills.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className="primary-button" href="/upload-resume">Start Assessment</Link>
          <Link className="secondary-button" href="/dashboard">View Dashboard</Link>
        </div>
      </div>
    </section>
  );
}
