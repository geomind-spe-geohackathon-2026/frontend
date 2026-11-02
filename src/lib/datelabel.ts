const clock = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: false });
const monthDay = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const full = new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" });

function isSameDay(left: Date, right: Date): boolean {
  return left.toDateString() === right.toDateString();
}

/** Labels a UTC ISO time for lists: the clock time today, the month and day this year, else the full date. */
export function toDateLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (isSameDay(date, now)) return clock.format(date);
  if (date.getFullYear() === now.getFullYear()) return monthDay.format(date);
  return full.format(date);
}

/** Labels a UTC ISO time with its clock time, and with the date unless it is today. */
export function toDateTimeLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const time = clock.format(date);
  if (isSameDay(date, now)) return time;
  const day = date.getFullYear() === now.getFullYear() ? monthDay.format(date) : full.format(date);
  return `${day}, ${time}`;
}
