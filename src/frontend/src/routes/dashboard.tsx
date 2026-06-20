import { DashboardPage } from "@/pages/Dashboard";
import { createRoute } from "@tanstack/react-router";
import { layoutRoute } from "./layout";

export const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/dashboard",
  component: DashboardPage,
});
