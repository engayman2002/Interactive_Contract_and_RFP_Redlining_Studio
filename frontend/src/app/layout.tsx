import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interactive Contract & RFP Redlining Studio",
  description:
    "Enterprise Split-Screen Contract & RFP Redlining Workspace powered by LangChain & TipTap",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}

