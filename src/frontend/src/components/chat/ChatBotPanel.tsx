import type { Book } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  useAnalysesByBook,
  useBook,
  useChapters,
  useChatMessages,
  useClearChat,
  useDeleteMessage,
  useSendMessage,
} from "@/hooks/useBackend";
import { chatWithBook } from "@/lib/aiAnalysis";
import type { ChatMessage as AiChatMessage } from "@/lib/aiAnalysis";
import { getApiKey } from "@/lib/apiKeyStorage";
import { useAppStore } from "@/store/useAppStore";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, MessageCircle, Send, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ChatBotPanelProps {
  bookId: string;
  book?: Book;
}

interface ArchiveEntry {
  timestamp: number;
  title: string;
  messages: Array<{ role: string; content: string; createdAt: number }>;
}

function getArchiveKey(bookId: string) {
  return `ws_chat_archives_${bookId}`;
}

function loadArchives(bookId: string): ArchiveEntry[] {
  try {
    const raw = localStorage.getItem(getArchiveKey(bookId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore
  }
  return [];
}

function saveArchives(bookId: string, archives: ArchiveEntry[]) {
  localStorage.setItem(getArchiveKey(bookId), JSON.stringify(archives));
}

export function ChatBotPanel({ bookId, book: bookProp }: ChatBotPanelProps) {
  const principal = useAppStore((s) => s.principal);
  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem("writerstudio-chat-open");
    return stored === "true";
  });

  useEffect(() => {
    localStorage.setItem("writerstudio-chat-open", String(isOpen));
  }, [isOpen]);

  const { data: fetchedBook } = useBook(bookId);
  const book = bookProp ?? fetchedBook ?? null;
  const { data: chapters } = useChapters(bookId);
  const { data: analyses } = useAnalysesByBook(bookId);
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const clearChat = useClearChat();

  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<
    Array<{ id: string; role: string; content: string; createdAt: bigint }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages, isLoading } = useChatMessages(bookId);

  // View state: 'chat' | 'history' | 'archive'
  const [view, setView] = useState<"chat" | "history" | "archive">("chat");
  const [selectedArchive, setSelectedArchive] = useState<ArchiveEntry | null>(
    null,
  );

  // Panel position and size
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState(() => {
    const storedW = localStorage.getItem("ws_chatbot_width");
    const storedH = localStorage.getItem("ws_chatbot_height");
    return {
      w: storedW ? Number.parseInt(storedW, 10) : 380,
      h: storedH ? Number.parseInt(storedH, 10) : 520,
    };
  });
  const panelRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    startPx: number;
    startPy: number;
  }>({
    dragging: false,
    startX: 0,
    startY: 0,
    startPx: 0,
    startPy: 0,
  });
  const resizeState = useRef<{
    resizing: boolean;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  }>({
    resizing: false,
    startX: 0,
    startY: 0,
    startW: 380,
    startH: 520,
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const messageCountRef = useRef(0);

  const currentMessages = useMemo(() => {
    const backendMsgs = messages ?? [];
    const optimisticOnly = optimisticMessages.filter(
      (opt) =>
        !backendMsgs.some(
          (m) => m.content === opt.content && m.role === opt.role,
        ),
    );
    return [...backendMsgs, ...optimisticOnly].sort((a, b) =>
      Number(a.createdAt - b.createdAt),
    );
  }, [messages, optimisticMessages]);

  useEffect(() => {
    messageCountRef.current = currentMessages.length;
  }, [currentMessages.length]);

  useEffect(() => {
    const currentLength = currentMessages.length;
    if (isOpen && view === "chat") {
      scrollToBottom();
    }
    messageCountRef.current = currentLength;
  }, [isOpen, view, scrollToBottom, currentMessages.length]);

  // Drag handlers
  const onDragMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-chat-action]")) return;
      dragState.current = {
        dragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startPx: pos.x,
        startPy: pos.y,
      };
      e.preventDefault();
    },
    [pos.x, pos.y],
  );

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      resizeState.current = {
        resizing: true,
        startX: e.clientX,
        startY: e.clientY,
        startW: size.w,
        startH: size.h,
      };
      e.preventDefault();
      e.stopPropagation();
    },
    [size.w, size.h],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragState.current.dragging) {
        const dx = e.clientX - dragState.current.startX;
        const dy = e.clientY - dragState.current.startY;
        setPos({
          x: dragState.current.startPx + dx,
          y: dragState.current.startPy + dy,
        });
      }
      if (resizeState.current.resizing) {
        const dx = resizeState.current.startX - e.clientX;
        const dy = resizeState.current.startY - e.clientY;
        setSize({
          w: Math.max(
            280,
            Math.min(
              Math.round(window.innerWidth * 0.9),
              resizeState.current.startW + dx,
            ),
          ),
          h: Math.max(
            350,
            Math.min(
              Math.round(window.innerHeight * 0.9),
              resizeState.current.startH + dy,
            ),
          ),
        });
      }
    };
    const onMouseUp = () => {
      dragState.current.dragging = false;
      if (resizeState.current.resizing) {
        resizeState.current.resizing = false;
        setSize((current) => {
          localStorage.setItem("ws_chatbot_width", String(current.w));
          localStorage.setItem("ws_chatbot_height", String(current.h));
          return current;
        });
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  function formatArchiveDate(ts: number): string {
    return new Date(ts).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const handleArchive = useCallback(() => {
    if (currentMessages.length === 0) return;
    setOptimisticMessages([]);
    const firstSentence = currentMessages[0]?.content ?? "";
    const title =
      firstSentence.length > 50
        ? `${firstSentence.slice(0, 50)}…`
        : firstSentence || "Archiwum";
    const archive: ArchiveEntry = {
      timestamp: Date.now(),
      title,
      messages: currentMessages.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: Number(m.createdAt / 1000000n),
      })),
    };
    const archives = loadArchives(bookId);
    archives.unshift(archive);
    saveArchives(bookId, archives);
    clearChat.mutate({ bookId: BigInt(bookId) });
    setView("chat");
  }, [currentMessages, bookId, clearChat]);

  const handleDeleteArchive = useCallback(
    (timestamp: number) => {
      const archives = loadArchives(bookId).filter(
        (a) => a.timestamp !== timestamp,
      );
      saveArchives(bookId, archives);
      if (selectedArchive?.timestamp === timestamp) {
        setSelectedArchive(null);
        setView("history");
      }
      // Force re-render by toggling a dummy state — we read from localStorage each time
      setInput((v) => v);
    },
    [bookId, selectedArchive],
  );

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending || !book) return;

    const provider =
      (localStorage.getItem("ws_api_provider") as "openai" | "claude") ||
      "openai";
    const apiKey = getApiKey(provider, principal);
    if (!apiKey.trim()) {
      setInput("");
      return;
    }

    setIsSending(true);
    setInput("");

    const userOptId = `opt-user-${Date.now()}`;
    const assistantOptId = `opt-assistant-${Date.now()}`;
    const now = BigInt(Date.now()) * 1000000n;

    setOptimisticMessages((prev) => [
      ...prev,
      { id: userOptId, role: "user", content: trimmed, createdAt: now },
      {
        id: assistantOptId,
        role: "assistant",
        content: "…",
        createdAt: now + 1n,
      },
    ]);

    try {
      // Save user message in background (fire-and-forget)
      sendMessage.mutate({
        bookId: BigInt(bookId),
        role: "user",
        content: trimmed,
        provider: "",
      });

      const bookContextParts: string[] = [];
      if (book.title) bookContextParts.push(`Tytuł: ${book.title}`);
      if (book.ageCategory)
        bookContextParts.push(`Kategoria wiekowa: ${book.ageCategory}`);
      if (book.authorSummary)
        bookContextParts.push(`Streszczenie autorskie: ${book.authorSummary}`);
      if (book.keyContext)
        bookContextParts.push(`Kluczowe informacje: ${book.keyContext}`);
      if (book.themes) bookContextParts.push(`Motywy: ${book.themes}`);
      if ((book as unknown as Record<string, string>).writingStyle) {
        bookContextParts.push(
          `Styl pisarski: ${(book as unknown as Record<string, string>).writingStyle}`,
        );
      }
      if (book.characters)
        bookContextParts.push(`Postacie: ${book.characters}`);
      const bookContextBlock =
        bookContextParts.length > 0
          ? `DANE KSIĄŻKI:\n${bookContextParts.join("\n")}`
          : "";

      const chapterTitles = (chapters ?? [])
        .sort((a, b) => Number(a.orderIndex - b.orderIndex))
        .map((ch) => `- ${ch.title}`)
        .join("\n");
      const bookContext = `${bookContextBlock}\n\nTytuł książki: ${book.title}\nKategoria: ${book.category}\nOpis: ${book.description}\n\nRozdziały:\n${chapterTitles}`;

      const currentSessionMessages: AiChatMessage[] = currentMessages.map(
        (m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        }),
      );
      currentSessionMessages.push({ role: "user", content: trimmed });

      const chapterSummaries = (analyses ?? [])
        .filter((a) => a.analysisType === "summary")
        .sort((a, b) => Number(a.createdAt - b.createdAt))
        .map((a) => a.resultContent);

      const reply = await chatWithBook(
        currentSessionMessages,
        bookContext,
        apiKey.trim(),
        provider,
        chapterSummaries.length > 0 ? chapterSummaries : undefined,
      );

      // Update optimistic placeholder with real reply
      setOptimisticMessages((prev) =>
        prev.map((m) =>
          m.id === assistantOptId ? { ...m, content: reply } : m,
        ),
      );

      // Save assistant message in background (fire-and-forget)
      sendMessage.mutate({
        bookId: BigInt(bookId),
        role: "assistant",
        content: reply,
        provider,
      });
    } catch {
      // Silent fail — user can retry; placeholder stays visible
    } finally {
      setIsSending(false);
      // Refresh from backend and clear optimistic messages after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["chat", BigInt(bookId)],
        });
        setOptimisticMessages([]);
      }, 500);
    }
  }, [
    input,
    isSending,
    book,
    bookId,
    chapters,
    currentMessages,
    analyses,
    sendMessage,
    queryClient,
    principal,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Otwórz czat"
        data-ocid="chat.open_button"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  const archives = loadArchives(bookId);

  return (
    <div
      ref={panelRef}
      className="fixed z-50 flex flex-col rounded-xl border border-border bg-card shadow-elevated overflow-hidden"
      style={{
        right: 24 + pos.x,
        bottom: 24 - pos.y,
        width: size.w,
        height: size.h,
        resize: "both",
        overflow: "auto",
        minWidth: 280,
        minHeight: 350,
        maxWidth: "90vw",
        maxHeight: "90vh",
      }}
      data-ocid="chat.panel"
    >
      {/* Header — draggable */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 cursor-move select-none"
        onMouseDown={onDragMouseDown}
        data-ocid="chat.header"
      >
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground truncate">
            Asystent AI
          </span>
          {book && (
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {book.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${view === "history" || view === "archive" ? "text-primary" : "text-muted-foreground"} hover:text-foreground`}
            onClick={() => {
              if (view === "history" || view === "archive") {
                setView("chat");
                setSelectedArchive(null);
              } else {
                setView("history");
              }
            }}
            title="Historia"
            data-chat-action
            data-ocid="chat.history_button"
          >
            <Clock className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={handleArchive}
            title="Archiwizuj"
            data-chat-action
            data-ocid="chat.archive_button"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(false)}
            title="Zamknij"
            data-chat-action
            data-ocid="chat.close_button"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {view === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {isLoading && (
              <div
                className="text-xs text-muted-foreground text-center py-4"
                data-ocid="chat.loading_state"
              >
                Ładowanie historii...
              </div>
            )}
            {!isLoading && currentMessages.length === 0 && (
              <div
                className="text-xs text-muted-foreground text-center py-8"
                data-ocid="chat.empty_state"
              >
                Zacznij rozmowę z asystentem AI.
                <br />
                Możesz pytać o fabułę, postacie, dialogi i styl.
              </div>
            )}
            {currentMessages.map((msg, idx) => (
              <ChatMessageItem
                key={`${msg.id}-${idx}`}
                msg={msg}
                index={idx}
                isOptimistic={
                  typeof msg.id === "string" &&
                  String(msg.id).startsWith("opt-")
                }
                onDelete={() => {
                  if (
                    typeof msg.id === "string" &&
                    String(msg.id).startsWith("opt-")
                  ) {
                    return;
                  }
                  deleteMessage.mutate({ id: msg.id as bigint });
                }}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 bg-card">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Napisz wiadomość... (Enter wyślij, Shift+Enter nowa linia)"
                className="flex-1 min-h-[96px] max-h-[200px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={4}
                data-ocid="chat.input"
              />
              <Button
                size="sm"
                disabled={!input.trim() || isSending}
                onClick={handleSend}
                className="h-9 w-9 p-0 shrink-0"
                data-ocid="chat.send_button"
              >
                {isSending ? (
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      {view === "history" && (
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {archives.length === 0 && (
            <div
              className="text-xs text-muted-foreground text-center py-8"
              data-ocid="chat.history.empty_state"
            >
              Brak archiwów.
              <br />
              Kliknij ikonę kosza, aby zarchiwizować bieżącą rozmowę.
            </div>
          )}
          <div className="space-y-2">
            {archives.map((archive, idx) => (
              <div
                key={archive.timestamp}
                className="group flex items-center gap-2 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
                data-ocid={`chat.archive.item.${idx + 1}`}
              >
                <button
                  type="button"
                  className="flex-1 min-w-0 text-left cursor-pointer"
                  onClick={() => {
                    setSelectedArchive(archive);
                    setView("archive");
                  }}
                  data-ocid={`chat.archive.open_button.${idx + 1}`}
                >
                  <div className="text-sm font-medium text-foreground truncate">
                    {archive.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatArchiveDate(archive.timestamp)}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleDeleteArchive(archive.timestamp)}
                  title="Usuń archiwum"
                  data-chat-action
                  data-ocid={`chat.archive.delete_button.${idx + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "archive" && selectedArchive && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            <div className="text-xs text-muted-foreground mb-2">
              {formatArchiveDate(selectedArchive.timestamp)}
            </div>
            {selectedArchive.messages.map((msg, idx) => (
              <div
                key={`archive-msg-${msg.createdAt}`}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                data-ocid={`chat.archive.message.${idx + 1}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-3 bg-card">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setSelectedArchive(null);
                setView("history");
              }}
              data-ocid="chat.archive.back_button"
            >
              Wróć do historii
            </Button>
          </div>
        </>
      )}

      {/* Resize handle — top-left */}
      <div
        className="absolute left-0 top-0 cursor-nw-resize z-10"
        style={{ width: 16, height: 16 }}
        onMouseDown={onResizeMouseDown}
        data-ocid="chat.resize_handle"
      >
        <svg
          role="img"
          aria-label="Resize handle"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className="absolute top-1 left-1 text-muted-foreground/40"
        >
          <path
            d="M4 0L0 4V0H4ZM8 0L0 8V4L4 0H8ZM12 0L0 12V8L8 0H12Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}

function ChatMessageItem({
  msg,
  index,
  isOptimistic,
  onDelete,
}: {
  msg: {
    id: bigint | string;
    role: string;
    content: string;
    createdAt: bigint;
  };
  index: number;
  isOptimistic?: boolean;
  onDelete: () => void;
}) {
  const isUser = msg.role === "user";
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else {
      setConfirmDelete(true);
      timeoutRef.current = setTimeout(() => setConfirmDelete(false), 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className={`group flex ${isUser ? "justify-end" : "justify-start"}`}
      data-ocid={`chat.message.${index + 1}`}
    >
      <div
        className={`relative max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-muted text-foreground rounded-bl-none"
        }`}
      >
        <div
          className={`whitespace-pre-wrap break-words ${isOptimistic ? "opacity-70" : ""}`}
        >
          {msg.content}
        </div>
        {!isOptimistic && (
          <button
            type="button"
            onClick={handleDeleteClick}
            className={`absolute -top-2 ${isUser ? "-left-2" : "-right-2"} h-5 w-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
              confirmDelete
                ? "bg-destructive text-destructive-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-destructive"
            }`}
            title={
              confirmDelete ? "Kliknij ponownie, aby usunąć" : "Usuń wiadomość"
            }
            data-ocid={`chat.delete_button.${index + 1}`}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
