import { createActorWithConfig } from "@caffeineai/core-infrastructure";
import type { createActorFunction } from "@caffeineai/core-infrastructure";
import { useEffect, useState } from "react";
import { useAuthClient } from "./useAuthClient";

export interface UseActorLocalResult<T> {
  /** The created actor, or undefined until the async creation resolves. */
  actor: T | undefined;
  /** True while the actor is being (re)created. */
  isFetching: boolean;
}

/**
 * Local replacement for `@caffeineai/core-infrastructure`'s `useActor` that
 * pairs with {@link useAuthClient} instead of `useInternetIdentity`.
 *
 * The actor is (re)created via `createActorWithConfig` whenever the principal
 * changes. If the identity is anonymous or undefined, the actor is still
 * created (matching the original `useActor` behaviour, which does not skip
 * creation for anonymous identities).
 *
 * Call sites use `const { actor } = useActorLocal(createActor)`.
 */
export function useActorLocal<T>(
  createActor: createActorFunction<T>,
): UseActorLocalResult<T> {
  const { identity } = useAuthClient();

  const [actor, setActor] = useState<T | undefined>(undefined);
  const [isFetching, setIsFetching] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    setIsFetching(true);

    void (async () => {
      try {
        // createActorWithConfig is async. Pass the identity (which may be
        // undefined/anonymous) via agentOptions — the helper loads the
        // canister config and forwards these options to createActor.
        const created = await createActorWithConfig<T>(createActor, {
          agentOptions: { identity },
        });
        if (cancelled) return;
        setActor(created);
      } catch (unknownError) {
        if (cancelled) return;
        // Surface the error but keep actor undefined so consumers can
        // fall back gracefully. Re-throw in dev to aid debugging.
        console.error("useActorLocal: failed to create actor", unknownError);
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Recreate the actor whenever the identity (and thus principal) changes.
    // `createActor` is a stable import reference, so it never triggers re-runs.
  }, [createActor, identity]);

  return { actor, isFetching };
}
