import { ChapterEditorPage } from "@/pages/ChapterEditor";
import { useAppStore } from "@/store/useAppStore";
import { createRoute, redirect } from "@tanstack/react-router";
import { bookRoute } from "./book";

export const chapterRoute = createRoute({
  getParentRoute: () => bookRoute,
  path: "chapters/$chapterId",
  beforeLoad: () => {
    const { isAuthenticated } = useAppStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: ChapterEditorPage,
});
