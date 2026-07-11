import { AuthClient } from "@icp-sdk/auth/client";
import type { Identity } from "@icp-sdk/core/agent";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AuthClientStatus,
  UseAuthClientResult,
} from "../hooks/useAuthClient";

/**
 * Window features passed to the II popup window opened by `AuthClient.signIn`.
 * Kept identical to the original `useAuthClient` implementation so the popup
 * behaviour is unchanged.
 */
const WINDOW_OPENER_FEATURES =
  "toolbar=0,location=0,menubar=0,width=500,height=500,left=100,top=100";

/**
 * Resolve the Internet Identity provider URL based on the current environment.
 *
 * Local development (localhost / 127.0.0.1 / *.localhost) uses the local II
 * canister exposed by `dfx start` at `http://id.ai.localhost:8000/authorize`.
 * Any other host (staging, production, deployed canisters) uses the public
 * `https://id.ai#authorize` endpoint.
 */
function getIdentityProvider(): string {
  const hostname =
    typeof window !== "undefined" && window.location
      ? window.location.hostname
      : "";
  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost");
  return isLocal
    ? "http://id.ai.localhost:8000/authorize"
    : "https://id.ai#authorize";
}

/**
 * Construct a fresh `AuthClient` configured exactly like the original
 * `useAuthClient` did — same identityProvider, windowOpenerFeatures, and
 * derivationOrigin. Centralised here so both the initial creation and the
 * post-signOut replacement build identical clients.
 */
function createAuthClient(): AuthClient {
  return new AuthClient({
    identityProvider: getIdentityProvider(),
    windowOpenerFeatures: WINDOW_OPENER_FEATURES,
    derivationOrigin: window.location.origin,
    idleOptions: { idleTimeout: 60 * 60 * 1000 },
  });
}

/**
 * Shape exposed by the single shared AuthProvider. Mirrors
 * {@link UseAuthClientResult} (so `useAuthClient` can delegate to it without
 * reshaping) and adds the raw `authClient` for advanced consumers.
 */
export interface AuthContextValue extends UseAuthClientResult {
  /** The single shared AuthClient instance owned by the provider. */
  authClient: AuthClient;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Read the shared auth state. Throws a clear error if used outside
 * {@link AuthProvider} so misuse fails loudly instead of silently returning
 * undefined.
 */
export function useAuthContext(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error(
      "useAuthContext must be used within an AuthProvider. Wrap your app with <AuthProvider>.",
    );
  }
  return value;
}

/**
 * Single source of truth for Internet Identity auth.
 *
 * Creates exactly ONE `AuthClient` (held in a ref) and shares its identity,
 * login, and clear handlers with every consumer via context. The mount-time
 * session restore (`isAuthenticated()` + `getIdentity()`) runs once here, so
 * the ~40 `useBackend` hooks and `RecordingsPanel` no longer each spawn their
 * own `AuthClient` and independently restore the session.
 *
 * `clear()` preserves the original "create a FRESH AuthClient after signOut"
 * behaviour to drop the stale II IndexedDB session — the shared client is
 * atomically replaced in the ref and all consumers see the new client on the
 * next render via the `authClient` state bump.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // The single shared AuthClient. Held in a ref so it is stable across
  // renders, plus a state counter to force consumers to re-read after clear()
  // replaces the client.
  const authClientRef = useRef<AuthClient>(createAuthClient());
  const [authClientVersion, setAuthClientVersion] = useState(0);
  const authClient = authClientRef.current;

  const [identity, setIdentity] = useState<Identity | undefined>(undefined);
  const [loginStatus, setLoginStatus] =
    useState<AuthClientStatus>("initializing");
  const [loginError, setLoginError] = useState<Error | undefined>(undefined);

  // Restore any persisted session once on mount (and whenever the shared
  // client is replaced after clear()). This is the single session-restore
  // for the whole app. `authClientVersion` is read here so the linter sees
  // it used and so re-running against a freshly replaced client is explicit.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Touch authClientVersion so the dependency is genuinely used; the
      // value itself is not needed — only the re-run on bump matters.
      void authClientVersion;
      try {
        setLoginStatus("initializing");
        // isAuthenticated() is synchronous in v7.1.0; getIdentity() is async.
        const authed = authClient.isAuthenticated();
        if (authed) {
          const id = await authClient.getIdentity();
          if (cancelled) return;
          setIdentity(id);
        } else {
          if (cancelled) return;
          setIdentity(undefined);
        }
        if (!cancelled) setLoginStatus("idle");
      } catch (unknownError) {
        if (cancelled) return;
        setIdentity(undefined);
        setLoginError(
          unknownError instanceof Error
            ? unknownError
            : new Error("Auth initialization failed"),
        );
        setLoginStatus("loginError");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authClient, authClientVersion]);

  const login = useCallback(async (): Promise<void> => {
    setLoginStatus("logging-in");
    setLoginError(undefined);
    try {
      const id: Identity = await authClient.signIn({});
      setIdentity(id);
      setLoginStatus("success");
    } catch (unknownError: unknown) {
      setLoginError(
        unknownError instanceof Error
          ? unknownError
          : new Error("Login failed"),
      );
      setLoginStatus("loginError");
    }
  }, [authClient]);

  const clear = useCallback(async (): Promise<void> => {
    try {
      // Await full sign-out so the II IndexedDB session is torn down before
      // we drop the reference to the old AuthClient.
      await authClient.signOut({});
    } catch (unknownError: unknown) {
      setLoginError(
        unknownError instanceof Error
          ? unknownError
          : new Error("Logout failed"),
      );
      setLoginStatus("loginError");
      return;
    }
    // Reset state to reflect the now-anonymous identity.
    setIdentity(undefined);
    setLoginStatus("idle");
    setLoginError(undefined);
    // Create a FRESH AuthClient instance so the stale II IndexedDB session
    // attached to the previous client is dropped before the next signIn.
    // Atomically replace the shared client and bump the version so the
    // mount-restore effect re-runs against the new client and every consumer
    // sees the new reference.
    authClientRef.current = createAuthClient();
    setAuthClientVersion((v) => v + 1);
  }, [authClient]);

  // Derived value — matches the original useInternetIdentity / useAuthClient
  // logic.
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const value = useMemo<AuthContextValue>(
    () => ({
      authClient,
      identity,
      login,
      clear,
      isAuthenticated,
      isInitializing: loginStatus === "initializing",
      isLoggingIn: loginStatus === "logging-in",
      isLoginIdle: loginStatus === "idle",
      isLoginSuccess: loginStatus === "success",
      isLoginError: loginStatus === "loginError",
      loginStatus,
      loginError,
    }),
    [
      authClient,
      identity,
      login,
      clear,
      isAuthenticated,
      loginStatus,
      loginError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
