import { AccessGatePage } from "@/pages/AccessGatePage";
import { useAuthContext } from "@/providers/AuthProvider";
import { useHasBookAccess } from "@/hooks/useBackend";
import { useAppStore } from "@/store/useAppStore";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { adminRoute } from "./routes/admin";
import { bookRoute } from "./routes/book";
import { chapterRoute } from "./routes/chapter";
import { dashboardRoute } from "./routes/dashboard";
import { helpRoute } from "./routes/help";
import { indexRoute } from "./routes/index";
import { layoutRoute } from "./routes/layout";
import { loginRoute } from "./routes/login";
import { rootRoute } from "./routes/root";
import { statisticsRoute } from "./routes/statistics";
import { trashRoute } from "./routes/trash";

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  layoutRoute.addChildren([
    dashboardRoute,
    bookRoute,
    chapterRoute,
    statisticsRoute,
    adminRoute,
    trashRoute,
    helpRoute,
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

function AccessCheck({ children }: { children: ReactNode }) {
  const localAccessGranted = useSyncExternalStore(
    subscribeAccess,
    getAccessGranted,
    getAccessGranted,
  );
  const { identity, isInitializing } = useAuthContext();
  const hasIdentity = !!identity && !identity.getPrincipal().isAnonymous();

  // Backend fallback: this browser never locally recorded
  // ws_access_granted (fresh profile, cleared storage, identity switch,
  // etc.), but the authenticated principal may already own books from a
  // prior session elsewhere. Without this check such a principal gets
  // stuck on the invite-code screen despite having real access.
  const { data: hasBookAccess, isLoading: isCheckingBooks } =
    useHasBookAccess(!localAccessGranted && hasIdentity && !isInitializing);

  useEffect(() => {
    if (hasBookAccess) {
      localStorage.setItem("ws_access_granted", "true");
      window.dispatchEvent(new Event("storage"));
    }
  }, [hasBookAccess]);

  if (localAccessGranted || hasBookAccess) {
    return <>{children}</>;
  }

  if (!isInitializing && hasIdentity && isCheckingBooks) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        Sprawdzanie dostępu...
      </div>
    );
  }

  return <AccessGatePage />;
}

export default function App() {
  return (
    <AuthGate>
      <AccessCheck>
        <RouterProvider router={router} />
      </AccessCheck>
    </AuthGate>
  );
}
