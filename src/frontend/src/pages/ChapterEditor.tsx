import { AnalysisHistoryPanel } from "@/components/editor/AnalysisHistoryPanel";
import { CommentDialog } from "@/components/editor/CommentDialog";
import { CommentsPanel } from "@/components/editor/CommentsPanel";
import { LektorPanel } from "@/components/editor/LektorPanel";
import { RecordingsPanel } from "@/components/editor/RecordingsPanel";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SynonymPopup } from "@/components/editor/SynonymPopup";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useAnalysesByBook,
  useAnnotationsByAnalysis,
  useBook,
  useChapter,
  useChapters,
  useComments,
  useCreateComment,
  useDeleteComment,
  useRecordings,
  useSaveAnalysis,
  useSaveAnnotations,
  useUpdateAnnotationApproved,
  useUpdateChapter,
} from "@/hooks/useBackend";
import {
  analyzeDialogue,
  analyzeGrammarStyle,
  analyzeWithContext,
  generateSummary,
  getSynonyms,
} from "@/lib/aiAnalysis";
import type { Annotation } from "@/lib/aiAnalysis";
import { exportToDOCX, exportToPDF } from "@/lib/exportChapter";
import { useNavigate, useParams } from "@tanstack/react-router";
import type { Editor } from "@tiptap/core";
import {
  AlignLeft,
  ArrowLeft,
  BookOpen,
  BookText,
  Check,
  Download,
  Eye,
  EyeOff,
  FileText,
  Headphones,
  History,
  MessageCircle,
  MessageSquare,
  Save,
  Sparkles,
  Volume2,
  Wand2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  IndentRuler,
  getGlobalIndents,
} from "../components/editor/IndentRuler";

type SaveStatus = "saved" | "saving" | "unsaved";
type AnalysisStatus = "idle" | "loading" | "success" | "error";
type AnalysisMode = "grammar" | "context" | "dialogue" | "summary";
type SummaryType = "short" | "long" | "hooks";

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

function findFirstTextRangeInDoc(
  editor: Editor,
  searchText: string,
): { from: number; to: number } | null {
  let result: { from: number; to: number } | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (result) return false;
    if (!node.isText || !node.text) return true;
    const idx = node.text.indexOf(searchText);
    if (idx !== -1) {
      result = { from: pos + idx, to: pos + idx + searchText.length };
      return false;
    }
    return true;
  });
  return result;
}

function applyAnnotationsToEditor(
  editor: Editor,
  annotations: Annotation[],
  options?: {
    skipApproved?: boolean;
    clearRange?: { from: number; to: number };
  },
) {
  // 1. Remove annotation marks — either in a specific range or entire document
  // Build a single atomic transaction for all mark removals
  const annotationMarkNames = [
    "annotationYellow",
    "annotationRed",
    "annotationBlue",
    "annotationOrange",
    "annotationPurple",
  ];

  const tr = editor.state.tr;

  if (options?.clearRange) {
    const { from: clearFrom, to: clearTo } = options.clearRange;
    editor.state.doc.nodesBetween(clearFrom, clearTo, (node, pos) => {
      if (!node.isText) return false;
      const nodeStart = pos;
      const nodeEnd = pos + node.nodeSize;
      const overlapStart = Math.max(nodeStart, clearFrom);
      const overlapEnd = Math.min(nodeEnd, clearTo);
      if (overlapStart < overlapEnd) {
        for (const markName of annotationMarkNames) {
          const mark = node.marks.find((m) => m.type.name === markName);
          if (mark) {
            tr.removeMark(
              overlapStart,
              overlapEnd,
              editor.schema.marks[markName],
            );
          }
        }
      }
      return false;
    });
  } else {
    editor.state.doc.descendants((node, pos) => {
      if (!node.isText) return false;
      for (const markName of annotationMarkNames) {
        const mark = node.marks.find((m) => m.type.name === markName);
        if (mark) {
          tr.removeMark(
            pos,
            pos + node.nodeSize,
            editor.schema.marks[markName],
          );
        }
      }
      return false;
    });
  }

  // Apply the clearing transaction once
  if (tr.steps.length > 0) {
    editor.view.dispatch(tr);
  }

  // 2. Compute ranges and resolve overlaps within this batch
  const rangedAnnotations = annotations
    .map((ann) => {
      if (options?.skipApproved && ann.approved) return null;
      const range = findFirstTextRangeInDoc(editor, ann.text);
      if (!range) return null;
      return {
        ann,
        start: range.from,
        end: range.to,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Sort by start ascending
  rangedAnnotations.sort((a, b) => a.start - b.start);

  // Build accepted list: skip any annotation that overlaps with the last accepted one
  const accepted: typeof rangedAnnotations = [];
  for (const item of rangedAnnotations) {
    if (accepted.length === 0) {
      accepted.push(item);
      continue;
    }
    const last = accepted[accepted.length - 1];
    if (item.start < last.end) {
      // Overlaps with last accepted range — skip this annotation entirely
      continue;
    }
    accepted.push(item);
  }

  // 3. Apply marks only for accepted (non-overlapping) annotations
  // Build a single atomic transaction for all mark additions
  const markTr = editor.state.tr;
  for (const { ann, start, end } of accepted) {
    const markName = `annotation${ann.color.charAt(0).toUpperCase() + ann.color.slice(1)}`;
    const markType = editor.schema.marks[markName];
    if (markType) {
      markTr.addMark(
        start,
        end,
        markType.create({
          "data-explanation": ann.explanation,
          "data-proposal": ann.proposal,
          "data-annotation-id": String(ann.id),
          "data-approved": String(ann.approved),
          "data-original-text": ann.text,
        }),
      );
    }
  }
  if (markTr.steps.length > 0) {
    editor.view.dispatch(markTr);
  }
}

export function ChapterEditorPage() {
  const { bookId, chapterId } = useParams({
    from: "/layout/books/$bookId/chapters/$chapterId",
  });
  const navigate = useNavigate();

  const { data: book, isLoading: bookLoading } = useBook(bookId);
  const { data: chapter, isLoading: chapterLoading } = useChapter(chapterId);
  const { data: chapters } = useChapters(bookId);
  const { data: bookAnalyses } = useAnalysesByBook(bookId);
  const { data: comments } = useComments(chapterId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  // Load persisted annotations for the latest analysis of this chapter
  const latestAnalysisId =
    bookAnalyses
      ?.filter((a) => a.chapterId === BigInt(chapterId))
      .sort((a, b) => Number(b.createdAt - a.createdAt))[0]?.id ?? null;

  const { data: persistedAnnotations } = useAnnotationsByAnalysis(
    latestAnalysisId ? String(latestAnalysisId) : "",
  );

  const updateChapter = useUpdateChapter();
  const saveAnalysis = useSaveAnalysis();
  const saveAnnotations = useSaveAnnotations();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [saveErrorBannerVisible, setSaveErrorBannerVisible] = useState(false);

  // AI analysis state
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("grammar");
  const [summaryType, setSummaryType] = useState<SummaryType>("short");
  const [summaryResult, setSummaryResult] = useState<string | null>(null);

  // Comments state
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);
  const [lektorPanelOpen, setLektorPanelOpen] = useState(false);
  const [recordingsPanelOpen, setRecordingsPanelOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [floatingButtonPos, setFloatingButtonPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Synonym state
  const [synonymPopupOpen, setSynonymPopupOpen] = useState(false);
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [synonymLoading, setSynonymLoading] = useState(false);
  const [synonymError, setSynonymError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState("");
  const [synonymMessage, setSynonymMessage] = useState<string | null>(null);
  const synonymSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const synonymButtonRef = useRef<HTMLButtonElement>(null);

  // Annotation visibility toggle state
  const [annotationsVisible, setAnnotationsVisible] = useState(true);
  const [currentAnnotations, setCurrentAnnotations] = useState<Annotation[]>(
    [],
  );

  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("ws_api_key") ?? "",
  );
  const [apiKeyFocused, setApiKeyFocused] = useState(false);
  const [provider, setProvider] = useState<"openai" | "claude">(() => {
    const saved = localStorage.getItem("ws_api_provider");
    return saved === "claude" ? "claude" : "openai";
  });
  const editorRef = useRef<Editor | null>(null);
  const [editorDomEl, setEditorDomEl] = useState<HTMLElement | null>(null);

  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist API key / provider to localStorage
  useEffect(() => {
    localStorage.setItem("ws_api_key", apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem("ws_api_provider", provider);
  }, [provider]);

  // Sync from query data — only when chapterId changes, not on every background refetch
  const lastSyncedChapterIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (chapter && lastSyncedChapterIdRef.current !== chapterId) {
      setTitle(chapter.title);
      setContent(chapter.content);
      setSaveStatus("saved");
      lastSyncedChapterIdRef.current = chapterId;
    }
  }, [chapter, chapterId]);

  // Apply persisted annotations (only non-approved ones) when editor is ready
  // Guarded by annotationsVisible ref to avoid re-applying when user explicitly hid them
  const annotationsVisibleRef = useRef(annotationsVisible);
  useEffect(() => {
    annotationsVisibleRef.current = annotationsVisible;
  });

  useEffect(() => {
    if (
      editorRef.current &&
      persistedAnnotations &&
      persistedAnnotations.length > 0 &&
      annotationsVisibleRef.current
    ) {
      const anns: Annotation[] = persistedAnnotations.map((pa) => ({
        id: pa.id,
        text: pa.text,
        color: pa.color as Annotation["color"],
        explanation: pa.explanation,
        proposal: pa.proposal,
        approved: pa.approved,
      }));
      applyAnnotationsToEditor(editorRef.current, anns, { skipApproved: true });
    }
  }, [persistedAnnotations]);

  const doSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (!chapter) return;
      setSaveStatus("saving");
      setSaveErrorBannerVisible(false);
      updateChapter.mutate(
        {
          id: chapter.id,
          title: newTitle,
          content: newContent,
        },
        {
          onSuccess: () => {
            setSaveStatus("saved");
            setSaveErrorBannerVisible(false);
          },
          onError: () => {
            setSaveStatus("unsaved");
            setSaveErrorBannerVisible(true);
          },
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
          className="text-xl font-display font-semibold border-0 bg-transparent px-0 focus-visible:border-b focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 hover:border-b hover:border-border transition-colors placeholder:text-muted-foreground/50"
          data-ocid="chapter.title_input"
        />
      </div>

      {/* Save error banner */}
      {saveErrorBannerVisible && (
        <div
          className="shrink-0 rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium"
          data-ocid="chapter.save_error_banner"
        >
          Błąd zapisu! Twoje ostatnie zmiany NIE zostały zapisane. Sprawdź
          połączenie z internetem — Twoja praca może zostać utracona.
        </div>
      )}

      {/* Analysis + Indent controls */}
      <div
        className="shrink-0 flex flex-wrap items-center gap-4 p-3 rounded-lg border border-border bg-card"
        data-ocid="chapter.tools_panel"
      >
        {/* Analysis section */}
        <div className="flex flex-col gap-1 flex-1 min-w-[280px]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
              <Sparkles className="h-3.5 w-3.5" />
              AI
            </div>
            <div className="relative flex-1 min-w-[120px]">
              <Input
                type="password"
                placeholder="Klucz API"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onFocus={() => setApiKeyFocused(true)}
                onBlur={() => setApiKeyFocused(false)}
                className="h-8 text-sm w-full"
                data-ocid="chapter.api_key_input"
              />
              {!apiKeyFocused && apiKey.trim().length > 0 && (
                <span className="absolute left-0 -bottom-4 text-[10px] text-muted-foreground/60 whitespace-nowrap">
                  {apiKey.slice(0, 8)}...
                </span>
              )}
            </div>
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
            <Select
              value={analysisMode}
              onValueChange={(v) => {
                setAnalysisMode(v as AnalysisMode);
                setAnalysisStatus("idle");
                setAnalysisError(null);
                setSummaryResult(null);
              }}
            >
              <SelectTrigger
                className="h-8 w-[180px] text-sm"
                data-ocid="chapter.analysis_mode_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grammar">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Gramatyka i styl
                  </div>
                </SelectItem>
                <SelectItem value="context">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" />
                    Analizuj z kontekstem
                  </div>
                </SelectItem>
                <SelectItem value="dialogue">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Dialogi
                  </div>
                </SelectItem>
                <SelectItem value="summary">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="h-3.5 w-3.5" />
                    Streszczenie książki
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {analysisMode === "summary" && (
              <Select
                value={summaryType}
                onValueChange={(v) => setSummaryType(v as SummaryType)}
              >
                <SelectTrigger
                  className="h-8 w-[130px] text-sm"
                  data-ocid="chapter.summary_type_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Krótkie</SelectItem>
                  <SelectItem value="long">Długie</SelectItem>
                  <SelectItem value="hooks">Haki</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Button
              size="sm"
              variant="secondary"
              disabled={analysisStatus === "loading" || !apiKey.trim()}
              onClick={async () => {
                if (!editorRef.current || !chapter || !book) return;

                // Determine text to analyze: selection for grammar/context/dialogue, full text for summary
                let text: string;
                let selectionRange: { from: number; to: number } | undefined;
                const editor = editorRef.current;
                const { from: selFrom, to: selTo } = editor.state.selection;

                if (analysisMode === "summary") {
                  text = editor.getText();
                } else if (selFrom !== selTo) {
                  text = editor.state.doc.textBetween(selFrom, selTo, " ");
                  selectionRange = { from: selFrom, to: selTo };
                } else {
                  text = editor.getText();
                }

                if (!text.trim()) {
                  setAnalysisError("Brak tekstu do analizy");
                  setAnalysisStatus("error");
                  return;
                }
                setAnalysisStatus("loading");
                setAnalysisError(null);
                setSummaryResult(null);
                try {
                  if (analysisMode === "summary") {
                    // Build all chapters text
                    const allChaptersText = (chapters ?? [])
                      .sort((a, b) => Number(a.orderIndex - b.orderIndex))
                      .map((ch) => `## ${ch.title}\n\n${ch.content}`)
                      .join("\n\n---\n\n");
                    const summary = await generateSummary(
                      allChaptersText,
                      summaryType,
                      apiKey.trim(),
                      provider,
                    );
                    setSummaryResult(summary);
                    // Save as book-level analysis
                    await saveAnalysis.mutateAsync({
                      bookId: book.id,
                      chapterId: null,
                      analysisType: "summary",
                      provider,
                      resultContent: summary,
                    });
                    setAnalysisStatus("success");
                    setTimeout(() => setAnalysisStatus("idle"), 3000);
                    return;
                  }

                  let annotations: Annotation[] = [];
                  if (analysisMode === "grammar") {
                    annotations = await analyzeGrammarStyle(
                      text,
                      apiKey.trim(),
                      provider,
                    );
                  } else if (analysisMode === "context") {
                    // Fetch previous chapter summaries
                    const previousSummaries: string[] = [];
                    const sortedChapters = (chapters ?? []).sort((a, b) =>
                      Number(a.orderIndex - b.orderIndex),
                    );
                    const currentIdx = sortedChapters.findIndex(
                      (ch) => ch.id === chapter.id,
                    );
                    for (let i = 0; i < currentIdx; i++) {
                      const prevChapter = sortedChapters[i];
                      if (!prevChapter) continue;
                      const prevChapterId = prevChapter.id;
                      const matchingAnalyses = (bookAnalyses ?? []).filter(
                        (a) =>
                          a.analysisType === "summary" &&
                          (a.chapterId === null ||
                            a.chapterId === prevChapterId),
                      );
                      for (const analysis of matchingAnalyses) {
                        previousSummaries.push(analysis.resultContent);
                      }
                    }
                    annotations = await analyzeWithContext(
                      text,
                      previousSummaries,
                      apiKey.trim(),
                      provider,
                    );
                  } else if (analysisMode === "dialogue") {
                    annotations = await analyzeDialogue(
                      text,
                      apiKey.trim(),
                      provider,
                    );
                  }

                  setCurrentAnnotations(annotations);
                  setAnnotationsVisible(true);
                  applyAnnotationsToEditor(editorRef.current, annotations, {
                    clearRange: selectionRange,
                  });
                  // Save analysis + annotations to backend
                  const analysisId = await saveAnalysis.mutateAsync({
                    bookId: book.id,
                    chapterId: chapter.id,
                    analysisType: analysisMode,
                    provider,
                    resultContent: JSON.stringify(annotations),
                  });
                  const newIds = await saveAnnotations.mutateAsync({
                    analysisId,
                    annotations,
                  });
                  // Assign returned IDs to annotations and re-apply marks with real IDs
                  for (let i = 0; i < annotations.length; i++) {
                    if (newIds[i] !== undefined) {
                      annotations[i].id = newIds[i];
                    }
                  }
                  setCurrentAnnotations(annotations);
                  applyAnnotationsToEditor(editorRef.current, annotations, {
                    clearRange: selectionRange,
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
              ) : analysisMode === "summary" ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Generuj streszczenie
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Analizuj
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="w-px h-6 bg-border hidden sm:block" />

        {/* Lektor toggle */}
        <Button
          size="sm"
          variant={lektorPanelOpen ? "default" : "outline"}
          onClick={() => setLektorPanelOpen((v) => !v)}
          disabled={provider === "claude"}
          data-ocid="chapter.lektor_toggle_button"
        >
          <Volume2 className="h-3.5 w-3.5 mr-1.5" />
          Lektor
        </Button>

        <div className="w-px h-6 bg-border hidden sm:block" />

        {/* Annotation visibility toggle */}
        {(currentAnnotations.length > 0 ||
          (persistedAnnotations && persistedAnnotations.length > 0)) && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (!editorRef.current) return;
              if (annotationsVisible) {
                // Hide: remove all annotation marks from editor
                applyAnnotationsToEditor(editorRef.current, []);
                setAnnotationsVisible(false);
              } else {
                // Show: re-apply known annotations
                const anns: Annotation[] =
                  currentAnnotations.length > 0
                    ? currentAnnotations
                    : (persistedAnnotations ?? []).map((pa) => ({
                        id: pa.id,
                        text: pa.text,
                        color: pa.color as Annotation["color"],
                        explanation: pa.explanation,
                        proposal: pa.proposal,
                        approved: pa.approved,
                      }));
                applyAnnotationsToEditor(editorRef.current, anns, {
                  skipApproved: true,
                });
                setAnnotationsVisible(true);
              }
            }}
            data-ocid="chapter.annotation_visibility_toggle"
          >
            {annotationsVisible ? (
              <>
                <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                Ukryj kolorowanie
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Pokaż kolorowanie
              </>
            )}
          </Button>
        )}

        {/* Approve changes button */}
        {currentAnnotations.length > 0 && (
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              if (!editorRef.current) return;
              const editor = editorRef.current;
              const annotationMarkNames = [
                "annotationYellow",
                "annotationRed",
                "annotationBlue",
                "annotationOrange",
                "annotationPurple",
              ];

              // Build a single atomic transaction to remove all annotation marks
              // for the text fragments corresponding to currentAnnotations
              const tr = editor.state.tr;
              for (const ann of currentAnnotations) {
                const range = findFirstTextRangeInDoc(editor, ann.text);
                if (range) {
                  for (const markName of annotationMarkNames) {
                    const markType = editor.schema.marks[markName];
                    if (markType) {
                      tr.removeMark(range.from, range.to, markType);
                    }
                  }
                }
              }
              if (tr.steps.length > 0) {
                editor.view.dispatch(tr);
              }

              // Clear current annotations state
              setCurrentAnnotations([]);
              setAnnotationsVisible(true);
            }}
            data-ocid="chapter.approve_changes_button"
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Zatwierdź zmiany
          </Button>
        )}

        <div className="w-px h-6 bg-border hidden sm:block" />

        {/* History toggle */}
        <Button
          size="sm"
          variant={historyPanelOpen ? "default" : "outline"}
          onClick={() => setHistoryPanelOpen((v) => !v)}
          data-ocid="chapter.history_toggle_button"
        >
          <History className="h-3.5 w-3.5 mr-1.5" />
          Historia
        </Button>

        <div className="w-px h-6 bg-border hidden sm:block" />

        {/* Recordings toggle */}
        <Button
          size="sm"
          variant={recordingsPanelOpen ? "default" : "outline"}
          onClick={() => setRecordingsPanelOpen((v) => !v)}
          data-ocid="chapter.recordings_toggle_button"
        >
          <Headphones className="h-3.5 w-3.5 mr-1.5" />
          Nagrania
        </Button>

        <div className="w-px h-6 bg-border hidden sm:block" />

        {/* Comments toggle */}
        <Button
          size="sm"
          variant={commentsPanelOpen ? "default" : "outline"}
          onClick={() => setCommentsPanelOpen((v) => !v)}
          data-ocid="chapter.comments_toggle_button"
        >
          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
          Komentarze
        </Button>

        <div className="w-px h-6 bg-border hidden sm:block" />

        {/* Synonyms toggle */}
        <Button
          ref={synonymButtonRef}
          size="sm"
          variant={synonymPopupOpen ? "default" : "outline"}
          onClick={async () => {
            if (synonymPopupOpen) {
              setSynonymPopupOpen(false);
              setSynonyms([]);
              setSelectedWord("");
              setSynonymMessage(null);
              synonymSelectionRef.current = null;
              return;
            }
            if (!editorRef.current) return;
            const { from, to } = editorRef.current.state.selection;
            if (from === to) {
              setSynonymMessage("Zaznacz słowo, aby znaleźć synonimy");
              setTimeout(() => setSynonymMessage(null), 3000);
              return;
            }
            const text = editorRef.current.state.doc.textBetween(from, to, " ");
            const trimmed = text.replace(
              /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,
              "",
            );
            if (!trimmed.trim()) {
              setSynonymMessage("Zaznacz słowo, aby znaleźć synonimy");
              setTimeout(() => setSynonymMessage(null), 3000);
              return;
            }
            setSelectedWord(trimmed);
            synonymSelectionRef.current = { from, to };
            setSynonymPopupOpen(true);
            setSynonymLoading(true);
            setSynonymError(null);
            setSynonymMessage(null);
            try {
              const results = await getSynonyms(
                trimmed,
                apiKey.trim(),
                provider,
              );
              setSynonyms(results);
            } catch (err) {
              setSynonymError(
                err instanceof Error
                  ? err.message
                  : "Błąd wyszukiwania synonimów",
              );
            } finally {
              setSynonymLoading(false);
            }
          }}
          data-ocid="chapter.synonyms_toggle_button"
        >
          <BookText className="h-3.5 w-3.5 mr-1.5" />
          Synonimy
        </Button>

        <div className="w-px h-6 bg-border hidden sm:block" />
        {/* Export dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              data-ocid="chapter.export_dropdown_trigger"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Eksportuj
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                if (editorRef.current) {
                  exportToPDF(title, editorRef.current.getHTML());
                }
              }}
              data-ocid="chapter.export_pdf_item"
            >
              <FileText className="h-4 w-4 mr-2" />
              Eksportuj do PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (editorRef.current) {
                  const indents = getGlobalIndents();
                  exportToDOCX(
                    title,
                    editorRef.current.getHTML(),
                    indents.left,
                    indents.right,
                    indents.firstLine,
                  );
                }
              }}
              data-ocid="chapter.export_docx_item"
            >
              <FileText className="h-4 w-4 mr-2" />
              Eksportuj do DOCX
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border hidden sm:block" />
      </div>

      {/* Lektor panel */}
      {lektorPanelOpen && (
        <div data-ocid="chapter.lektor_panel_container">
          {provider === "claude" ? (
            <div className="shrink-0 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 border border-border">
              Lektor wymaga klucza API OpenAI. Przełącz provider na OpenAI lub
              wprowadź klucz OpenAI.
            </div>
          ) : (
            <LektorPanel
              editor={editorRef.current}
              apiKey={apiKey}
              chapterId={chapter.id}
              bookId={book.id}
            />
          )}
        </div>
      )}

      {/* History modal */}
      <Dialog open={historyPanelOpen} onOpenChange={setHistoryPanelOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historia analiz
            </DialogTitle>
          </DialogHeader>
          <AnalysisHistoryPanel
            bookId={book.id}
            chapterId={chapter.id}
            onLoadAnalysis={(annotations) => {
              setHistoryPanelOpen(false);
              if (editorRef.current) {
                setCurrentAnnotations(annotations);
                setAnnotationsVisible(true);
                applyAnnotationsToEditor(editorRef.current, annotations, {
                  skipApproved: true,
                });
              }
            }}
            onOpenSummary={(content) => {
              setHistoryPanelOpen(false);
              setSummaryResult(content);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Recordings panel */}
      {recordingsPanelOpen && (
        <div data-ocid="chapter.recordings_panel_container">
          <RecordingsPanel chapterId={chapter.id} />
        </div>
      )}

      {analysisStatus === "error" && analysisError && (
        <div
          className="shrink-0 text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2"
          data-ocid="chapter.analysis_error"
        >
          {analysisError}
        </div>
      )}

      {/* Summary result modal */}
      <Dialog
        open={!!summaryResult}
        onOpenChange={() => setSummaryResult(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlignLeft className="h-4 w-4" />
              Streszczenie książki
              <span className="text-xs font-normal text-muted-foreground ml-2">
                {summaryType === "short" && "Krótkie"}
                {summaryType === "long" && "Długie"}
                {summaryType === "hooks" && "Haki marketingowe"}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {summaryResult}
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating "Add comment" button on text selection */}
      {floatingButtonPos && (
        <button
          type="button"
          className="fixed z-40 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          style={{
            left: floatingButtonPos.x,
            top: floatingButtonPos.y - 36,
          }}
          onClick={() => {
            setCommentDialogOpen(true);
            setFloatingButtonPos(null);
          }}
          data-ocid="chapter.add_comment_floating_button"
        >
          Dodaj komentarz
        </button>
      )}

      {/* Synonym message */}
      {synonymMessage && (
        <div
          className="shrink-0 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 border border-border"
          data-ocid="chapter.synonym_message"
        >
          {synonymMessage}
        </div>
      )}

      {/* Synonym popup */}
      {synonymPopupOpen && editorRef.current && synonymButtonRef.current && (
        <SynonymPopup
          editor={editorRef.current}
          word={selectedWord}
          synonyms={synonyms}
          isLoading={synonymLoading}
          error={synonymError}
          onSelect={(synonym) => {
            if (!editorRef.current || !synonymSelectionRef.current) return;
            const { from, to } = synonymSelectionRef.current;
            editorRef.current
              .chain()
              .focus()
              .setTextSelection({ from, to })
              .insertContent(synonym)
              .run();
            setSynonymPopupOpen(false);
            setSynonyms([]);
            setSelectedWord("");
            synonymSelectionRef.current = null;
          }}
          onClose={() => {
            setSynonymPopupOpen(false);
            setSynonyms([]);
            setSelectedWord("");
            synonymSelectionRef.current = null;
          }}
          anchorElement={synonymButtonRef.current}
        />
      )}

      {/* Comment dialog */}
      <CommentDialog
        open={commentDialogOpen}
        onOpenChange={setCommentDialogOpen}
        anchorText={selectedText}
        onSave={async (commentContent) => {
          if (!editorRef.current || !chapter) return;
          const editor = editorRef.current;
          const { from, to } = editor.state.selection;

          // Apply comment mark
          editor
            .chain()
            .focus()
            .setTextSelection({ from, to })
            .setMark("comment", {})
            .run();

          // Save to backend
          const commentId = await createComment.mutateAsync({
            chapterId: chapter.id,
            anchorText: selectedText,
            content: commentContent,
          });

          // Update mark with data-comment-id
          editor
            .chain()
            .focus()
            .setTextSelection({ from, to })
            .setMark("comment", {
              "data-comment-id": String(commentId),
            })
            .run();
        }}
      />

      {/* Editor + Comments panel */}
      <div className="flex flex-1 min-h-0 gap-0">
        <div
          className="flex-1 min-h-0"
          style={{
            paddingLeft: `${getGlobalIndents().left}px`,
            paddingRight: `${getGlobalIndents().right}px`,
          }}
          data-ocid="chapter.editor_wrapper"
        >
          {/* Indent ruler */}
          <IndentRuler editorElement={editorDomEl} />

          <RichTextEditor
            value={content}
            onChange={handleContentChange}
            placeholder="Zacznij pisać..."
            onEditorReady={(editor) => {
              editorRef.current = editor;
              setEditorDomEl(editor.view.dom as HTMLElement);

              // Listen for text selection to show floating button
              const view = editor.view;
              const dom = view.dom as HTMLElement;

              const handleMouseUp = () => {
                const { from, to } = editor.state.selection;
                if (from === to) {
                  setFloatingButtonPos(null);
                  return;
                }
                const text = editor.state.doc.textBetween(from, to, " ");
                if (!text.trim()) {
                  setFloatingButtonPos(null);
                  return;
                }
                setSelectedText(text);

                // Get selection rect
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  const rect = range.getBoundingClientRect();
                  setFloatingButtonPos({
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                  });
                }
              };

              dom.addEventListener("mouseup", handleMouseUp);
            }}
          />
        </div>

        {commentsPanelOpen && (
          <CommentsPanel
            comments={comments ?? []}
            onDelete={(id) => {
              deleteComment.mutate({ id });
              // Remove mark from editor
              if (editorRef.current) {
                const editor = editorRef.current;
                editor.state.doc.descendants((node, pos) => {
                  if (!node.isText) return false;
                  const mark = node.marks.find(
                    (m) =>
                      m.type.name === "comment" &&
                      m.attrs["data-comment-id"] === String(id),
                  );
                  if (mark) {
                    editor
                      .chain()
                      .focus()
                      .setTextSelection({ from: pos, to: pos + node.nodeSize })
                      .unsetMark("comment")
                      .run();
                  }
                  return false;
                });
              }
            }}
            onHighlight={(anchorText) => {
              if (!editorRef.current) return;
              const editor = editorRef.current;
              const docText = editor.getText();
              const idx = docText.indexOf(anchorText);
              if (idx === -1) return;
              const from = editor.state.doc.resolve(idx);
              const to = editor.state.doc.resolve(idx + anchorText.length);
              editor
                .chain()
                .focus()
                .setTextSelection({ from: from.pos, to: to.pos })
                .scrollIntoView()
                .run();
            }}
            onClose={() => setCommentsPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
