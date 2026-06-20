import { BookCard } from "@/components/BookCard";
import { CreateBookDialog } from "@/components/CreateBookDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useBooks } from "@/hooks/useBackend";
import { BookOpen } from "lucide-react";

export function DashboardPage() {
  const { data: books, isLoading } = useBooks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Twoje książki
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Zarządzaj swoimi projektami pisarskimi
          </p>
        </div>
        <CreateBookDialog />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={`skeleton-${String(i)}`}
              className="h-32 w-full rounded-lg"
            />
          ))}
        </div>
      ) : books && books.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book, index) => (
            <BookCard key={String(book.id)} book={book} index={index} />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="book.empty_state"
        >
          <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nie masz jeszcze żadnej książki
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Rozpocznij swoją przygodę pisarską, tworząc pierwszą książkę.
          </p>
          <CreateBookDialog variant="empty" />
        </div>
      )}
    </div>
  );
}
