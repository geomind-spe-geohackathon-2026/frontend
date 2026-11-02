export type LinearScale = (value: number) => number;

/** Builds a function that maps a value from the domain onto the range; a flat domain maps to the range middle. */
export function toLinearScale(domain: [number, number], range: [number, number]): LinearScale {
  const [domainStart, domainEnd] = domain;
  const [rangeStart, rangeEnd] = range;
  if (domainStart === domainEnd) return () => (rangeStart + rangeEnd) / 2;
  return (value) =>
    rangeStart + ((value - domainStart) / (domainEnd - domainStart)) * (rangeEnd - rangeStart);
}

function toNiceStep(rawStep: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / magnitude;
  if (fraction <= 1) return magnitude;
  if (fraction <= 2) return 2 * magnitude;
  if (fraction <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

/** Returns round tick values that cover the interval, about `count` of them. */
export function toNiceTicks(min: number, max: number, count: number): number[] {
  if (min === max) return [min];
  const step = toNiceStep((max - min) / count);
  const first = Math.floor(min / step);
  const last = Math.ceil(max / step);
  const ticks: number[] = [];
  for (let index = first; index <= last; index += 1) ticks.push(Number((index * step).toFixed(10)));
  return ticks;
}

/** Widens an interval by a fraction on both sides so marks do not sit on the frame; a flat interval gets one unit. */
export function toPaddedDomain(min: number, max: number, fraction: number): [number, number] {
  if (min === max) return [min - 1, max + 1];
  const pad = (max - min) * fraction;
  return [min - pad, max + pad];
}
