import { AdminPage } from "@/pages/Admin";
import { useAppStore } from "@/store/useAppStore";
import { createRoute, redirect } from "@tanstack/react-router";
import { layoutRoute } from "./layout";

export const adminRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/admin",
  beforeLoad: () => {
    const { isAuthenticated } = useAppStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminPage,
});
