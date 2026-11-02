import { useSyncExternalStore } from "react";

type Toast = { id: number; text: string };

const lifetimeMs = 4000;
const listeners = new Set<() => void>();
let toasts: Toast[] = [];
let nextId = 1;

function emit(next: Toast[]): void {
  toasts = next;
  listeners.forEach((listener) => {
    listener();
  });
}

/** Shows a short message at the bottom of the screen for a few seconds. */
export function showToast(text: string): void {
  const id = nextId++;
  emit([...toasts, { id, text }]);
  setTimeout(() => {
    emit(toasts.filter((toast) => toast.id !== id));
  }, lifetimeMs);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The live region that displays toasts; mount once in the providers. */
export function Toaster() {
  const current = useSyncExternalStore(subscribe, () => toasts);
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-[18px] left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2"
    >
      {current.map((toast) => (
        <div
          key={toast.id}
          className="rounded-card bg-text px-3.5 py-2 text-[13px] text-surface shadow-float"
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
}
