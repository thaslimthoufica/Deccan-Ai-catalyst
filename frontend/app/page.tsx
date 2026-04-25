import Link from 'next/link';

export default function LandingPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">AI-Powered Skill Assessment & Learning Plan</h1>
      <p className="text-slate-600 max-w-3xl">
        Go beyond resume claims. Upload resume + job description, run adaptive skill assessment,
        score proficiency, and receive a realistic personalized learning roadmap.
      </p>
      <div className="flex gap-3">
        <Link className="px-4 py-2 bg-brand text-white rounded-lg" href="/upload-resume">Start Assessment</Link>
        <Link className="px-4 py-2 border rounded-lg" href="/dashboard">View Dashboard</Link>
      </div>
    </section>
  );
}
