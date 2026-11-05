import { useId } from "react";

export type DaySource = "geothermal" | "backup" | "short";
type Energy = { value: number; unit: string };
export type Day = {
  date: string;
  source: DaySource;
  demand?: Energy;
  geothermal?: Energy;
  electricity?: Energy;
  backup?: Energy;
  short?: Energy;
  labels?: { main?: string; other?: string | null };
  no_demand?: boolean;
};

/** The names of a service's two sources when its days carry no labels. */
export type SourceNames = { main: string; other: string | null };

type Props = { days: Day[]; title: string; fallback?: SourceNames };

const heatingNames: SourceNames = { main: "Geothermal", other: "Backup" };

const cell = 12;
const gap = 2;
const pitch = cell + gap;
type Shown = "none" | "geothermal" | "electric" | "topped" | "backup" | "partly" | "short";

const toppedSwatch = "repeating-linear-gradient(135deg, var(--ok) 0 3px, var(--gas) 3px 5px)";

const sources: {
  source: Shown;
  label: (names: SourceNames) => string;
  fill: string;
  swatch?: string;
}[] = [
  { source: "geothermal", label: ({ main }) => `${main} only`, fill: "var(--ok)" },
  {
    source: "electric",
    label: ({ main }) => `${main} with heat-pump electricity`,
    fill: "var(--power)",
  },
  {
    source: "topped",
    label: ({ main, other }) => `${main} topped up by ${toLower(other)}`,
    fill: "var(--ok)",
    swatch: toppedSwatch,
  },
  {
    source: "backup",
    label: ({ other }) => `${other ?? "Other source"} only`,
    fill: "var(--gas)",
  },
  { source: "partly", label: () => "Partly short", fill: "var(--warn)" },
  { source: "short", label: () => "Short", fill: "var(--bad)" },
  { source: "none", label: () => "No demand", fill: "var(--border)" },
];

function toLower(name: string | null): string {
  if (name === null) return "other source";
  return name.length > 1 && name[1] === name[1]?.toUpperCase()
    ? name
    : name.charAt(0).toLowerCase() + name.slice(1);
}

function toNames(days: Day[], fallback: SourceNames): SourceNames {
  const labels = days.find((day) => day.labels !== undefined)?.labels;
  if (labels === undefined) return fallback;
  return {
    main: labels.main ?? fallback.main,
    other: labels.other === undefined ? fallback.other : labels.other,
  };
}

const offShare = 1e-3;

const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 });

function toUnmetShare(day: Day): number | null {
  if (day.short === undefined || day.demand === undefined || day.demand.value <= 0) return null;
  return Math.min(1, Math.max(0, day.short.value / day.demand.value));
}

function hasShare(energy: Energy | undefined, day: Day): boolean {
  const demand = day.demand?.value ?? 0;
  return demand > 0 && (energy?.value ?? 0) > offShare * demand;
}

function toShown(day: Day): Shown {
  if (day.no_demand === true) return "none";
  const electric = hasShare(day.electricity, day);
  if (day.source === "geothermal") return electric ? "electric" : "geothermal";
  if (day.source === "backup" && electric && !hasShare(day.backup, day)) return "electric";
  if (day.source === "backup") {
    const main = day.geothermal?.value ?? 0;
    const demand = day.demand?.value ?? 0;
    return demand > 0 && main > offShare * demand ? "topped" : "backup";
  }
  const share = toUnmetShare(day);
  return share !== null && share < 0.999 ? "partly" : "short";
}

function toMeanShare(days: Day[]): string {
  const shares = days.map(toUnmetShare).filter((share): share is number => share !== null);
  if (shares.length === 0) return "";
  const mean = shares.reduce((sum, share) => sum + share, 0) / shares.length;
  return `, ${percent.format(mean)} unmet on average`;
}

function toYearShare(days: Day[], { main, other }: SourceNames): string | null {
  const sum = (pick: (day: Day) => Energy | undefined) =>
    days.reduce((total, day) => total + (pick(day)?.value ?? 0), 0);
  const demand = sum((day) => day.demand);
  const unit = days.find((day) => day.demand !== undefined)?.demand?.unit;
  if (demand <= 0 || unit === undefined) return null;
  const geothermal = sum((day) => day.geothermal);
  const electricity = sum((day) => day.electricity);
  const backup = sum((day) => day.backup);
  const short = sum((day) => day.short);
  const off = days.filter((day) => toShown(day) === "backup").length;
  const parts = [
    `${main} gave ${percent.format(geothermal / demand)} of the year's demand (${geothermal.toFixed(0)} of ${demand.toFixed(0)} ${unit})`,
    ...(electricity > 0 ? [`heat-pump electricity ${percent.format(electricity / demand)}`] : []),
    ...(backup > 0 ? [`${toLower(other)} ${percent.format(backup / demand)}`] : []),
    ...(short > 0 ? [`unmet ${percent.format(short / demand)}`] : []),
  ];
  const offText =
    off > 0
      ? `; on ${String(off)} days ${toLower(main)} gave none of this demand (it may still run for another service)`
      : "";
  return `${parts.join(", ")}${offText}.`;
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

function toDayTitle(day: Day, names: SourceNames): string {
  const { main, other } = names;
  const parts = [
    ...toEnergy("demand", day.demand),
    ...toEnergy(toLower(main), day.geothermal),
    ...toEnergy("heat-pump electricity", day.electricity),
    ...toEnergy(toLower(other), day.backup),
    ...toEnergy("short", day.short),
  ];
  const share = toUnmetShare(day);
  const shown = toShown(day);
  const backupShare =
    day.backup !== undefined && day.demand !== undefined && day.demand.value > 0
      ? `, ${toLower(other)} ${percent.format(day.backup.value / day.demand.value)} of the demand`
      : "";
  const label = sources.find((entry) => entry.source === shown)?.label(names) ?? day.source;
  const head =
    shown === "partly" && share !== null
      ? `${day.date}: partly short, ${percent.format(share)} of the demand unmet`
      : `${day.date}: ${toLower(label)}${shown === "topped" ? backupShare : ""}`;
  return [head, ...parts].join(", ");
}

/** Stripes of the main source over the other source, so a topped-up day reads as mostly main, not as other only. */
function ToppedPattern({ id }: { id: string }) {
  return (
    <defs>
      <pattern
        id={id}
        width={5}
        height={5}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width={5} height={5} fill="var(--ok)" />
        <rect width={2} height={5} fill="var(--gas)" />
      </pattern>
    </defs>
  );
}

function toFill(shown: Shown, patternId: string): string {
  if (shown === "topped") return `url(#${patternId})`;
  return sources.find((entry) => entry.source === shown)?.fill ?? "var(--gas)";
}

/** One cell per day, coloured by how it was covered (main only, main with heat-pump electricity, main topped up by the other source, other only, partly short, short, no demand), named from the days' labels, with a legend, day counts, the year's shares and the rules as text. */
export function DaysStrip({ days, title, fallback = heatingNames }: Props) {
  const patternId = `days-topped-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const first = days[0];
  if (first === undefined) return null;
  const firstDay = toDayNumber(first.date);
  const width = toPosition(days[days.length - 1]?.date ?? first.date, firstDay).x + cell;
  const names = toNames(days, fallback);
  const yearShare = toYearShare(days, names);
  const present = new Set(days.map(toShown));
  const counts = sources
    .filter(
      (entry) =>
        names.other !== null ||
        (entry.source !== "topped" && entry.source !== "backup") ||
        present.has(entry.source),
    )
    .map((entry) => ({
      ...entry,
      label: entry.label(names),
      count: days.filter((day) => toShown(day) === entry.source).length,
      extra:
        entry.source === "partly"
          ? toMeanShare(days.filter((day) => toShown(day) === "partly"))
          : "",
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
        <ToppedPattern id={patternId} />
        {days.map((day) => {
          const { x, y } = toPosition(day.date, firstDay);
          const fill = toFill(toShown(day), patternId);
          return (
            <rect key={day.date} x={x} y={y} width={cell} height={cell} rx={2} fill={fill}>
              <title>{toDayTitle(day, names)}</title>
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
              style={{ background: entry.swatch ?? entry.fill }}
            />
            {entry.label}: {entry.count} days
            {entry.extra}
          </span>
        ))}
        {yearShare === null ? null : <span className="basis-full text-text">{yearShare}</span>}
        <span className="basis-full">
          A day counts as short when any of its demand is unmet; partly short days got part of it
          (hover a day for the unmet share), short days got none.
        </span>
      </figcaption>
    </figure>
  );
}
