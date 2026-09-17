import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Citizen Helpdesk — CaseDesk',
  description: 'Report civic issues, government failures, and public problems directly to our investigative team.',
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
