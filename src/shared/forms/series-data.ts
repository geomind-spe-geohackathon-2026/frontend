import { isRecord } from "./json-schema";

export type SeriesPoint = { time: string; value: number };
export type SeriesTable = { columns: string[]; rows: string[][] };
export type SeriesStats = { count: number; peak: number; low: number; hours: number; sum: number };

const timeColumn = /^(time|date|datetime|timestamp)$/i;

/** Reads a comma-separated file into its header and rows. */
export function toTable(text: string): SeriesTable {
  const [head = "", ...lines] = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  const columns = head.split(",").map((name) => name.trim());
  return { columns, rows: lines.map((line) => line.split(",").map((cell) => cell.trim())) };
}

/** Lists the columns a series can read: all but the time column. */
export function valueColumns(table: SeriesTable): string[] {
  return table.columns.filter((name) => !timeColumn.test(name));
}

/** Reads one column with the time of each row; rows without a number are left out. */
export function toPoints(table: SeriesTable, column: string): SeriesPoint[] {
  const index = table.columns.indexOf(column);
  const time = table.columns.findIndex((name) => timeColumn.test(name));
  if (index < 0) return [];
  return table.rows.flatMap((row) => {
    const value = Number(row[index]);
    return Number.isNaN(value) ? [] : [{ time: row[Math.max(time, 0)] ?? "", value }];
  });
}

function stepHours(points: SeriesPoint[]): number {
  const [first, second] = points;
  if (first === undefined || second === undefined) return 0;
  return (Date.parse(second.time) - Date.parse(first.time)) / 3_600_000;
}

/** Sums up a series: peak, lowest value, count, and the sum over time at its own step. */
export function toStats(points: SeriesPoint[]): SeriesStats {
  const values = points.map((point) => point.value);
  const hours = stepHours(points);
  const sum = values.reduce((total, value) => total + value, 0) * (Number.isNaN(hours) ? 0 : hours);
  return {
    count: values.length,
    peak: values.length === 0 ? 0 : Math.max(...values),
    low: values.length === 0 ? 0 : Math.min(...values),
    hours,
    sum,
  };
}

const unitHours: Record<string, number> = { s: 1 / 3600, min: 1 / 60, h: 1, d: 24 };

/** Counts the steps of a case's time, or null when the time is incomplete. */
export function expectedSteps(time: unknown): number | null {
  if (!isRecord(time) || !isRecord(time.step)) return null;
  const { start, end } = time;
  const { value, unit } = time.step;
  if (typeof start !== "string" || typeof end !== "string") return null;
  if (typeof value !== "number" || typeof unit !== "string") return null;
  const hours = unitHours[unit];
  if (hours === undefined) return null;
  return Math.round((Date.parse(end) - Date.parse(start)) / 3_600_000 / (value * hours));
}
