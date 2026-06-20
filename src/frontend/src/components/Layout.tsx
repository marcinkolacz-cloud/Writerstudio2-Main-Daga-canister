import { ChatBotPanel } from "@/components/chat/ChatBotPanel";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { BarChart3, BookOpen, LogOut, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

function useActiveBookId(): string | null {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const bookMatch = pathname.match(/\/books\/([^\/]+)/);
  if (bookMatch) return bookMatch[1];

  return null;
}

export function Layout() {
  const navigate = useNavigate();
  const { isAuthenticated, clearAuth } = useAppStore();
  const { clear } = useInternetIdentity();
  const activeBookId = useActiveBookId();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("writerstudio-theme");
    if (stored === "dark") return "dark";
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("writerstudio-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogout = () => {
    clear();
    clearAuth();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="w-[240px] flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
            Lista rozdziałów
          </h2>
        </div>
        <div className="flex-1 p-4 space-y-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            data-ocid="nav.dashboard_link"
          >
            <BookOpen className="h-4 w-4" />
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/statistics" })}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            data-ocid="nav.statistics_link"
          >
            <BarChart3 className="h-4 w-4" />
            Statystyki
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card flex items-center px-6 flex-shrink-0 justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-semibold text-foreground">
              WriterStudio TipTap
            </span>
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                aria-label={
                  theme === "light" ? "Włącz ciemny motyw" : "Włącz jasny motyw"
                }
                data-ocid="theme.toggle_button"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                data-ocid="auth.logout_button"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Wyloguj się
              </Button>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>

        {/* Floating chatbot — only on book/chapter routes */}
        {isAuthenticated && activeBookId && (
          <ChatBotPanel bookId={activeBookId} />
        )}
      </div>
    </div>
  );
}
