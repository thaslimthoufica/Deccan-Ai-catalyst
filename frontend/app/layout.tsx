import './globals.css';
import NavBar from '@/components/NavBar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-sky-50 via-indigo-50 to-cyan-50">
        <div className="min-h-screen md:flex">
          <NavBar />
          <div className="flex-1">
            <header className="border-b bg-white/80 backdrop-blur px-4 py-4 md:px-8 text-center">
              <p className="text-sm md:text-base font-medium text-indigo-700">
                AI-Powered Skill Assessment & Personalized Learning Plan
              </p>
            </header>
            <main className="max-w-6xl mx-auto p-4 md:p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
