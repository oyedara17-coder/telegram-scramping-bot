import React from "react";
import type { Metadata, Viewport } from "next";
import "./global.css";

export const metadata: Metadata = {
  title: {
    default: "Stepyzoid Studio",
    template: "%s | Stepyzoid Studio",
  },
  description: "Manage platform accounts, campaigns, leads, and operational activity.",
};

export const viewport: Viewport = {
  themeColor: "#050a12",
  colorScheme: "dark",
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
