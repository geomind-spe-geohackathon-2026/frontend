/** Formats an ISO time for tables: medium date and short time, English. */
export function toDisplayTime(iso: string): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}
