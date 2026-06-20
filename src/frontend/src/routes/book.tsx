import { BookOverviewPage } from "@/pages/BookOverview";
import { createRoute } from "@tanstack/react-router";
import { layoutRoute } from "./layout";

export const bookRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/books/$bookId",
  component: BookOverviewPage,
});
