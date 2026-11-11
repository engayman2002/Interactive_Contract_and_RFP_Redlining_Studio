import type { Metadata } from "next";
import { JetBrains_Mono, Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import React from "react";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Redline Studio | Enterprise Contract & RFP Intelligence",
  description:
    "Executive Split-Screen Contract & RFP Redlining Workspace powered by Hybrid Playbook Retrieval, LangChain & TipTap",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 antialiased selection:bg-indigo-500/20 selection:text-indigo-900 dark:bg-[#060911] dark:text-slate-100 dark:selection:bg-indigo-500/30 dark:selection:text-indigo-100">
        {children}
      </body>
    </html>
  );
}
