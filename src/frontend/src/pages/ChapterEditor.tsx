import { useParams } from "@tanstack/react-router";

export function ChapterEditorPage() {
  const { bookId, chapterId } = useParams({
    from: "/layout/books/$bookId/chapters/$chapterId",
  });

  return (
    <div className="flex items-center justify-center h-full">
      <h1 className="text-2xl font-display text-foreground">
        Edytor rozdziału (Książka: {bookId}, Rozdział: {chapterId})
      </h1>
    </div>
  );
}
