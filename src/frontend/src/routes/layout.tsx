import { Layout } from "@/components/Layout";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";

export const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: Layout,
});
