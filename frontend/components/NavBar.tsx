import Link from 'next/link';

export default function NavBar() {
  return (
    <header className="border-b bg-white">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-brand">Skill Assessment Agent</Link>
        <div className="flex gap-4 text-sm">
          <Link href="/upload-resume">Upload Resume</Link>
          <Link href="/job-description">Job Description</Link>
          <Link href="/assessment">Assessment</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </nav>
    </header>
  );
}
