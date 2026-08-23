import { HelpPage } from "@/pages/Help";
import { useAppStore } from "@/store/useAppStore";
import { createRoute, redirect } from "@tanstack/react-router";
import { layoutRoute } from "./layout";

export const helpRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/help",
  beforeLoad: () => {
    const { isAuthenticated } = useAppStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: HelpPage,
});
