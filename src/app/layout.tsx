import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Open Vaartha CaseDesk — The Case Desk for Public-Interest Creators",
  description:
    "CaseDesk, part of Open Vaartha, helps creators organize citizen complaints, manage evidence, verify issues, create responsible content, and track cases through resolution.",
  keywords: [
    "creator case management",
    "citizen complaints",
    "public interest creators",
    "investigation platform",
    "case management for creators",
    "AI investigation assistant",
    "public interest journalism",
    "complaint management",
    "creator workflow",
  ],
  icons: {
    icon: '/casedesk.png',
    apple: '/casedesk.png',
  },
  openGraph: {
    title: "Open Vaartha CaseDesk — The Case Desk for Public-Interest Creators",
    description:
      "Turn citizen messages into organized investigations. One workspace to collect, understand, verify, investigate, publish, and follow up.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable} ${sourceSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
