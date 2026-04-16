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
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="px-4 sm:px-6 lg:px-10 xl:px-12 py-6 lg:py-8 max-w-[1400px]">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
