const tokenByStream: Record<string, string> = {
  brine: "var(--hot)",
  hot_water: "var(--heat)",
  heat: "var(--heat)",
  chilled_water: "var(--cold)",
  electricity: "var(--power)",
  gas: "var(--gas)",
  fuel: "var(--gas)",
};

/** Maps a gemini stream kind to a colour token; kinds without a token use the muted colour. */
export function toStreamColor(stream: string | null | undefined): string {
  if (stream === null || stream === undefined) return "var(--muted)";
  return tokenByStream[stream] ?? "var(--muted)";
}
