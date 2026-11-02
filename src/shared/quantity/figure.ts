const thousand = 1000;

/** Writes a figure with about three significant digits and thousand separators. */
export function formatFigure(value: number): string {
  const options =
    Math.abs(value) >= thousand ? { maximumFractionDigits: 0 } : { maximumSignificantDigits: 3 };
  return new Intl.NumberFormat("en", options).format(value);
}

/** Turns a raw name into a sentence-case label: underscores become spaces, the first letter is capitalised. */
export function humanise(name: string): string {
  const spaced = name.replaceAll("_", " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
