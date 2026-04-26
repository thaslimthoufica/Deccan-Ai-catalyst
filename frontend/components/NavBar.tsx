import Link from 'next/link';

export default function NavBar() {
  return (
    <header className="border-b border-white/70 bg-white/80 backdrop-blur">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-brand">Skill Catalyst</Link>
        <div className="flex flex-wrap justify-end gap-3 text-sm text-slate-700">
          <Link href="/upload-resume">Upload Resume</Link>
          <Link href="/job-description">Job Description</Link>
          <Link href="/assessment">Assessment</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </nav>
    </header>
  );
}
