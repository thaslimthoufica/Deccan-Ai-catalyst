import './globals.css';
import NavBar from '@/components/NavBar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main className="mx-auto min-h-[calc(100vh-64px)] max-w-6xl p-4 md:p-8">{children}</main>
      </body>
    </html>
  );
}
