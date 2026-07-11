import { AccessGatePage } from "@/pages/AccessGatePage";
import { useAuthContext } from "@/providers/AuthProvider";
import { useAppStore } from "@/store/useAppStore";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
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

function AuthGate({ children }: { children: ReactNode }) {
  const { identity, isInitializing } = useAuthContext();
  const setPrincipal = useAppStore((s) => s.setPrincipal);
  const clearAuth = useAppStore((s) => s.clearAuth);

  useEffect(() => {
    if (identity && !identity.getPrincipal().isAnonymous()) {
      setPrincipal(identity.getPrincipal());
    } else {
      clearAuth();
    }
  }, [identity, setPrincipal, clearAuth]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        Sprawdzanie sesji...
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const accessGranted = useSyncExternalStore(
    subscribeAccess,
    getAccessGranted,
    getAccessGranted,
  );

  if (!accessGranted) {
    return (
      <AuthGate>
        <AccessGatePage />
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <RouterProvider router={router} />
    </AuthGate>
  );
}
