import { isRecord } from "@/shared/forms/json-schema";

export type Alternative = {
  family: string;
  verdict: string;
  reason: string | null;
  result: string | null;
  isRecommended: boolean;
  rank: number | null;
};

export type Alternatives = { by: string | null; items: Alternative[] };

function toText(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (isRecord(value) && typeof value.id === "string") return value.id;
  if (isRecord(value) && typeof value.name === "string") return value.name;
  return null;
}

function toNames(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => toText(entry)).filter((entry) => entry !== null)
    : [];
}

function toAlternative(value: unknown, ranking: string[], recommended: string | null) {
  if (!isRecord(value) || typeof value.family !== "string") return null;
  const names = [value.family, toText(value.design)].filter((name) => name !== null);
  const index = ranking.findIndex((name) => names.includes(name));
  return {
    family: value.family,
    verdict: typeof value.verdict === "string" ? value.verdict : "unknown",
    reason: typeof value.reason === "string" && value.reason !== "" ? value.reason : null,
    result: toText(value.result),
    isRecommended: recommended !== null && names.includes(recommended),
    rank: index === -1 ? null : index + 1,
  };
}

/** Reads design.alternatives and design.comparison from a chat's problem state; null when there are none. */
export function toAlternatives(document: unknown): Alternatives | null {
  const design = isRecord(document) ? document.design : undefined;
  if (!isRecord(design) || !Array.isArray(design.alternatives)) return null;
  const comparison = isRecord(design.comparison) ? design.comparison : {};
  const ranking = toNames(comparison.ranking);
  const recommended = toText(comparison.recommended);
  const items = design.alternatives
    .map((entry) => toAlternative(entry, ranking, recommended))
    .filter((entry) => entry !== null);
  if (items.length === 0) return null;
  items.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
  return { by: toText(comparison.by), items };
}
