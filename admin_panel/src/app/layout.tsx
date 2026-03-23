import React from "react";
import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
  title: "Stepyzoid | Admin Control",
  description: "Global node orchestration and neural network management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className="antialiased bg-slate-950 text-foreground min-h-screen"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
