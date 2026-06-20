import { StatisticsPage } from "@/pages/Statistics";
import { createRoute } from "@tanstack/react-router";
import { layoutRoute } from "./layout";

export const statisticsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/statistics",
  component: StatisticsPage,
});
