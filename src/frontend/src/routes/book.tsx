import { BookOverviewPage } from "@/pages/BookOverview";
import { useAppStore } from "@/store/useAppStore";
import { createRoute, redirect } from "@tanstack/react-router";
import { layoutRoute } from "./layout";

export const bookRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/books/$bookId",
  beforeLoad: () => {
    const { isAuthenticated } = useAppStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: BookOverviewPage,
});
