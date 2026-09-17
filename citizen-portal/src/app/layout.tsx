import type { Metadata, Viewport } from 'next';
import { Inter, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Community Helpdesk',
  description: 'Share community service needs and local improvement suggestions with the helpdesk team.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Community Helpdesk',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#550000',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable}`}>
      <body className="min-h-dvh flex flex-col bg-background text-foreground font-sans antialiased selection:bg-primary/15 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
