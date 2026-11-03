import { useSyncExternalStore } from "react";

export type MainDialog = "new" | "search" | null;

let current: MainDialog = null;
const listeners = new Set<() => void>();

/** Opens one of the main menu's dialogs (New project or Search) from anywhere, or closes it with null. */
export function openMainDialog(dialog: MainDialog): void {
  current = dialog;
  listeners.forEach((listener) => {
    listener();
  });
}

/** The main menu's dialog that is open now, if any. */
export function useMainDialog(): MainDialog {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}
