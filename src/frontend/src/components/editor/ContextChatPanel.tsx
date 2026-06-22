import type { Analysis } from "@/backend";
import type { Chapter, ChatSession, ChatSessionMessage } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useAddChatMessage,
  useChatSessionMessages,
  useChatSessions,
  useCreateChatSession,
  useDeleteChatSession,
} from "@/hooks/useBackend";
import { analyzeWithContext } from "@/lib/aiAnalysis";
import type { Editor } from "@tiptap/react";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ContextChatPanelProps {
  chapterId: bigint;

  apiKey: string;
  provider: "openai" | "claude";
  editor: Editor | null;
  chapters: Chapter[];
  bookAnalyses: Analysis[];
  onClose: () => void;
}

function truncateToWord(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0) {
    return `${truncated.slice(0, lastSpace)}...`;
  }
  return `${truncated}...`;
}

export function ContextChatPanel({
  chapterId,

  apiKey,
  provider,
  editor,
  chapters,
  bookAnalyses,
  onClose,
}: ContextChatPanelProps) {
  const [activeSessionId, setActiveSessionId] = useState<bigint | null>(null);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoStarting, setIsAutoStarting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: sessions = [], isLoading: sessionsLoading } = useChatSessions(
    String(chapterId),
  );
  const { data: messages = [], isLoading: messagesLoading } =
    useChatSessionMessages(activeSessionId ? String(activeSessionId) : "0");
  const createSession = useCreateChatSession();
  const addMessage = useAddChatMessage();
  const deleteSession = useDeleteChatSession();

  // Auto-start new session when panel opens and no sessions exist
  useEffect(() => {
    if (
      sessionsLoading ||
      isAutoStarting ||
      sessions.length > 0 ||
      !editor ||
      !apiKey
    )
      return;

    const autoStart = async () => {
      setIsAutoStarting(true);
      try {
        const currentText = editor.getText();
        if (!currentText.trim()) {
          setIsAutoStarting(false);
          return;
        }

        // Build context from previous chapters
        const currentChapter = chapters.find((c) => c.id === chapterId);
        const prevChapters = currentChapter
          ? chapters.filter(
              (c) =>
                c.orderIndex < currentChapter.orderIndex && c.id !== chapterId,
            )
          : [];
        const prevSummaries = prevChapters.map((c) => {
          const plain = c.content
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          return `${c.title}:\n${plain.slice(0, 500)}`;
        });

        const annotations = await analyzeWithContext(
          currentText,
          prevSummaries,
          apiKey,
          provider,
        );

        // Build a summary from annotations as the first assistant message
        const summaryLines = annotations.map(
          (a) => `- ${a.text}: ${a.explanation}`,
        );
        const analysisText =
          summaryLines.length > 0
            ? `Analiza kontekstowa rozdziału:\n\n${summaryLines.join("\n")}`
            : "Analiza kontekstowa nie wykryła żadnych problemów ze spójnością. Rozdział jest spójny z wcześniejszymi wydarzeniami.";

        const title = truncateToWord(analysisText, 50);

        const sessionId = await createSession.mutateAsync({
          chapterId,
          title,
        });

        await addMessage.mutateAsync({
          sessionId,
          role: "assistant",
          content: analysisText,
        });

        setActiveSessionId(sessionId);
      } catch (err) {
        console.error("Auto-start session failed:", err);
      } finally {
        setIsAutoStarting(false);
      }
    };

    autoStart();
  }, [
    sessionsLoading,
    sessions.length,
    editor,
    apiKey,
    provider,
    chapters,
    chapterId,
    isAutoStarting,
    createSession,
    addMessage,
  ]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteSession = useCallback(
    async (sessionId: bigint) => {
      await deleteSession.mutateAsync({ sessionId, chapterId });
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
      }
    },
    [deleteSession, chapterId, activeSessionId],
  );

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !activeSessionId || isLoading) return;

    const userContent = inputText.trim();
    setInputText("");
    setIsLoading(true);

    try {
      // Save user message
      await addMessage.mutateAsync({
        sessionId: activeSessionId,
        role: "user",
        content: userContent,
      });

      // Get all messages including the new user message
      const allMessages: ChatSessionMessage[] = [
        ...messages,
        {
          id: 0n,
          sessionId: activeSessionId,
          role: "user",
          content: userContent,
          createdAt: BigInt(Date.now()) * 1_000_000n,
        },
      ];

      // Build context
      const currentChapter = chapters.find((c) => c.id === chapterId);
      const prevChapters = currentChapter
        ? chapters.filter(
            (c) =>
              c.orderIndex < currentChapter.orderIndex && c.id !== chapterId,
          )
        : [];
      const prevSummaries = prevChapters.map((c) => {
        const plain = c.content
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return `${c.title}:\n${plain.slice(0, 500)}`;
      });

      const history = allMessages
        .map(
          (m) =>
            `${m.role === "user" ? "Użytkownik" : "Asystent"}: ${m.content}`,
        )
        .join("\n\n");

      const prompt = `Jesteś asystentem pisarskim dla pisarza. Pomagasz w tworzeniu powieści, odpowiadasz na pytania, proponujesz pomysły na fabułę, postacie, dialogi i rozwój wątków.

KONTEKST KSIĄŻKI:
${bookAnalyses.map((a) => a.resultContent).join("\n\n") || "Brak dodatkowego kontekstu."}

STRESZCZENIA WCZEŚNIEJSZYCH ROZDZIAŁÓW:
${prevSummaries.join("\n\n") || "Brak wcześniejszych rozdziałów."}

HISTORIA ROZMOWY:
${history}

Odpowiedz na ostatnie pytanie użytkownika. Bądź konstruktywny, konkretny i inspirujący.`;

      const response = await fetch(
        provider === "openai"
          ? "https://api.openai.com/v1/chat/completions"
          : "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(provider === "openai"
              ? { Authorization: `Bearer ${apiKey}` }
              : {
                  "x-api-key": apiKey,
                  "anthropic-version": "2023-06-01",
                  "anthropic-dangerous-direct-browser-access": "true",
                }),
          },
          body: JSON.stringify(
            provider === "openai"
              ? {
                  model: "gpt-4o-mini",
                  messages: [{ role: "user", content: prompt }],
                  max_tokens: 4000,
                  temperature: 0.7,
                }
              : {
                  model: "claude-sonnet-4-6",
                  max_tokens: 4000,
                  messages: [{ role: "user", content: prompt }],
                  temperature: 0.7,
                },
          ),
        },
      );

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantContent =
        provider === "openai"
          ? (data.choices?.[0]?.message?.content ?? "")
          : (data.content?.find(
              (c: { type?: string; text?: string }) => c.type === "text",
            )?.text ?? "");

      await addMessage.mutateAsync({
        sessionId: activeSessionId,
        role: "assistant",
        content:
          assistantContent ||
          "Przepraszam, nie udało się wygenerować odpowiedzi.",
      });
    } catch (err) {
      console.error("Send message failed:", err);
      // Save error as assistant message
      await addMessage.mutateAsync({
        sessionId: activeSessionId,
        role: "assistant",
        content:
          "Wystąpił błąd podczas generowania odpowiedzi. Sprawdź połączenie z internetem i klucz API.",
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [
    inputText,
    activeSessionId,
    isLoading,
    messages,
    addMessage,
    chapters,
    chapterId,
    bookAnalyses,
    provider,
    apiKey,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  // Session list view
  if (!activeSessionId) {
    return (
      <div className="w-72 border-l border-border bg-card flex flex-col h-full shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Czat kontekstowy</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            data-ocid="context_chat.panel_close_button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Session List */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {isAutoStarting ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Tworzenie sesji analizy...
              </div>
            ) : sessions.length === 0 ? (
              <div
                className="text-center py-8 text-sm text-muted-foreground"
                data-ocid="context_chat.empty_state"
              >
                Brak sesji czatu
              </div>
            ) : (
              sessions.map((session, index) => (
                <button
                  key={String(session.id)}
                  type="button"
                  className="group rounded-md border border-border bg-background p-3 hover:border-primary/40 transition-colors cursor-pointer text-left w-full"
                  onClick={() => setActiveSessionId(session.id)}
                  data-ocid={`context_chat.session_item.${index + 1}`}
                >
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {session.title}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground/60">
                      {new Date(
                        Number(session.createdAt) / 1_000_000,
                      ).toLocaleDateString("pl-PL")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      data-ocid={`context_chat.session_delete_button.${index + 1}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Chat view
  return (
    <div className="w-72 border-l border-border bg-card flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -ml-1"
            onClick={() => setActiveSessionId(null)}
            data-ocid="context_chat.back_button"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold truncate max-w-[140px]">
            {sessions.find((s) => s.id === activeSessionId)?.title || "Sesja"}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
          data-ocid="context_chat.panel_close_button"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-3 space-y-3">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Ładowanie wiadomości...
            </div>
          ) : messages.length === 0 ? (
            <div
              className="text-center py-8 text-sm text-muted-foreground"
              data-ocid="context_chat.messages_empty_state"
            >
              Brak wiadomości
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={String(msg.id)}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  data-ocid={`context_chat.message.${index + 1}`}
                >
                  <div
                    className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    <span
                      className={`text-[10px] mt-1 block ${
                        isUser
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      {new Date(
                        Number(msg.createdAt) / 1_000_000,
                      ).toLocaleTimeString("pl-PL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Napisz odpowiedź..."
            disabled={isLoading}
            className="flex-1 text-sm"
            data-ocid="context_chat.input"
          />
          <Button
            size="icon"
            disabled={!inputText.trim() || isLoading}
            onClick={handleSendMessage}
            data-ocid="context_chat.send_button"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
