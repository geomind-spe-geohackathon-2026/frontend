const shortLength = 8;

/** Shortens a run or chat id to its first eight hex characters, without dashes. */
export function toShortId(id: string): string {
  return id.replaceAll("-", "").slice(0, shortLength);
}
