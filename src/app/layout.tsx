import type { Metadata } from "next";
import "./globals.css";
import { MomentumProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Momentum — Design Your Life. Every Day.",
  description: "AI-powered Life Operating System. Planning, habits, goals, journaling, analytics, and AI coaching in one place."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <MomentumProvider>{children}</MomentumProvider>
      </body>
    </html>
  );
}
