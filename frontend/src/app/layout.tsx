import React from "react";
import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
  title: "Stepyzoid Studio",
  description: "Elite Automation Node v2.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased bg-slate-950 dark"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
