import { useSyncExternalStore } from "react";

export type Theme = "system" | "light" | "dark";

const storageKey = "geomind.theme";
const listeners = new Set<() => void>();

function isTheme(value: unknown): value is Theme {
  return value === "system" || value === "light" || value === "dark";
}

function toTheme(): Theme {
  const stored = window.localStorage.getItem(storageKey);
  return isTheme(stored) ? stored : "system";
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

/** Applies the remembered theme to the page; call once before the first render. */
export function startTheme(): void {
  applyTheme(toTheme());
}

/** Remembers and applies a theme: system follows the operating system. */
export function setTheme(theme: Theme): void {
  window.localStorage.setItem(storageKey, theme);
  applyTheme(theme);
  listeners.forEach((listener) => {
    listener();
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current theme choice and its setter. */
export function useTheme(): [Theme, (theme: Theme) => void] {
  return [useSyncExternalStore(subscribe, toTheme), setTheme];
}
