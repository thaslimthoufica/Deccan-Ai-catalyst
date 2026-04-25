import Link from 'next/link';

export default function JobDescriptionPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="card max-w-2xl text-center">
        <h2 className="text-2xl font-semibold">Job Description is now in the Intake Page</h2>
        <p className="text-slate-600 mt-2">
          To simplify the web app flow, resume upload and job description submission are combined on one page.
        </p>
        <Link href="/upload-resume" className="inline-block mt-5 px-5 py-2 rounded-lg bg-indigo-600 text-white">
          Go to Combined Intake Page
        </Link>
      </div>
    </div>
  );
}
