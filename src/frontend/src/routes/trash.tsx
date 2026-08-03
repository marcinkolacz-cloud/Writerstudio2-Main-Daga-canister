import { TrashPage } from "@/pages/Trash";
import { useAppStore } from "@/store/useAppStore";
import { createRoute, redirect } from "@tanstack/react-router";
import { layoutRoute } from "./layout";

export const trashRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/trash",
  beforeLoad: () => {
    const { isAuthenticated } = useAppStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: TrashPage,
});
