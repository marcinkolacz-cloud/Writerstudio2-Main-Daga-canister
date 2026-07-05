import { AuthClient } from "@icp-sdk/auth/client";
import type { Identity } from "@icp-sdk/core/agent";
import { useCallback, useEffect, useRef, useState } from "react";

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
  /** Open the Internet Identity popup to sign in. Fire-and-forget. */
  login: () => void;
  /** Sign out and reset to anonymous. Fire-and-forget. */
  clear: () => void;
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
 * calling any backend actor method (no `_initialize_access_control`,
 * no `requestAttributes`, no `AttributesIdentity`).
 *
 * The backend canister in this project does not implement the
 * IdentityAttributes mixin, so the original `useInternetIdentity` flow
 * raises an IC0536 error. This hook avoids that by using only the
 * canonical `AuthClient` API.
 */
export function useAuthClient(): UseAuthClientResult {
  // AuthClient is created once and reused across renders.
  const authClientRef = useRef<AuthClient | null>(null);
  if (authClientRef.current === null) {
    // The constructor (not a static `.create()`) is the canonical API in
    // @icp-sdk/auth@7.1.0. Passing an empty options object yields plain II
    // sign-in with no attributes flow.
    authClientRef.current = new AuthClient({});
  }
  const authClient = authClientRef.current;

  const [identity, setIdentity] = useState<Identity | undefined>(undefined);
  const [loginStatus, setLoginStatus] =
    useState<AuthClientStatus>("initializing");
  const [loginError, setLoginError] = useState<Error | undefined>(undefined);

  // Restore any persisted session on mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
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
  }, [authClient]);

  const login = useCallback(() => {
    setLoginStatus("logging-in");
    setLoginError(undefined);
    void authClient
      .signIn({})
      .then((id: Identity) => {
        setIdentity(id);
        setLoginStatus("success");
      })
      .catch((unknownError: unknown) => {
        setLoginError(
          unknownError instanceof Error
            ? unknownError
            : new Error("Login failed"),
        );
        setLoginStatus("loginError");
      });
  }, [authClient]);

  const clear = useCallback(() => {
    void authClient
      .signOut({})
      .then(() => {
        setIdentity(undefined);
        setLoginStatus("idle");
        setLoginError(undefined);
      })
      .catch((unknownError: unknown) => {
        setLoginError(
          unknownError instanceof Error
            ? unknownError
            : new Error("Logout failed"),
        );
        setLoginStatus("loginError");
      });
  }, [authClient]);

  // Derived value — matches the original useInternetIdentity logic.
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return {
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
  };
}
