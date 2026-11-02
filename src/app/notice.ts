/** Reads the one-line message that a redirect passes to the next page in the router state. */
export function toNotice(state: unknown): string | null {
  if (typeof state !== "object" || state === null) return null;
  if (!("notice" in state) || typeof state.notice !== "string") return null;
  return state.notice;
}
