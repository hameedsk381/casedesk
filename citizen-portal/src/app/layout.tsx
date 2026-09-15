import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Citizen Story Portal — CaseDesk',
  description: 'Submit civic issues, whistleblower reports, and investigative stories directly to independent journalists.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f8f7f4',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-linear-to-b from-slate-50 via-off-white to-slate-100 text-navy font-sans antialiased selection:bg-electric-blue/15 selection:text-electric-blue">
        {children}
      </body>
    </html>
  );
}
