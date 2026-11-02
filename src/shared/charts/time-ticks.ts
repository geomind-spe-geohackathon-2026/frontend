const day = 86_400_000;

export type TimeTick = { time: number; label: string };

const month = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });
const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });
const hour = new Intl.DateTimeFormat("en", { hour: "2-digit", hourCycle: "h23", timeZone: "UTC" });

function monthTicks(start: number, end: number, every: number): TimeTick[] {
  const first = new Date(start);
  const ticks: TimeTick[] = [];
  let year = first.getUTCFullYear();
  let index = first.getUTCMonth() + (first.getUTCDate() > 1 ? 1 : 0);
  for (;;) {
    const time = Date.UTC(year, index);
    if (time > end) return ticks;
    if (index % every === 0) {
      const label = every >= 12 ? String(new Date(time).getUTCFullYear()) : month.format(time);
      ticks.push({ time, label });
    }
    index += 1;
    if (index === 12) {
      index = 0;
      year += 1;
    }
  }
}

function stepTicks(start: number, end: number, step: number, label: Intl.DateTimeFormat) {
  const ticks: TimeTick[] = [];
  for (let time = Math.ceil(start / step) * step; time <= end; time += step) {
    ticks.push({ time, label: label.format(time) });
  }
  return ticks;
}

/** Chooses ticks for a time span: hours, days, weeks, months or years. */
export function toTimeTicks(start: number, end: number): TimeTick[] {
  const span = end - start;
  if (span > 800 * day) return monthTicks(start, end, 12);
  if (span > 100 * day) return monthTicks(start, end, span > 500 * day ? 3 : 1);
  if (span > 20 * day) return stepTicks(start, end, 7 * day, date);
  if (span > 3 * day) return stepTicks(start, end, day, date);
  return stepTicks(start, end, Math.max(span / 6, 3_600_000), hour);
}

const prefixes: [number, string][] = [
  [1e6, "T"],
  [1e3, "G"],
  [1, "M"],
];

function energyFromMega(megaHours: number): string {
  const [scale, prefix] = prefixes.find(([limit]) => megaHours >= limit) ?? [1, "M"];
  const figure = new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(
    megaHours / scale,
  );
  return `${figure} ${prefix}Wh`;
}

const powerToMega: Record<string, number> = { W: 1e-6, kW: 1e-3, MW: 1, GW: 1e3 };

/** Writes the energy of a power series summed at its step; another unit has none. */
export function toEnergy(sum: number, unit: string): string | null {
  const scale = powerToMega[unit];
  return scale === undefined ? null : energyFromMega(sum * scale);
}
