import { AccessGatePage } from "@/pages/AccessGatePage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
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
    bookRoute,
    chapterRoute,
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

function getAccessGranted() {
  return localStorage.getItem("ws_access_granted") === "true";
}

function subscribeAccess(callback: () => void) {
  const handler = () => callback();
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  const accessGranted = useSyncExternalStore(
    subscribeAccess,
    getAccessGranted,
    getAccessGranted,
  );

  if (!accessGranted) {
    return (
      <QueryClientProvider client={queryClient}>
        <AccessGatePage />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
