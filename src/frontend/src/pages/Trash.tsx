import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBooks,
  usePermanentlyDeleteBook,
  usePermanentlyDeleteChapter,
  useRestoreBook,
  useRestoreChapter,
  useTrashedBooks,
  useTrashedChaptersByBook,
} from "@/hooks/useBackend";
import type { Book, Chapter } from "@/backend";
import { BookOpen, FileText, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function TrashedBookRow({ book }: { book: Book }) {
  const restoreBook = useRestoreBook();
  const permanentlyDeleteBook = usePermanentlyDeleteBook();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleRestore = async () => {
    try {
      await restoreBook.mutateAsync(book.id);
      toast.success("Książka przywrócona");
    } catch (err) {
      toast.error("Nie udało się przywrócić książki", {
        description: err instanceof Error ? err.message : "Nieznany błąd",
      });
    }
  };

  const handlePermanentlyDelete = async () => {
    try {
      await permanentlyDeleteBook.mutateAsync(book.id);
      toast.success("Książka usunięta na zawsze");
      setConfirmOpen(false);
    } catch (err) {
      toast.error("Nie udało się usunąć książki", {
        description: err instanceof Error ? err.message : "Nieznany błąd",
      });
    }
  };

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
      data-ocid={`trash.book.item.${String(book.id)}`}
    >
      <BookOpen className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{book.title}</p>
        <p className="text-xs text-muted-foreground">Książka (razem z rozdziałami)</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        disabled={restoreBook.isPending}
        data-ocid="trash.book.restore_button"
      >
        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
        Przywróć
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
        data-ocid="trash.book.permanent_delete_button"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
        Usuń na zawsze
      </Button>
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        expectedText={book.title}
        title="Usunąć na zawsze?"
        description="Tej operacji nie da się cofnąć. Książka i wszystkie jej rozdziały zostaną trwale usunięte."
        confirmLabel="Usuń na zawsze"
        onConfirm={handlePermanentlyDelete}
        isPending={permanentlyDeleteBook.isPending}
        variant="permanent"
      />
    </div>
  );
}

function TrashedChapterRow({
  chapter,
  bookId,
  bookTitle,
}: {
  chapter: Chapter;
  bookId: bigint;
  bookTitle: string;
}) {
  const restoreChapter = useRestoreChapter();
  const permanentlyDeleteChapter = usePermanentlyDeleteChapter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleRestore = async () => {
    try {
      await restoreChapter.mutateAsync({ chapterId: chapter.id, bookId });
      toast.success("Rozdział przywrócony");
    } catch (err) {
      toast.error("Nie udało się przywrócić rozdziału", {
        description: err instanceof Error ? err.message : "Nieznany błąd",
      });
    }
  };

  const handlePermanentlyDelete = async () => {
    try {
      await permanentlyDeleteChapter.mutateAsync({ chapterId: chapter.id, bookId });
      toast.success("Rozdział usunięty na zawsze");
      setConfirmOpen(false);
    } catch (err) {
      toast.error("Nie udało się usunąć rozdziału", {
        description: err instanceof Error ? err.message : "Nieznany błąd",
      });
    }
  };

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
      data-ocid={`trash.chapter.item.${String(chapter.id)}`}
    >
      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{chapter.title}</p>
        <p className="text-xs text-muted-foreground">z książki: {bookTitle}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        disabled={restoreChapter.isPending}
        data-ocid="trash.chapter.restore_button"
      >
        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
        Przywróć
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
        data-ocid="trash.chapter.permanent_delete_button"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
        Usuń na zawsze
      </Button>
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        expectedText={chapter.title}
        title="Usunąć na zawsze?"
        description="Tej operacji nie da się cofnąć. Rozdział zostanie trwale usunięty."
        confirmLabel="Usuń na zawsze"
        onConfirm={handlePermanentlyDelete}
        isPending={permanentlyDeleteChapter.isPending}
        variant="permanent"
      />
    </div>
  );
}

// Trashed chapters can only belong to books that are still active (not
// themselves in the trash) — deleting a whole book already cascades its
// chapters into the trash together, and restoring the book restores them
// all at once, so they don't need a separate row here.
function TrashedChaptersForBook({ book }: { book: Book }) {
  const { data: trashedChapters, isLoading } = useTrashedChaptersByBook(
    book.id.toString(),
  );

  if (isLoading || !trashedChapters || trashedChapters.length === 0) return null;

  return (
    <>
      {trashedChapters.map((chapter) => (
        <TrashedChapterRow
          key={String(chapter.id)}
          chapter={chapter}
          bookId={book.id}
          bookTitle={book.title}
        />
      ))}
    </>
  );
}

export function TrashPage() {
  const { data: trashedBooks, isLoading: booksLoading } = useTrashedBooks();
  const { data: activeBooks, isLoading: activeBooksLoading } = useBooks();

  const isLoading = booksLoading || activeBooksLoading;
  const hasTrashedBooks = trashedBooks && trashedBooks.length > 0;
  const hasActiveBooks = activeBooks && activeBooks.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">
          Kosz
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Usunięte książki i rozdziały trafiają tutaj — możesz je przywrócić
          albo usunąć na zawsze.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`trash-skeleton-${String(i)}`} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Książki
            </h2>
            {hasTrashedBooks ? (
              <div className="space-y-2">
                {trashedBooks.map((book) => (
                  <TrashedBookRow key={String(book.id)} book={book} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Kosz książek jest pusty.</p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Rozdziały
            </h2>
            {hasActiveBooks ? (
              <div className="space-y-2">
                {activeBooks.map((book) => (
                  <TrashedChaptersForBook key={String(book.id)} book={book} />
                ))}
              </div>
            ) : null}
            {!hasActiveBooks && (
              <p className="text-sm text-muted-foreground">Brak rozdziałów w koszu.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
