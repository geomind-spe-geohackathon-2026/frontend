import { TimeSeriesChart } from "@/shared/charts/time-series-chart";
import type { Series } from "@/shared/api/types";

type Props = { series: Omit<Series, "points"> & { points: (string | number)[][] } };

function toPoints(rows: (string | number)[][]) {
  return rows.flatMap(([time, value]) =>
    typeof time === "string" && typeof value === "number" ? [{ time, value }] : [],
  );
}

function toTitle(name: string): string {
  const last = name.split(".").at(-2) ?? name;
  const words = `${last} ${name.split(".").at(-1) ?? ""}`.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** One series of the case on the shared time chart, titled in words with its path below. */
export function SeriesChart({ series }: Props) {
  return (
    <TimeSeriesChart
      title={toTitle(series.name)}
      subtitle={series.name}
      unit={series.unit}
      points={toPoints(series.points)}
    />
  );
}
