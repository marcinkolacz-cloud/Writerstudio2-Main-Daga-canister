import { StatisticsPage } from "@/pages/Statistics";
import { useAppStore } from "@/store/useAppStore";
import { createRoute, redirect } from "@tanstack/react-router";
import { layoutRoute } from "./layout";

export const statisticsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/statistics",
  beforeLoad: () => {
    const { isAuthenticated } = useAppStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: StatisticsPage,
});
