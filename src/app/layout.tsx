import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CaseDesk — The Case Desk for Public-Interest Creators",
  description:
    "CaseDesk helps creators organize citizen complaints, manage evidence, verify issues, create responsible content, and track cases through resolution.",
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
  openGraph: {
    title: "CaseDesk — The Case Desk for Public-Interest Creators",
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
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-off-white text-navy font-sans">
        {children}
      </body>
    </html>
  );
}
