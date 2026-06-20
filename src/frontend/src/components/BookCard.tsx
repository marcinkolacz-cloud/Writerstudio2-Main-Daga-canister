import type { Book } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface BookCardProps {
  book: Book;
  index: number;
}

export function BookCard({ book, index }: BookCardProps) {
  return (
    <Card
      className="hover:shadow-subtle transition-smooth cursor-pointer border-border bg-card"
      data-ocid={`book.item.${index + 1}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
            <CardTitle className="text-base font-semibold leading-tight">
              {book.title}
            </CardTitle>
          </div>
          <Badge variant="secondary" className="flex-shrink-0 text-xs">
            {book.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {book.description || "Brak opisu"}
        </p>
      </CardContent>
    </Card>
  );
}
