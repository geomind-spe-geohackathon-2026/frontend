import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Scatter, type ScatterPoint } from "@/shared/charts/scatter";
import { Card, CardBody } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Notice } from "@/shared/ui/notice";
import type { ResultComparison, Kpi, Result } from "@/shared/api/types";
import { comparisonQuery } from "./api";
import { findKpi, toMergedPoints, toSharedKpis } from "./compare";
import { CompareTable } from "./compare-table";

type Props = { projectId: string; results: Result[] };

const minimumDesigns = 3;

function toRange(
  comparison: ResultComparison,
  id: string,
  metric: string,
): [number, number] | undefined {
  const row = comparison.spreads.find((item) => item.result === id && item.metric === metric);
  if (row?.p5 === undefined || row.p5 === null || row.p95 === null) return undefined;
  return [row.p5, row.p95];
}

function toPoints(comparison: ResultComparison, x: Kpi, y: Kpi): ScatterPoint[] {
  const points = comparison.items.flatMap((item) => {
    const xValue = findKpi(item, x.name)?.value ?? null;
    const yValue = findKpi(item, y.name)?.value ?? null;
    if (xValue === null || yValue === null) return [];
    return [{ id: item.id, label: item.name, x: xValue, y: yValue }];
  });
  return toMergedPoints(points).map((point) => ({
    ...point,
    xRange: toRange(comparison, point.id, x.name),
    yRange: toRange(comparison, point.id, y.name),
  }));
}

function toParetoIds(points: ScatterPoint[], pareto: string[]): string[] {
  return points.length >= minimumDesigns ? pareto : [];
}

function TestLinks({ projectId, results }: Props) {
  const tests = results.filter((result) => result.role !== "design");
  if (tests.length === 0) return null;
  return (
    <p className="text-[12.5px] text-muted">
      Studies of a design under varied inputs:{" "}
      {tests.map((test) => (
        <Link
          key={test.id}
          to={`/projects/${projectId}/design/results/${test.id}`}
          className="mr-3 text-accent"
        >
          {test.name}
        </Link>
      ))}
    </p>
  );
}

function toAxisTitle(kpi: Kpi): string {
  return kpi.unit === "" ? kpi.title : `${kpi.title} (${kpi.unit})`;
}

function KpiSelect({
  id,
  label,
  kpis,
  value,
  onValue,
}: {
  id: string;
  label: string;
  kpis: Kpi[];
  value: string;
  onValue: (value: string) => void;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          onValue(event.target.value);
        }}
        className="rounded-control border border-border bg-surface px-2.5 py-[7px]"
      >
        {kpis.map((kpi) => (
          <option key={kpi.name} value={kpi.name}>
            {kpi.title}
          </option>
        ))}
      </select>
    </Field>
  );
}

type ControlsProps = {
  results: Result[];
  kpis: Kpi[];
  xName: string;
  yName: string;
  chosen: string[];
  onParam: (name: string, value: string) => void;
};

function Controls({ results, kpis, xName, yName, chosen, onParam }: ControlsProps) {
  function handleChosen(id: string, checked: boolean): void {
    onParam("ids", (checked ? [...chosen, id] : chosen.filter((entry) => entry !== id)).join(","));
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <KpiSelect
        id="compare-x"
        label="Horizontal axis"
        kpis={kpis}
        value={xName}
        onValue={(value) => {
          onParam("x", value);
        }}
      />
      <KpiSelect
        id="compare-y"
        label="Vertical axis"
        kpis={kpis}
        value={yName}
        onValue={(value) => {
          onParam("y", value);
        }}
      />
      <fieldset className="flex flex-wrap gap-3 border-0 p-0">
        <legend className="text-[12.5px] text-muted">Results</legend>
        {results.map((entry) => (
          <label key={entry.id} className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={chosen.includes(entry.id)}
              onChange={(event) => {
                handleChosen(entry.id, event.target.checked);
              }}
            />
            {entry.name}
          </label>
        ))}
      </fieldset>
    </div>
  );
}

function ComparisonView({ comparison, x, y }: { comparison: ResultComparison; x: Kpi; y: Kpi }) {
  const points = toPoints(comparison, x, y);
  const pareto = toParetoIds(points, comparison.pareto);
  return (
    <>
      <Scatter
        points={points}
        paretoIds={pareto}
        xTitle={toAxisTitle(x)}
        yTitle={toAxisTitle(y)}
        title="Comparison of designs"
      />
      {pareto.length === 0 ? null : (
        <p
          className="text-[12.5px] text-muted"
          title="No other design here is better on both figures."
        >
          The dashed line is the trade-off line.
        </p>
      )}
      <CompareTable comparison={comparison} x={x} y={y} pareto={pareto} />
    </>
  );
}

/** The Compare tab: choose results and two KPIs, see the scatter with the Pareto line and a table. */
export function ComparePane({ projectId, results }: Props) {
  const [params, setParams] = useSearchParams();
  const designs = results.filter((result) => result.role === "design");
  const kpis = toSharedKpis(designs);
  const has = (name: string) => kpis.some((kpi) => kpi.name === name);
  const xName = params.get("x") ?? (has("co2") ? "co2" : (kpis[0]?.name ?? ""));
  const yName = params.get("y") ?? (has("lcts") ? "lcts" : (kpis[1]?.name ?? ""));
  const designIds = designs.map((entry) => entry.id);
  const chosen =
    params
      .get("ids")
      ?.split(",")
      .filter((id) => designIds.includes(id)) ?? designIds;
  const comparison = useQuery(comparisonQuery(projectId, chosen, xName, yName));
  const x = kpis.find((kpi) => kpi.name === xName) ?? null;
  const y = kpis.find((kpi) => kpi.name === yName) ?? null;

  function handleParam(name: string, value: string): void {
    setParams((current) => new URLSearchParams({ ...Object.fromEntries(current), [name]: value }));
  }

  if (x === null || y === null) {
    return (
      <Notice status="empty">
        These results share fewer than two key figures, so there is nothing to compare.
      </Notice>
    );
  }
  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <Controls
          results={designs}
          kpis={kpis}
          xName={xName}
          yName={yName}
          chosen={chosen}
          onParam={handleParam}
        />
        {chosen.length === 0 ? <Notice status="empty">Choose at least one result.</Notice> : null}
        {chosen.length > 0 && comparison.isPending ? (
          <Notice status="loading" what="the comparison" />
        ) : null}
        {comparison.isError ? <Notice status="failed" error={comparison.error} /> : null}
        {comparison.data === undefined ? null : (
          <>
            <ComparisonView comparison={comparison.data} x={x} y={y} />
            <TestLinks projectId={projectId} results={results} />
          </>
        )}
      </CardBody>
    </Card>
  );
}
