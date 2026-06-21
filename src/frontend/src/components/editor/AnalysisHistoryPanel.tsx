import type { Analysis, Chapter } from "@/backend";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAnalysesByBook,
  useAnnotationsByAnalysis,
  useChapters,
  useDeleteAnalysis,
} from "@/hooks/useBackend";
import type { Annotation } from "@/lib/aiAnalysis";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Heart,
  MessageCircle,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface AnalysisHistoryPanelProps {
  bookId: bigint;
  chapterId: bigint;
  onLoadAnalysis: (annotations: Annotation[]) => void;
  onOpenSummary: (content: string) => void;
}

const analysisTypeLabels: Record<string, string> = {
  grammar: "Gramatyka i styl",
  context: "Analizuj z kontekstem",
  dialogue: "Dialogi",
  summary: "Streszczenie",
  scene: "Rozszerzenie sceny",
  emotion: "Emocja",
  consistency: "Analiza spójności",
};

const analysisTypeIcons: Record<string, React.ReactNode> = {
  grammar: <Sparkles className="h-3.5 w-3.5" />,
  context: <BookOpen className="h-3.5 w-3.5" />,
  dialogue: <MessageCircle className="h-3.5 w-3.5" />,
  summary: <Clock className="h-3.5 w-3.5" />,
  scene: <Wand2 className="h-3.5 w-3.5" />,
  emotion: <Heart className="h-3.5 w-3.5" />,
  consistency: <BookOpen className="h-3.5 w-3.5" />,
};

function formatDate(timestamp: bigint) {
  return new Date(Number(timestamp) / 1_000_000).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AnalysisRow({
  analysis,
  chapterMap,
  onLoad,
  onOpenSummary,
  onDelete,
}: {
  analysis: Analysis;
  chapterMap: Map<string, string>;
  onLoad: (analysis: Analysis) => void;
  onOpenSummary: (content: string) => void;
  onDelete: (id: bigint) => void;
}) {
  const { data: annotations } = useAnnotationsByAnalysis(String(analysis.id));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const totalAnnotations = annotations?.length ?? 0;
  const approvedCount = annotations?.filter((a) => a.approved).length ?? 0;

  const isSummary = analysis.analysisType === "summary";
  const chapterName = analysis.chapterId
    ? (chapterMap.get(String(analysis.chapterId)) ?? "Rozdział")
    : "Cała książka";

  const handleClick = () => {
    if (isSummary) {
      onOpenSummary(analysis.resultContent);
    } else {
      onLoad(analysis);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(analysis.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <button
      type="button"
      className="group w-full text-left rounded-md border border-border bg-background p-3 hover:border-primary/40 transition-colors cursor-pointer"
      onClick={handleClick}
      data-ocid={`history.item.${analysis.id}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {analysisTypeIcons[analysis.analysisType] ?? (
              <Sparkles className="h-3.5 w-3.5" />
            )}
          </span>
          <span className="text-sm font-medium">
            {analysisTypeLabels[analysis.analysisType] ?? analysis.analysisType}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {totalAnnotations > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mr-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>
                {approvedCount}/{totalAnnotations}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            data-ocid={`history.delete_button.${analysis.id}`}
          >
            {confirmDelete ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
        <span className="uppercase tracking-wider">{analysis.provider}</span>
        <span>{formatDate(analysis.createdAt)}</span>
        <span className="text-muted-foreground/40">{chapterName}</span>
      </div>
    </button>
  );
}

export function AnalysisHistoryPanel({
  bookId,
  chapterId,
  onLoadAnalysis,
  onOpenSummary,
}: AnalysisHistoryPanelProps) {
  const { data: bookAnalyses, isLoading } = useAnalysesByBook(Number(bookId));
  const { data: chapters } = useChapters(Number(bookId));
  const deleteAnalysis = useDeleteAnalysis();

  const chapterMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ch of chapters ?? []) {
      map.set(String(ch.id), ch.title);
    }
    return map;
  }, [chapters]);

  const chapterAnalyses = useMemo(() => {
    if (!bookAnalyses) return [];
    return bookAnalyses
      .filter(
        (a) =>
          a.chapterId !== undefined &&
          a.chapterId !== null &&
          a.chapterId === chapterId,
      )
      .sort((a, b) => Number(b.createdAt - a.createdAt));
  }, [bookAnalyses, chapterId]);

  const allBookAnalyses = useMemo(() => {
    if (!bookAnalyses) return [];
    return bookAnalyses.sort((a, b) => Number(b.createdAt - a.createdAt));
  }, [bookAnalyses]);

  const handleLoad = useCallback(
    async (analysis: Analysis) => {
      if (analysis.analysisType === "summary") {
        onOpenSummary(analysis.resultContent);
        return;
      }
      try {
        const parsed: Annotation[] = JSON.parse(analysis.resultContent);
        onLoadAnalysis(parsed);
      } catch {
        // If not valid JSON, skip
      }
    },
    [onLoadAnalysis, onOpenSummary],
  );

  const handleDelete = useCallback(
    (id: bigint) => {
      deleteAnalysis.mutate({ id });
    },
    [deleteAnalysis],
  );

  if (isLoading) {
    return (
      <div
        className="py-8 text-center text-xs text-muted-foreground"
        data-ocid="history.loading_state"
      >
        Ładowanie historii...
      </div>
    );
  }

  return (
    <div className="flex flex-col" data-ocid="history.panel">
      <Tabs defaultValue="chapter" className="flex flex-col flex-1 min-h-0">
        <TabsList className="h-8 bg-muted/50 mb-3">
          <TabsTrigger
            value="chapter"
            className="text-xs px-3 py-1"
            data-ocid="history.tab.chapter"
          >
            Ten rozdział
          </TabsTrigger>
          <TabsTrigger
            value="book"
            className="text-xs px-3 py-1"
            data-ocid="history.tab.book"
          >
            Cała książka
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chapter" className="flex-1 min-h-0 m-0">
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {chapterAnalyses.length === 0 ? (
              <div
                className="text-center py-8 text-sm text-muted-foreground"
                data-ocid="history.empty_state.chapter"
              >
                <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                Brak analiz dla tego rozdziału
              </div>
            ) : (
              chapterAnalyses.map((analysis) => (
                <AnalysisRow
                  key={String(analysis.id)}
                  analysis={analysis}
                  chapterMap={chapterMap}
                  onLoad={handleLoad}
                  onOpenSummary={onOpenSummary}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="book" className="flex-1 min-h-0 m-0">
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {allBookAnalyses.length === 0 ? (
              <div
                className="text-center py-8 text-sm text-muted-foreground"
                data-ocid="history.empty_state.book"
              >
                <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                Brak analiz dla tej książki
              </div>
            ) : (
              allBookAnalyses.map((analysis) => (
                <AnalysisRow
                  key={String(analysis.id)}
                  analysis={analysis}
                  chapterMap={chapterMap}
                  onLoad={handleLoad}
                  onOpenSummary={onOpenSummary}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
