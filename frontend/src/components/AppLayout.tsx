import { ReactNode } from "react";
import { FloatingNav } from "@/components/FloatingNav";
import { BottomNav } from "@/components/BottomNav";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      {/* ── Ambient background blobs ─────────────────────────────────────────── */}
      {/* These are essential: glassmorphism only shows when content passes beneath */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        {/* Top-left blob — primary blue */}
        <div
          className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }}
        />
        {/* Top-right blob — indigo */}
        <div
          className="absolute -top-20 right-0 h-[400px] w-[400px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
        />
        {/* Center blob — sky blue accent */}
        <div
          className="absolute top-[35%] left-1/2 -translate-x-1/2 h-[360px] w-[600px] rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(ellipse, #60a5fa 0%, transparent 70%)" }}
        />
        {/* Bottom-right blob — deep blue */}
        <div
          className="absolute bottom-0 right-0 h-[440px] w-[440px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #1d4ed8 0%, transparent 70%)" }}
        />
      </div>

      {/* ── Floating navigation bar ──────────────────────────────────────────── */}
      <FloatingNav />

      {/* ── Page content ─────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 min-w-0 pt-24 sm:pt-24 pb-20 sm:pb-8">
        <div className="px-4 sm:px-6 lg:px-10 xl:px-12 max-w-[1400px] mx-auto w-full">
          {children}
        </div>
      </main>

      {/* ── Bottom nav (mobile only, complementary quick-access) ─────────────── */}
      <BottomNav />
    </div>
  );
}
