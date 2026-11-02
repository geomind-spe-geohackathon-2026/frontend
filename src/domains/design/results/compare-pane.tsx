import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Scatter, type ScatterPoint } from "@/shared/charts/scatter";
import { Card, CardBody } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Notice } from "@/shared/ui/notice";
import type { Comparison, Kpi, ResultSummary } from "@/shared/api/design";
import { comparisonQuery } from "./api";
import { findKpi, toSharedKpis } from "./compare";
import { CompareTable } from "./compare-table";

type Props = { projectId: string; results: ResultSummary[] };

function toPoints(comparison: Comparison, x: Kpi, y: Kpi): ScatterPoint[] {
  return comparison.items.flatMap((item) => {
    const xValue = findKpi(item, x.name)?.value ?? null;
    const yValue = findKpi(item, y.name)?.value ?? null;
    if (xValue === null || yValue === null) return [];
    return [{ id: item.id, label: item.name, x: xValue, y: yValue }];
  });
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
  results: ResultSummary[];
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

/** The Compare tab: choose results and two KPIs, see the scatter with the Pareto line and a table. */
export function ComparePane({ projectId, results }: Props) {
  const [params, setParams] = useSearchParams();
  const kpis = toSharedKpis(results);
  const xName = params.get("x") ?? kpis[0]?.name ?? "";
  const yName = params.get("y") ?? kpis[1]?.name ?? "";
  const chosen =
    params
      .get("ids")
      ?.split(",")
      .filter((id) => id !== "") ?? results.map((entry) => entry.id);
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
          results={results}
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
            <Scatter
              points={toPoints(comparison.data, x, y)}
              paretoIds={comparison.data.pareto}
              xTitle={toAxisTitle(x)}
              yTitle={toAxisTitle(y)}
              title="Comparison of results"
            />
            <p className="text-[12.5px] text-muted">The dashed line joins the best trade-offs.</p>
            <CompareTable comparison={comparison.data} x={x} y={y} />
          </>
        )}
      </CardBody>
    </Card>
  );
}
