import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBook,
  useChapter,
  useSaveAnalysis,
  useSaveAnnotations,
  useUpdateChapter,
  useUpdateChapterIndents,
} from "@/hooks/useBackend";
import type { Annotation } from "@/lib/aiAnalysis";
import { analyzeGrammarStyle } from "@/lib/aiAnalysis";
import { useNavigate, useParams } from "@tanstack/react-router";
import type { Editor } from "@tiptap/core";
import { ArrowLeft, Check, Save, Sparkles, Wand2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type SaveStatus = "saved" | "saving" | "unsaved";
type AnalysisStatus = "idle" | "loading" | "success" | "error";

function SaveIndicator({ status }: { status: SaveStatus }) {
  const labels: Record<SaveStatus, string> = {
    saved: "Zapisano",
    saving: "Zapisywanie...",
    unsaved: "Niezapisane zmiany",
  };

  const dotColors: Record<SaveStatus, string> = {
    saved: "bg-success",
    saving: "bg-warning animate-pulse",
    unsaved: "bg-destructive",
  };

  return (
    <div
      className="flex items-center gap-2 text-xs text-muted-foreground"
      data-ocid="editor.save_indicator"
    >
      <span className={`h-2 w-2 rounded-full ${dotColors[status]}`} />
      <span>{labels[status]}</span>
    </div>
  );
}

function IndentControl({
  label,
  value,
  onChange,
  dataOcid,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  dataOcid: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="text-xs text-muted-foreground w-24 shrink-0">
        {label}
      </Label>
      <Input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="h-8 w-20 text-sm"
        data-ocid={dataOcid}
      />
      <span className="text-xs text-muted-foreground">px</span>
    </div>
  );
}

function applyAnnotationsToEditor(editor: Editor, annotations: Annotation[]) {
  const docText = editor.getText();

  for (const ann of annotations) {
    const idx = docText.indexOf(ann.text);
    if (idx === -1) continue;

    const from = editor.state.doc.resolve(idx);
    const to = editor.state.doc.resolve(idx + ann.text.length);

    editor
      .chain()
      .focus()
      .setTextSelection({ from: from.pos, to: to.pos })
      .setMark(
        `annotation${ann.color.charAt(0).toUpperCase() + ann.color.slice(1)}`,
        {
          "data-explanation": ann.explanation,
          "data-proposal": ann.proposal,
        },
      )
      .run();
  }
}

export function ChapterEditorPage() {
  const { bookId, chapterId } = useParams({
    from: "/layout/books/$bookId/chapters/$chapterId",
  });
  const navigate = useNavigate();

  const { data: book, isLoading: bookLoading } = useBook(bookId);
  const { data: chapter, isLoading: chapterLoading } = useChapter(chapterId);

  const updateChapter = useUpdateChapter();
  const saveAnalysis = useSaveAnalysis();
  const saveAnnotations = useSaveAnnotations();
  const updateIndents = useUpdateChapterIndents();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const [indentLeft, setIndentLeft] = useState(0);
  const [indentRight, setIndentRight] = useState(0);
  const [indentFirstLine, setIndentFirstLine] = useState(0);

  // AI analysis state
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("ws_api_key") ?? "",
  );
  const [_apiKeyFocused, setApiKeyFocused] = useState(false);
  const [provider, setProvider] = useState<"openai" | "claude">(() => {
    const saved = localStorage.getItem("ws_api_provider");
    return saved === "claude" ? "claude" : "openai";
  });
  const editorRef = useRef<Editor | null>(null);

  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist API key / provider to localStorage
  useEffect(() => {
    localStorage.setItem("ws_api_key", apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem("ws_api_provider", provider);
  }, [provider]);

  // Sync from query data
  useEffect(() => {
    if (chapter) {
      setTitle(chapter.title);
      setContent(chapter.content);
      setIndentLeft(Number(chapter.indentLeft));
      setIndentRight(Number(chapter.indentRight));
      setIndentFirstLine(Number(chapter.indentFirstLine));
      setSaveStatus("saved");
    }
  }, [chapter]);

  const doSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (!chapter) return;
      setSaveStatus("saving");
      updateChapter.mutate(
        {
          id: chapter.id,
          title: newTitle,
          content: newContent,
        },
        {
          onSuccess: () => setSaveStatus("saved"),
          onError: () => setSaveStatus("unsaved"),
        },
      );
    },
    [chapter, updateChapter],
  );

  const handleTitleChange = useCallback(
    (val: string) => {
      setTitle(val);
      setSaveStatus("unsaved");
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = setTimeout(() => {
        doSave(val, content);
      }, 3000);
    },
    [content, doSave],
  );

  const handleContentChange = useCallback(
    (val: string) => {
      setContent(val);
      setSaveStatus("unsaved");
      if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current);
      contentDebounceRef.current = setTimeout(() => {
        doSave(title, val);
      }, 3000);
    },
    [title, doSave],
  );

  const doSaveIndents = useCallback(
    (left: number, right: number, first: number) => {
      if (!chapter) return;
      updateIndents.mutate({
        id: chapter.id,
        indentLeft: BigInt(left),
        indentRight: BigInt(right),
        indentFirstLine: BigInt(first),
      });
    },
    [chapter, updateIndents],
  );

  const handleIndentChange = useCallback(
    (
      setter: React.Dispatch<React.SetStateAction<number>>,
      val: number,
      currentLeft: number,
      currentRight: number,
      currentFirst: number,
    ) => {
      setter(val);
      if (indentDebounceRef.current) clearTimeout(indentDebounceRef.current);
      indentDebounceRef.current = setTimeout(() => {
        doSaveIndents(currentLeft, currentRight, currentFirst);
      }, 800);
    },
    [doSaveIndents],
  );

  const isLoading = bookLoading || chapterLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (!chapter || !book) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Nie znaleziono rozdziału
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Rozdział lub książka nie istnieje.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/dashboard" })}
          data-ocid="chapter.back_button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Wróć do dashboardu
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Top bar: back + book title + save indicator */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() =>
              navigate({
                to: "/books/$bookId",
                params: { bookId },
              })
            }
            data-ocid="chapter.back_button"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {book.title}
          </Button>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Title input */}
      <div className="shrink-0">
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Tytuł rozdziału"
          className="text-xl font-display font-semibold border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
          data-ocid="chapter.title_input"
        />
      </div>

      {/* Analysis + Indent controls */}
      <div
        className="shrink-0 flex flex-wrap items-center gap-4 p-3 rounded-lg border border-border bg-card"
        data-ocid="chapter.tools_panel"
      >
        {/* Analysis section */}
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
            AI
          </div>
          <Input
            type="password"
            placeholder="Klucz API"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onFocus={() => setApiKeyFocused(true)}
            onBlur={() => setApiKeyFocused(false)}
            className="h-8 text-sm flex-1 min-w-[120px]"
            data-ocid="chapter.api_key_input"
          />
          <Select
            value={provider}
            onValueChange={(v) => setProvider(v as "openai" | "claude")}
          >
            <SelectTrigger
              className="h-8 w-[110px] text-sm"
              data-ocid="chapter.provider_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="claude">Claude</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="secondary"
            disabled={analysisStatus === "loading" || !apiKey.trim()}
            onClick={async () => {
              if (!editorRef.current || !chapter || !book) return;
              const text = editorRef.current.getText();
              if (!text.trim()) {
                setAnalysisError("Brak tekstu do analizy");
                setAnalysisStatus("error");
                return;
              }
              setAnalysisStatus("loading");
              setAnalysisError(null);
              try {
                const annotations = await analyzeGrammarStyle(
                  text,
                  apiKey.trim(),
                  provider,
                );
                applyAnnotationsToEditor(editorRef.current, annotations);
                // Save analysis + annotations to backend
                const analysisId = await saveAnalysis.mutateAsync({
                  bookId: book.id,
                  chapterId: chapter.id,
                  analysisType: "grammar_style",
                  provider,
                  resultContent: JSON.stringify(annotations),
                });
                await saveAnnotations.mutateAsync({
                  analysisId,
                  annotations,
                });
                setAnalysisStatus("success");
                setTimeout(() => setAnalysisStatus("idle"), 3000);
              } catch (err) {
                setAnalysisError(
                  err instanceof Error ? err.message : "Błąd analizy",
                );
                setAnalysisStatus("error");
              }
            }}
            data-ocid="chapter.analyze_button"
          >
            {analysisStatus === "loading" ? (
              <>
                <Wand2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Analizowanie...
              </>
            ) : analysisStatus === "success" ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Gotowe
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Sprawdź gramatykę i styl
              </>
            )}
          </Button>
        </div>

        <div className="w-px h-6 bg-border hidden sm:block" />

        {/* Indent section */}
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
          <Save className="h-3.5 w-3.5" />
          Wcięcia
        </div>
        <IndentControl
          label="Lewe"
          value={indentLeft}
          onChange={(val) =>
            handleIndentChange(
              setIndentLeft,
              val,
              val,
              indentRight,
              indentFirstLine,
            )
          }
          dataOcid="chapter.indent_left_input"
        />
        <IndentControl
          label="Prawe"
          value={indentRight}
          onChange={(val) =>
            handleIndentChange(
              setIndentRight,
              val,
              indentLeft,
              val,
              indentFirstLine,
            )
          }
          dataOcid="chapter.indent_right_input"
        />
        <IndentControl
          label="Pierwsza linia"
          value={indentFirstLine}
          onChange={(val) =>
            handleIndentChange(
              setIndentFirstLine,
              val,
              indentLeft,
              indentRight,
              val,
            )
          }
          dataOcid="chapter.indent_first_line_input"
        />
      </div>

      {analysisStatus === "error" && analysisError && (
        <div
          className="shrink-0 text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2"
          data-ocid="chapter.analysis_error"
        >
          {analysisError}
        </div>
      )}

      {/* Rich text editor with indent-aware padding */}
      <div
        className="flex-1 min-h-0"
        style={{
          paddingLeft: `${indentLeft}px`,
          paddingRight: `${indentRight}px`,
        }}
        data-ocid="chapter.editor_wrapper"
      >
        <RichTextEditor
          value={content}
          onChange={handleContentChange}
          placeholder="Zacznij pisać..."
          onEditorReady={(editor) => {
            editorRef.current = editor;
          }}
        />
      </div>
    </div>
  );
}
