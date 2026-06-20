import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBook, useChapters, useCreateChapter } from "@/hooks/useBackend";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, FileText, Plus } from "lucide-react";
import { toast } from "sonner";

function ChapterListItem({
  chapter,
  bookId,
  index,
}: {
  chapter: {
    id: bigint;
    title: string;
    wordCount: bigint;
  };
  bookId: string;
  index: number;
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() =>
        navigate({
          to: "/books/$bookId/chapters/$chapterId",
          params: { bookId, chapterId: String(chapter.id) },
        })
      }
      className="w-full flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors text-left group"
      data-ocid={`chapter.item.${index + 1}`}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center">
        <FileText className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">
          {chapter.title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {Number(chapter.wordCount)} słów
        </p>
      </div>
      <ArrowLeft className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -rotate-180" />
    </button>
  );
}

export function BookOverviewPage() {
  const { bookId } = useParams({ from: "/layout/books/$bookId" });
  const navigate = useNavigate();

  const {
    data: book,
    isLoading: bookLoading,
    isError: bookError,
  } = useBook(bookId);
  const { data: chapters, isLoading: chaptersLoading } = useChapters(bookId);
  const createChapter = useCreateChapter();

  const handleAddChapter = () => {
    createChapter.mutate(
      { bookId: BigInt(bookId), title: "Nowy rozdział" },
      {
        onSuccess: (chapterId) => {
          toast.success("Rozdział został dodany");
          navigate({
            to: "/books/$bookId/chapters/$chapterId",
            params: { bookId, chapterId: String(chapterId) },
          });
        },
        onError: () => {
          toast.error("Nie udało się dodać rozdziału");
        },
      },
    );
  };

  const isLoading = bookLoading || chaptersLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={`ch-skeleton-${String(i)}`}
              className="h-16 w-full rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (bookError || !book) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nie znaleziono książki
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Książka o podanym identyfikatorze nie istnieje lub nie masz do niej
          dostępu.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/dashboard" })}
          data-ocid="book.back_button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Wróć do dashboardu
        </Button>
      </div>
    );
  }

  const hasChapters = chapters && chapters.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate({ to: "/dashboard" })}
            data-ocid="book.back_button"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            {book.title}
          </h1>
          {book.description && (
            <p className="text-sm text-muted-foreground max-w-xl">
              {book.description}
            </p>
          )}
          <div className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {book.category}
          </div>
        </div>
        <Button
          onClick={handleAddChapter}
          disabled={createChapter.isPending}
          data-ocid="chapter.add_button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj rozdział
        </Button>
      </div>

      {/* Chapter list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Rozdziały
        </h2>

        {hasChapters ? (
          <div className="space-y-2">
            {chapters.map((chapter, index) => (
              <ChapterListItem
                key={String(chapter.id)}
                chapter={chapter}
                bookId={bookId}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg"
            data-ocid="chapter.empty_state"
          >
            <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-medium text-foreground mb-1">
              Brak rozdziałów
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Dodaj pierwszy rozdział, aby rozpocząć pisanie.
            </p>
            <Button
              variant="outline"
              onClick={handleAddChapter}
              disabled={createChapter.isPending}
              data-ocid="chapter.add_button.empty"
            >
              <Plus className="h-4 w-4 mr-2" />
              Dodaj rozdział
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
