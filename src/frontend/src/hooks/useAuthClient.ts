import type { Identity } from "@icp-sdk/core/agent";
import { useAuthContext } from "../providers/AuthProvider";

/**
 * Login status for the {@link useAuthClient} hook.
 *
 * Mirrors the `Status` type exported by `@caffeineai/core-infrastructure`'s
 * `useInternetIdentity` so call sites can swap hooks without changing their
 * status comparisons.
 */
export type AuthClientStatus =
  | "initializing"
  | "idle"
  | "logging-in"
  | "success"
  | "loginError";

export interface UseAuthClientResult {
  /** The identity is available after a restored session or a successful login. */
  identity?: Identity;
  /** Open the Internet Identity popup to sign in. Resolves once sign-in completes. */
  login: () => Promise<void>;
  /** Sign out, drop the stale II IndexedDB session, and reset to anonymous. Resolves once teardown completes. */
  clear: () => Promise<void>;
  /** `true` when the user holds a valid, non-anonymous identity. */
  isAuthenticated: boolean;
  /** `loginStatus === "initializing"` */
  isInitializing: boolean;
  /** `loginStatus === "logging-in"` */
  isLoggingIn: boolean;
  /** `loginStatus === "idle"` */
  isLoginIdle: boolean;
  /** `loginStatus === "success"` */
  isLoginSuccess: boolean;
  /** `loginStatus === "loginError"` */
  isLoginError: boolean;
  /** The current login status. */
  loginStatus: AuthClientStatus;
  /** The error from the last failed login, if any. */
  loginError?: Error;
}

/**
 * Drop-in replacement for `useInternetIdentity` that performs a plain
 * Internet Identity sign-in via `@icp-sdk/auth`'s `AuthClient` WITHOUT
 * calling any backend actor method.
 *
 * This hook NO LONGER creates its own `AuthClient`. It delegates to the
 * single shared {@link AuthProvider} context, so every consumer reads from
 * the same `AuthClient` instance and the same restored identity. The
 * {@link UseAuthClientResult} shape is preserved exactly so existing call
 * sites (Layout.tsx, Login.tsx, AccessGatePage.tsx) require no changes.
 */
export function useAuthClient(): UseAuthClientResult {
  const {
    identity,
    login,
    clear,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isLoginIdle,
    isLoginSuccess,
    isLoginError,
    loginStatus,
    loginError,
  } = useAuthContext();

  return {
    identity,
    login,
    clear,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isLoginIdle,
    isLoginSuccess,
    isLoginError,
    loginStatus,
    loginError,
  };
}
