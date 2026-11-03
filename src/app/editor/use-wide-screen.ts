import { useSyncExternalStore } from "react";

const wideQuery = "(min-width: 640px)";

function subscribe(onChange: () => void): () => void {
  const list = window.matchMedia(wideQuery);
  if (typeof list.addEventListener !== "function") return () => undefined;
  list.addEventListener("change", onChange);
  return () => {
    list.removeEventListener("change", onChange);
  };
}

/** Whether the screen is wide enough to edit the plant; phones get a read-only canvas. */
export function useWideScreen(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(wideQuery).matches);
}
