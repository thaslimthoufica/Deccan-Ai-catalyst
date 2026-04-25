import Link from 'next/link';

const links = [
  { href: '/', label: 'Overview' },
  { href: '/upload-resume', label: 'Intake (Resume + JD)' },
  { href: '/assessment', label: 'Assessment' },
  { href: '/dashboard', label: 'Final Report' },
];

export default function NavBar() {
  return (
    <aside className="hidden md:flex md:flex-col w-72 border-r bg-white/90 backdrop-blur min-h-screen sticky top-0">
      <div className="px-5 py-5 border-b">
        <h1 className="font-bold text-lg text-indigo-700">Skill Assessment Web App</h1>
        <p className="text-xs text-slate-500 mt-1">Recruiter-friendly desktop workflow</p>
      </div>
      <nav className="p-3 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
