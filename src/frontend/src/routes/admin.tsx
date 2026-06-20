import { AdminPage } from "@/pages/Admin";
import { createRoute } from "@tanstack/react-router";
import { layoutRoute } from "./layout";

export const adminRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/admin",
  component: AdminPage,
});
