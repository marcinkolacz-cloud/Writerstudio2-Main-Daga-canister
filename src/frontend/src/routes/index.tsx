import { useAppStore } from "@/store/useAppStore";
import { createRoute, redirect } from "@tanstack/react-router";
import { rootRoute } from "./root";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: async () => {
    const { isAuthenticated } = useAppStore.getState();
    throw redirect({ to: isAuthenticated ? "/dashboard" : "/login" });
  },
});
