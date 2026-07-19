"use client";

import { Sidebar, MobileNav } from "@/components/Shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileNav />
      <main className="px-4 pb-24 pt-6 sm:px-6 lg:ml-[220px] lg:px-8 lg:pb-10">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}
