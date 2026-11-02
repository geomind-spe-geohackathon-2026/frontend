import { useSyncExternalStore } from "react";

export type Tokens = { accessToken: string; refreshToken: string };

const storageKey = "geomind.session";
const listeners = new Set<() => void>();

function isTokens(value: unknown): value is Tokens {
  if (typeof value !== "object" || value === null) return false;
  return (
    "accessToken" in value &&
    typeof value.accessToken === "string" &&
    "refreshToken" in value &&
    typeof value.refreshToken === "string"
  );
}

function fromStorage(): Tokens | null {
  const raw = window.localStorage.getItem(storageKey);
  if (raw === null) return null;
  const value: unknown = JSON.parse(raw);
  return isTokens(value) ? value : null;
}

let current: Tokens | null = null;
let loaded = false;

function notify(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

/** Holds the bearer tokens in memory and in local storage so a reload keeps the session. */
export const session = {
  get(): Tokens | null {
    if (!loaded) {
      current = fromStorage();
      loaded = true;
    }
    return current;
  },
  set(tokens: Tokens): void {
    current = tokens;
    loaded = true;
    window.localStorage.setItem(storageKey, JSON.stringify(tokens));
    notify();
  },
  clear(): void {
    current = null;
    loaded = true;
    window.localStorage.removeItem(storageKey);
    notify();
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** Re-renders when the session changes and returns the current tokens, or null when signed out. */
export function useSession(): Tokens | null {
  return useSyncExternalStore(
    (listener) => session.subscribe(listener),
    () => session.get(),
  );
}
