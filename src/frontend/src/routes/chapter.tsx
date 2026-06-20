import { ChapterEditorPage } from "@/pages/ChapterEditor";
import { createRoute } from "@tanstack/react-router";
import { bookRoute } from "./book";

export const chapterRoute = createRoute({
  getParentRoute: () => bookRoute,
  path: "chapters/$chapterId",
  component: ChapterEditorPage,
});
