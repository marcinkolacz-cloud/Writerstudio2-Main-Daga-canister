import { LoginPage } from "@/pages/Login";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});
