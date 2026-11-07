import type { Metadata } from "next";
import React from "react";
import "./globals.css";

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-indigo-500/20 selection:text-indigo-900 dark:bg-[#0B0F19] dark:text-slate-100 dark:selection:bg-indigo-500/30 dark:selection:text-indigo-100">
        {children}
      </body>
    </html>
  );
}
