import { humanise } from "@/shared/quantity/figure";

/** A module's name for reading: a doublet by its number, others in plain words. */
export function toModuleName(id: string): string {
  const doublet = /^d(\d+)$/.exec(id)?.[1];
  return doublet === undefined ? humanise(id) : `Doublet ${String(Number(doublet) + 1)}`;
}

/** A check's title; a share of demand left unserved reads as what was not delivered. */
export function toCheckTitle(title: string): string {
  return title.replace(/^(Heat|Cold) delivered$/, "$1 not delivered");
}
