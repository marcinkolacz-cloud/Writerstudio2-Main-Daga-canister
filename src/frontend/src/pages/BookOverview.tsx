import { useParams } from "@tanstack/react-router";

export function BookOverviewPage() {
  const { bookId } = useParams({ from: "/layout/books/$bookId" });

  return (
    <div className="flex items-center justify-center h-full">
      <h1 className="text-2xl font-display text-foreground">
        Przegląd książki (ID: {bookId})
      </h1>
    </div>
  );
}
