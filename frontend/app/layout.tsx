import './globals.css';
import NavBar from '@/components/NavBar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-slate-50 md:flex">
          <NavBar />
          <div className="flex-1">
            <header className="border-b bg-white px-4 py-3 md:px-8">
              <p className="text-sm text-slate-500">AI-Powered Skill Assessment & Personalized Learning Plan</p>
            </header>
            <main className="max-w-6xl mx-auto p-4 md:p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
