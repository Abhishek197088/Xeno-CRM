import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Xeno CRM | AI-Native Mini CRM',
  description: 'Intelligent shopper engagement platform powered by AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Load Inter font from Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme') || 'dark';
              document.documentElement.classList.add(theme);
            } catch (e) {}
          })();
        `}} />
      </head>
      <body className="antialiased min-h-screen bg-zinc-950 text-zinc-200">
        <Providers>
          <div className="flex min-h-screen relative">
            {/* Background glowing decorations - Drifting blobs */}
            <div className="pointer-events-none fixed -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-purple-900/15 blur-[150px] animate-float-blob-1" />
            <div className="pointer-events-none fixed -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-900/15 blur-[150px] animate-float-blob-2" />
            <div className="pointer-events-none fixed top-1/2 left-1/3 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-pink-900/10 blur-[150px] animate-float-blob-3" />
            
            <Sidebar />
            
            <main className="flex-1 pl-[var(--sidebar-width,16rem)] min-h-screen bg-zinc-950/40 relative z-10 transition-[padding] duration-300">
              <Navbar />
              <div className="p-8 max-w-[1400px] mx-auto w-full">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
