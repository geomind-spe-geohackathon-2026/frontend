import { setupWorker } from "msw/browser";
import { createHandlers } from "./handlers";

/** Starts the in-browser mock API; used only by the development server. */
export async function startMocking(): Promise<void> {
  await setupWorker(...createHandlers()).start({ onUnhandledFrame: "bypass" });
}
