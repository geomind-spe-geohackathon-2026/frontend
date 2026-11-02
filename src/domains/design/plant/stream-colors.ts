import { labelOf } from "@/shared/forms/json-schema";

const tokenByStream: Record<string, string> = {
  brine: "var(--hot)",
  hot_water: "var(--heat)",
  chilled_water: "var(--cold)",
  electricity: "var(--power)",
  gas: "var(--gas)",
  fuel: "var(--gas)",
  heat: "var(--bad)",
  air: "var(--accent)",
  chemical: "var(--ok)",
};

const dashedStreams = new Set(["heat", "air", "waste", "chemical"]);

export const unknownStream = "other";

/** Maps a gemini stream kind to a colour token; kinds without a token use the muted colour. */
export function toStreamColor(stream: string | null | undefined): string {
  if (stream === null || stream === undefined) return "var(--muted)";
  return tokenByStream[stream] ?? "var(--muted)";
}

/** Gives secondary streams such as losses and air a dash, so colour is not the only difference. */
export function toStreamDash(stream: string | null | undefined): string | undefined {
  return stream !== null && stream !== undefined && dashedStreams.has(stream) ? "6 4" : undefined;
}

/** Makes the legend name of a stream kind. */
export function toStreamLabel(stream: string): string {
  return labelOf(stream, {});
}

/** Lists the stream kinds of a plant once each, in first-seen order; unknown ones come last as "other". */
export function toLegendStreams(streams: (string | null)[]): string[] {
  const known = [...new Set(streams.filter((stream) => stream !== null))];
  return streams.includes(null) ? [...known, unknownStream] : known;
}
