export type DaySource = "geothermal" | "backup" | "short";
type Energy = { value: number; unit: string };
export type Day = {
  date: string;
  source: DaySource;
  demand?: Energy;
  geothermal?: Energy;
  backup?: Energy;
  short?: Energy;
};

type Props = { days: Day[]; title: string; mainLabel?: string };

const cell = 12;
const gap = 2;
const pitch = cell + gap;
type Shown = DaySource | "partly";

const sources: { source: Shown; label: string; fill: string }[] = [
  { source: "geothermal", label: "Geothermal", fill: "var(--ok)" },
  { source: "backup", label: "Backup", fill: "var(--gas)" },
  { source: "partly", label: "Partly short", fill: "var(--warn)" },
  { source: "short", label: "Short", fill: "var(--bad)" },
];

const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 });

function toUnmetShare(day: Day): number | null {
  if (day.short === undefined || day.demand === undefined || day.demand.value <= 0) return null;
  return Math.min(1, Math.max(0, day.short.value / day.demand.value));
}

function toShown(day: Day): Shown {
  if (day.source !== "short") return day.source;
  const share = toUnmetShare(day);
  return share !== null && share < 0.999 ? "partly" : "short";
}

function toMeanShare(days: Day[]): string {
  const shares = days.map(toUnmetShare).filter((share): share is number => share !== null);
  if (shares.length === 0) return "";
  const mean = shares.reduce((sum, share) => sum + share, 0) / shares.length;
  return `, ${percent.format(mean)} unmet on average`;
}

function toDayNumber(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

function toPosition(date: string, firstDay: number): { x: number; y: number } {
  const dayNumber = toDayNumber(date);
  const weekday = new Date(dayNumber * 86_400_000).getUTCDay();
  const firstWeekday = new Date(firstDay * 86_400_000).getUTCDay();
  const week = Math.floor((dayNumber - firstDay + firstWeekday) / 7);
  return { x: week * pitch, y: weekday * pitch };
}

function toEnergy(label: string, energy: Energy | undefined): string[] {
  if (energy === undefined) return [];
  return [`${label} ${energy.value.toFixed(1)} ${energy.unit}`];
}

function toDayTitle(day: Day): string {
  const parts = [
    ...toEnergy("demand", day.demand),
    ...toEnergy("geothermal", day.geothermal),
    ...toEnergy("backup", day.backup),
    ...toEnergy("short", day.short),
  ];
  const share = toUnmetShare(day);
  const shown = toShown(day);
  const head =
    shown === "partly" && share !== null
      ? `${day.date}: partly short, ${percent.format(share)} of the demand unmet`
      : `${day.date}: ${day.source}`;
  return [head, ...parts].join(", ");
}

/** One cell per day, coloured by the source that covers it (a short day that got part of its demand is "partly short", with its unmet share), with a legend, day counts and the shortness rule as text. */
export function DaysStrip({ days, title, mainLabel }: Props) {
  const first = days[0];
  if (first === undefined) return null;
  const firstDay = toDayNumber(first.date);
  const last = toPosition(days[days.length - 1]?.date ?? first.date, firstDay);
  const width = last.x + cell;
  const counts = sources.map((entry) => ({
    ...entry,
    label: entry.source === "geothermal" ? (mainLabel ?? entry.label) : entry.label,
    count: days.filter((day) => toShown(day) === entry.source).length,
    extra: entry.source === "partly" ? toMeanShare(days.filter((day) => toShown(day) === "partly")) : "",
  }));
  const summary = counts.map((entry) => `${entry.label} ${String(entry.count)} days`).join(", ");
  return (
    <figure className="m-0">
      <svg
        role="img"
        aria-label={`${title}: ${summary}`}
        viewBox={`0 0 ${String(width)} ${String(7 * pitch - gap)}`}
        className="w-full max-w-[860px]"
      >
        <title>{title}</title>
        {days.map((day) => {
          const { x, y } = toPosition(day.date, firstDay);
          const fill = sources.find((entry) => entry.source === toShown(day))?.fill ?? "var(--gas)";
          return (
            <rect key={day.date} x={x} y={y} width={cell} height={cell} rx={2} fill={fill}>
              <title>{toDayTitle(day)}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted">
        {counts.map((entry) => (
          <span key={entry.source} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block size-3 rounded-[2px]"
              style={{ background: entry.fill }}
            />
            {entry.label}: {entry.count} days
            {entry.extra}
          </span>
        ))}
        <span className="basis-full">
          A day counts as short when any of its demand is unmet; partly short days got part of it
          (hover a day for the unmet share), short days got none.
        </span>
      </figcaption>
    </figure>
  );
}
