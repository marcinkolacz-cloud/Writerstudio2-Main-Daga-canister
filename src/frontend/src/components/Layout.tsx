import { SettingsModal } from "@/components/SettingsModal";
import { ChatBotPanel } from "@/components/chat/ChatBotPanel";
import { Button } from "@/components/ui/button";
import { useBook, useChapters, useReorderChapters } from "@/hooks/useBackend";
import { useAppStore } from "@/store/useAppStore";
import {
  Outlet,
  useNavigate,
  useParams,
  useRouterState,
} from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  FileText,
  GripVertical,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
  Trash2,
  WifiOff,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthClient } from "../hooks/useAuthClient";

function useActiveBookId(): string | null {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const bookMatch = pathname.match(/\/books\/([^\/]+)/);
  if (bookMatch) return bookMatch[1];

  return null;
}

function useActiveChapterId(): string | null {
  const params = useParams({ strict: false });
  return (params as Record<string, string | undefined>).chapterId ?? null;
}

export function Layout() {
  const navigate = useNavigate();
  const { isAuthenticated, clearAuth } = useAppStore();
  const { clear } = useAuthClient();
  const activeBookId = useActiveBookId();
  const activeChapterId = useActiveChapterId();
  const { data: chapters } = useChapters(activeBookId ?? "");
  const { data: book } = useBook(activeBookId ?? "");

  const reorderChapters = useReorderChapters();
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("writerstudio-theme");
    if (stored === "dark") return "dark";
    return "light";
  });
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
      {/* Offline banner */}
      {!isOnline && (
        <div
          className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium flex items-center justify-center gap-2"
          data-ocid="layout.offline_banner"
        >
          <WifiOff className="h-4 w-4" />
          Brak połączenia z internetem — zmiany mogą się nie zapisywać. Sprawdź
          swoje połączenie.
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-[240px] flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
            Lista rozdziałów
          </h2>
        </div>
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {activeBookId && chapters && chapters.length > 0 && (
            <div className="space-y-1">
              {chapters.map((chapter, index) => {
                const isActive = activeChapterId === String(chapter.id);
                return (
                  <div
                    key={String(chapter.id)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", String(chapter.id));
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverIndex(index);
                    }}
                    onDragLeave={() => {
                      setDragOverIndex(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const draggedId = e.dataTransfer.getData("text/plain");
                      if (!draggedId || !chapters || !activeBookId) {
                        setDragOverIndex(null);
                        return;
                      }
                      const fromIndex = chapters.findIndex(
                        (c) => String(c.id) === draggedId,
                      );
                      if (
                        fromIndex === -1 ||
                        fromIndex === index ||
                        fromIndex === index - 1
                      ) {
                        setDragOverIndex(null);
                        return;
                      }
                      const newOrder = chapters.map((c) => c.id);
                      const [moved] = newOrder.splice(fromIndex, 1);
                      const insertAt = fromIndex < index ? index - 1 : index;
                      newOrder.splice(insertAt, 0, moved);
                      reorderChapters.mutate({
                        bookId: BigInt(activeBookId),
                        orderedChapterIds: newOrder,
                      });
                      setDragOverIndex(null);
                    }}
                    className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    } ${dragOverIndex === index ? "border-t-2 border-t-primary" : ""}`}
                    data-ocid={`nav.chapter_row.item.${Number(chapter.orderIndex) + 1}`}
                  >
                    <div className="shrink-0 cursor-grab active:cursor-grabbing text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          to: "/books/$bookId/chapters/$chapterId",
                          params: {
                            bookId: activeBookId,
                            chapterId: String(chapter.id),
                          },
                        })
                      }
                      className="flex flex-1 items-center gap-2 min-w-0"
                      data-ocid={`nav.chapter_link.item.${Number(chapter.orderIndex) + 1}`}
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate">{chapter.title}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {(!activeBookId || !chapters || chapters.length === 0) && (
            <>
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
              <button
                type="button"
                onClick={() => navigate({ to: "/admin" })}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                data-ocid="nav.admin_link"
              >
                <Shield className="h-4 w-4" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: "/trash" })}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                data-ocid="nav.trash_link"
              >
                <Trash2 className="h-4 w-4" />
                Kosz
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${!isOnline ? "pt-10" : ""}`}
      >
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
                onClick={() => setSettingsModalOpen(true)}
                aria-label="Ustawienia"
                data-ocid="settings.open_modal_button"
              >
                <Settings className="h-4 w-4" />
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
        <SettingsModal
          open={settingsModalOpen}
          onOpenChange={setSettingsModalOpen}
        />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>

        {/* Floating chatbot — only on book/chapter routes */}
        {isAuthenticated && activeBookId && (
          <ChatBotPanel bookId={activeBookId} book={book ?? undefined} />
        )}
      </div>
    </div>
  );
}
