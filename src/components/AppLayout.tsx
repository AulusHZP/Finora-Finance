import { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <DesktopSidebar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
