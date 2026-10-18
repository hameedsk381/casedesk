import type { Metadata, Viewport } from 'next';
import { Inter, Bricolage_Grotesque, Noto_Sans_Telugu } from 'next/font/google';
import { getServerLang } from '@/lib/i18n/serverLang';
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

const notoTelugu = Noto_Sans_Telugu({
  variable: '--font-telugu',
  subsets: ['telugu'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ComplianBox',
  description: 'Report ward-level problems before the municipal elections and see which departments respond. Independent and non-partisan.',
  icons: {
    icon: '/complianbox.png',
    apple: '/complianbox.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ComplianBox',
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getServerLang();
  return (
    <html lang={lang} className={`${inter.variable} ${bricolage.variable} ${notoTelugu.variable}`}>
      <body className="min-h-dvh flex flex-col bg-background text-foreground font-sans antialiased selection:bg-primary/15 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
