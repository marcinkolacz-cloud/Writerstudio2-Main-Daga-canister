import type { Book } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBookStats } from "@/hooks/useBackend";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, FileText, Layers } from "lucide-react";

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

  return (
    <Card
      onClick={() =>
        navigate({ to: "/books/$bookId", params: { bookId: String(book.id) } })
      }
      className="group relative overflow-hidden hover:shadow-elevated transition-smooth cursor-pointer border-border bg-card"
      data-ocid={`book.item.${index + 1}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${accentClass}`} aria-hidden="true" />
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
            <CardTitle className="text-base font-semibold leading-tight truncate">
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
    </Card>
  );
}

