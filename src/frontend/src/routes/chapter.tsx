import { ChapterEditorPage } from "@/pages/ChapterEditor";
import { useAppStore } from "@/store/useAppStore";
import { createRoute, redirect } from "@tanstack/react-router";
import { layoutRoute } from "./layout";

export const chapterRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/books/$bookId/chapters/$chapterId",
  beforeLoad: () => {
    const { isAuthenticated } = useAppStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: ChapterEditorPage,
});
