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
};

type Props = { days: Day[]; title: string; mainLabel?: string };

const cell = 12;
const gap = 2;
const pitch = cell + gap;
type Shown = "geothermal" | "electric" | "topped" | "backup" | "partly" | "short";

const toppedSwatch = "repeating-linear-gradient(135deg, var(--ok) 0 3px, var(--gas) 3px 5px)";

const sources: { source: Shown; label: (main: string) => string; fill: string; swatch?: string }[] =
  [
    { source: "geothermal", label: (main) => `${main} only`, fill: "var(--ok)" },
    {
      source: "electric",
      label: (main) => `${main} with heat-pump electricity`,
      fill: "var(--power)",
    },
    {
      source: "topped",
      label: (main) => `${main} topped up by backup`,
      fill: "var(--ok)",
      swatch: toppedSwatch,
    },
    {
      source: "backup",
      label: (main) => `Backup only (no ${main.toLowerCase()} heat to this demand)`,
      fill: "var(--gas)",
    },
    { source: "partly", label: () => "Partly short", fill: "var(--warn)" },
    { source: "short", label: () => "Short", fill: "var(--bad)" },
  ];

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

function toYearShare(days: Day[], main: string): { text: string; hasBackup: boolean } | null {
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
    ...(backup > 0 ? [`backup ${percent.format(backup / demand)}`] : []),
    ...(short > 0 ? [`unmet ${percent.format(short / demand)}`] : []),
  ];
  const offText =
    off > 0
      ? `; on ${String(off)} days ${main.toLowerCase()} gave none of this demand (it may still run for another service)`
      : "";
  return { text: `${parts.join(", ")}${offText}.`, hasBackup: backup > 0 };
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
    ...toEnergy("heat-pump electricity", day.electricity),
    ...toEnergy("backup", day.backup),
    ...toEnergy("short", day.short),
  ];
  const share = toUnmetShare(day);
  const shown = toShown(day);
  const backupShare =
    day.backup !== undefined && day.demand !== undefined && day.demand.value > 0
      ? `, backup ${percent.format(day.backup.value / day.demand.value)} of the demand`
      : "";
  const head =
    shown === "partly" && share !== null
      ? `${day.date}: partly short, ${percent.format(share)} of the demand unmet`
      : `${day.date}: ${shown === "topped" ? "topped up by backup" : shown === "electric" ? "geothermal with heat-pump electricity" : day.source}${shown === "topped" ? backupShare : ""}`;
  return [head, ...parts].join(", ");
}

/** Stripes of the main source over the backup, so a topped-up day reads as mostly main, not as backup only. */
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

/** One cell per day, coloured by how it was covered (main source only, main source with heat-pump electricity, main source topped up by backup, backup only, partly short, short), with a legend, day counts, the backup's share of the delivered energy and the rules as text. */
export function DaysStrip({ days, title, mainLabel }: Props) {
  const patternId = `days-topped-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const first = days[0];
  if (first === undefined) return null;
  const firstDay = toDayNumber(first.date);
  const width = toPosition(days[days.length - 1]?.date ?? first.date, firstDay).x + cell;
  const main = mainLabel ?? "Geothermal";
  const yearShare = toYearShare(days, main);
  const counts = sources.map((entry) => ({
    ...entry,
    label: entry.label(main),
    count: days.filter((day) => toShown(day) === entry.source).length,
    extra:
      entry.source === "partly" ? toMeanShare(days.filter((day) => toShown(day) === "partly")) : "",
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
              style={{ background: entry.swatch ?? entry.fill }}
            />
            {entry.label}: {entry.count} days
            {entry.extra}
          </span>
        ))}
        {yearShare === null ? null : <span className="basis-full text-text">{yearShare.text}</span>}
        <span className="basis-full">
          {!yearShare?.hasBackup
            ? null
            : `Backup is the plant's boilers (gas, CHP or electric) covering what ${main.toLowerCase()} cannot. `}
          A day counts as short when any of its demand is unmet; partly short days got part of it
          (hover a day for the unmet share), short days got none.
        </span>
      </figcaption>
    </figure>
  );
}
