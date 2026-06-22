import { Button } from "@/components/ui/button";
import {
  useBook,
  useChapters,
  useChatMessages,
  useClearChat,
  useDeleteMessage,
  useSendMessage,
} from "@/hooks/useBackend";
import { chatWithBook } from "@/lib/aiAnalysis";
import type { ChatMessage as AiChatMessage } from "@/lib/aiAnalysis";
import { useParams } from "@tanstack/react-router";
import { MessageCircle, Send, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ChatBotPanelProps {
  bookId: string;
}

export function ChatBotPanel({ bookId }: ChatBotPanelProps) {
  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem("writerstudio-chat-open");
    return stored === "true";
  });

  useEffect(() => {
    localStorage.setItem("writerstudio-chat-open", String(isOpen));
  }, [isOpen]);

  const { data: book } = useBook(bookId);
  const { data: chapters } = useChapters(bookId);
  const { data: messages, isLoading } = useChatMessages(bookId);
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const clearChat = useClearChat();

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Panel position and size
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 380, h: 520 });
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

  const messageCountRef = useRef(messages?.length ?? 0);

  useEffect(() => {
    const currentLength = messages?.length ?? 0;
    if (isOpen && currentLength > messageCountRef.current) {
      scrollToBottom();
    }
    messageCountRef.current = currentLength;
  }, [isOpen, scrollToBottom, messages?.length]);

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
        const dx = e.clientX - resizeState.current.startX;
        const dy = e.clientY - resizeState.current.startY;
        setSize({
          w: Math.max(280, resizeState.current.startW + dx),
          h: Math.max(320, resizeState.current.startH + dy),
        });
      }
    };
    const onMouseUp = () => {
      dragState.current.dragging = false;
      resizeState.current.resizing = false;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending || !book) return;

    const apiKey =
      (localStorage.getItem("ws_api_provider") === "claude"
        ? localStorage.getItem("ws_api_key_claude")
        : localStorage.getItem("ws_api_key_openai")) ?? "";
    const provider =
      (localStorage.getItem("ws_api_provider") as "openai" | "claude") ||
      "openai";
    if (!apiKey.trim()) {
      setInput("");
      return;
    }

    setIsSending(true);
    setInput("");

    try {
      // Save user message
      await sendMessage.mutateAsync({
        bookId: BigInt(bookId),
        role: "user",
        content: trimmed,
        provider: "",
      });

      // Build context
      const chapterTitles = (chapters ?? [])
        .sort((a, b) => Number(a.orderIndex - b.orderIndex))
        .map((ch) => `- ${ch.title}`)
        .join("\n");
      const bookContext = `Tytuł książki: ${book.title}\nKategoria: ${book.category}\nOpis: ${book.description}\n\nRozdziały:\n${chapterTitles}`;

      // Build message history for AI
      const currentMessages: AiChatMessage[] = (messages ?? []).map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));
      currentMessages.push({ role: "user", content: trimmed });

      // Call AI
      const reply = await chatWithBook(
        currentMessages,
        bookContext,
        apiKey.trim(),
        provider,
      );

      // Save assistant message
      await sendMessage.mutateAsync({
        bookId: BigInt(bookId),
        role: "assistant",
        content: reply,
        provider,
      });
    } catch {
      // Silent fail — user can retry
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, book, bookId, chapters, messages, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    if (window.confirm("Czy na pewno chcesz wyczyścić całą historię czatu?")) {
      clearChat.mutate({ bookId: BigInt(bookId) });
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

  return (
    <div
      ref={panelRef}
      className="fixed z-50 flex flex-col rounded-xl border border-border bg-card shadow-elevated overflow-hidden"
      style={{
        right: 24 + pos.x,
        bottom: 24 - pos.y,
        width: size.w,
        height: size.h,
      }}
      data-ocid="chat.panel"
    >
      {/* Header — draggable */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 cursor-move select-none"
        onMouseDown={onDragMouseDown}
        data-ocid="chat.header"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Asystent AI
          </span>
          {book && (
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {book.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={handleClear}
            title="Wyczyść historię"
            data-chat-action
            data-ocid="chat.clear_button"
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {isLoading && (
          <div
            className="text-xs text-muted-foreground text-center py-4"
            data-ocid="chat.loading_state"
          >
            Ładowanie historii...
          </div>
        )}
        {!isLoading && (!messages || messages.length === 0) && (
          <div
            className="text-xs text-muted-foreground text-center py-8"
            data-ocid="chat.empty_state"
          >
            Zacznij rozmowę z asystentem AI.
            <br />
            Możesz pytać o fabułę, postacie, dialogi i styl.
          </div>
        )}
        {messages?.map((msg, idx) => (
          <ChatMessageItem
            key={`${msg.id}-${idx}`}
            msg={msg}
            onDelete={() => deleteMessage.mutate({ id: msg.id })}
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
            className="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            rows={1}
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

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={onResizeMouseDown}
        data-ocid="chat.resize_handle"
      >
        <svg
          role="img"
          aria-label="Resize handle"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className="absolute bottom-1 right-1 text-muted-foreground/40"
        >
          <path
            d="M8 12L12 8V12H8ZM4 12L12 4V8L8 12H4ZM0 12L12 0V4L4 12H0Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}

function ChatMessageItem({
  msg,
  onDelete,
}: {
  msg: { id: bigint; role: string; content: string; createdAt: bigint };
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
      data-ocid={`chat.message.${msg.id}`}
    >
      <div
        className={`relative max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-muted text-foreground rounded-bl-none"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
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
          data-ocid={`chat.delete_button.${msg.id}`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
