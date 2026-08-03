import type { Book } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { useBookStats, useDeleteBook } from "@/hooks/useBackend";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, FileText, Layers, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BookCardProps {
  book: Book;
  index: number;
}

const ACCENT_CLASSES = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

export function BookCard({ book, index }: BookCardProps) {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useBookStats(
    book.id.toString(),
  );
  const accentClass = ACCENT_CLASSES[index % ACCENT_CLASSES.length];
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteBook = useDeleteBook();

  const handleDelete = async () => {
    try {
      await deleteBook.mutateAsync(book.id);
      toast.success("Książka przeniesiona do kosza", {
        description: "Możesz ją przywrócić ze strony Kosz.",
      });
      setConfirmOpen(false);
    } catch (err) {
      toast.error("Nie udało się usunąć książki", {
        description: err instanceof Error ? err.message : "Nieznany błąd",
      });
    }
  };

  return (
    <Card
      onClick={() =>
        navigate({ to: "/books/$bookId", params: { bookId: String(book.id) } })
      }
      className="group relative overflow-hidden hover:shadow-elevated transition-smooth cursor-pointer border-border bg-card"
      data-ocid={`book.item.${index + 1}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${accentClass}`} aria-hidden="true" />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setConfirmOpen(true);
        }}
        className="absolute right-2 top-3 z-10 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        aria-label="Usuń książkę"
        data-ocid={`book.item.${index + 1}.delete_button`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
            <CardTitle className="text-base font-semibold leading-tight truncate pr-6">
              {book.title}
            </CardTitle>
          </div>
          <Badge variant="secondary" className="flex-shrink-0 text-xs">
            {book.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">
          {book.description || "Brak opisu"}
        </p>
        <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          {statsLoading ? (
            <span className="text-muted-foreground/60">Ładowanie…</span>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">
                  {Number(stats?.totalWords ?? 0).toLocaleString("pl-PL")}
                </span>
                słów
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">
                  {Number(stats?.chapterCount ?? 0).toLocaleString("pl-PL")}
                </span>
                rozdz.
              </span>
            </>
          )}
        </div>
      </CardContent>
      <div onClick={(e) => e.stopPropagation()}>
        <ConfirmDeleteDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          expectedText={book.title}
          title="Usunąć książkę?"
          description="Książka i wszystkie jej rozdziały trafią do kosza. Będziesz mógł je przywrócić w każdej chwili ze strony Kosz."
          confirmLabel="Przenieś do kosza"
          onConfirm={handleDelete}
          isPending={deleteBook.isPending}
          variant="trash"
        />
      </div>
    </Card>
  );
}

