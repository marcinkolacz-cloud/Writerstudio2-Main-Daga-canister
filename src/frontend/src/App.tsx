import { RouterProvider, createRouter } from "@tanstack/react-router";
import { adminRoute } from "./routes/admin";
import { bookRoute } from "./routes/book";
import { chapterRoute } from "./routes/chapter";
import { dashboardRoute } from "./routes/dashboard";
import { indexRoute } from "./routes/index";
import { layoutRoute } from "./routes/layout";
import { loginRoute } from "./routes/login";
import { rootRoute } from "./routes/root";
import { statisticsRoute } from "./routes/statistics";

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  layoutRoute.addChildren([
    dashboardRoute,
    bookRoute.addChildren([chapterRoute]),
    statisticsRoute,
    adminRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
