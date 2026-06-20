import { Outlet } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

export function Layout() {
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="w-[240px] flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
            Lista rozdziałów
          </h2>
        </div>
        <div className="flex-1 p-4">
          <p className="text-sm text-sidebar-foreground/60">
            Tutaj pojawi się lista rozdziałów...
          </p>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card flex items-center px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-semibold text-foreground">
              WriterStudio TipTap
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
