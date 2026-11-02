import { isRecord } from "@/shared/forms/json-schema";

const scopes: Record<string, string> = {
  each: "Each",
  sum: "The sum over all",
  mean: "The mean over all",
  max: "The highest",
  min: "The lowest",
};

function toWords(value: unknown): string {
  return typeof value === "string" ? value.replaceAll("_", " ") : "";
}

function toLimit(item: Record<string, unknown>): string {
  const unit = typeof item.unit === "string" ? ` ${item.unit}` : "";
  const { min, max } = item;
  if (typeof min === "number" && typeof max === "number") {
    return `between ${String(min)} and ${String(max)}${unit}`;
  }
  if (typeof min === "number") return `at least ${String(min)}${unit}`;
  return typeof max === "number" ? `at most ${String(max)}${unit}` : "no limit set";
}

/** Writes a requirement of the case as a sentence, or nothing for another list item. */
export function toRequirementText(item: unknown): string | null {
  if (!isRecord(item) || item.quantity === undefined || item.on === undefined) return null;
  const over = typeof item.over === "string" ? item.over : "each";
  const when = item.when === "running" ? ", while running" : "";
  const measure = over === "duration" ? "running duration" : toWords(item.quantity);
  const scope = scopes[over] ?? "Each";
  return `${scope} ${toWords(item.on)}${when}: ${measure} ${toLimit(item)}`;
}
