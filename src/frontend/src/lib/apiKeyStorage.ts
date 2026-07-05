import type { Principal } from "@icp-sdk/core/principal";

export type ApiProvider = "openai" | "claude";

const LEGACY_GLOBAL_KEYS: Record<ApiProvider, string> = {
  openai: "ws_api_key_openai",
  claude: "ws_api_key_claude",
};

/**
 * Build the per-Principal namespaced localStorage key for a given provider.
 * When principal is null (not signed in), falls back to the legacy global
 * key name so the UI does not crash and existing sessions keep working.
 */
function namespacedKey(
  provider: ApiProvider,
  principal: Principal | null,
): string {
  if (!principal) return LEGACY_GLOBAL_KEYS[provider];
  return `${LEGACY_GLOBAL_KEYS[provider]}_${principal.toText()}`;
}

/**
 * Read an API key for the given provider, namespaced by the signed-in
 * Principal. On first read after sign-in, transparently migrates the
 * legacy global key value into the namespaced key (without deleting the
 * old key, so other sessions remain unaffected). When principal is null,
 * reads the legacy global key directly.
 */
export function getApiKey(
  provider: ApiProvider,
  principal: Principal | null,
): string {
  const key = namespacedKey(provider, principal);
  const value = localStorage.getItem(key);
  if (value !== null) return value;

  // Migration: if namespaced key is missing but legacy global key exists,
  // copy it over so subsequent reads are namespaced. Leave the old key in
  // place for other sessions.
  if (principal) {
    const legacyValue = localStorage.getItem(LEGACY_GLOBAL_KEYS[provider]);
    if (legacyValue !== null) {
      localStorage.setItem(key, legacyValue);
      return legacyValue;
    }
  }

  return "";
}

/**
 * Persist an API key for the given provider, namespaced by the signed-in
 * Principal. When principal is null, writes to the legacy global key.
 */
export function setApiKey(
  provider: ApiProvider,
  principal: Principal | null,
  value: string,
): void {
  localStorage.setItem(namespacedKey(provider, principal), value);
}

/**
 * Remove the API key for the given provider, namespaced by the signed-in
 * Principal. When principal is null, removes the legacy global key.
 */
export function clearApiKey(
  provider: ApiProvider,
  principal: Principal | null,
): void {
  localStorage.removeItem(namespacedKey(provider, principal));
}
