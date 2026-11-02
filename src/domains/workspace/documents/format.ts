const units = ["B", "KB", "MB", "GB"];
const step = 1024;

/** Formats a byte count with a binary unit, for example 2.1 MB. */
export function toSizeLabel(bytes: number): string {
  let value = bytes;
  let index = 0;
  while (value >= step && index < units.length - 1) {
    value /= step;
    index += 1;
  }
  const digits = index === 0 ? 0 : 1;
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: digits }).format(value)} ${units[index] ?? "B"}`;
}
