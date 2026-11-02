import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Notice } from "@/shared/ui/notice";
import { showToast } from "@/shared/ui/toast";
import type { Kpi } from "@/shared/api/types";
import { resultQuery, useAdoptDesign } from "./api";
import { ConstraintsCard } from "./constraints-card";
import { CapacityTiles } from "./capacity-tiles";
import { CoverageCard } from "./coverage-card";
import { SpreadCard, TornadoCard } from "./findings-cards";
import { KpiTiles } from "./kpi-tiles";

type Props = { projectId: string; resultId: string };

function toGroupTitle(unit: string): string {
  if (unit.includes("EUR")) return "Economics";
  if (unit === "MWh" || unit === "GWh") return "Energy balance";
  return unit === "kt" || unit === "t" ? "Emissions" : "Other figures";
}

function toKpiGroups(items: Kpi[]): { title: string; items: Kpi[] }[] {
  const titles = ["Economics", "Energy balance", "Emissions", "Other figures"];
  return titles
    .map((title) => ({
      title,
      items: items.filter((item) => toGroupTitle(item.unit) === title),
    }))
    .filter((group) => group.items.length > 0);
}

function AdoptButton({ projectId, resultId }: Props) {
  const adopt = useAdoptDesign(projectId, resultId);
  return (
    <Button
      disabled={adopt.isPending}
      onClick={() => {
        adopt.mutate(undefined, {
          onSuccess: (saved) => {
            showToast(`Plant v${String(saved.plant_version)} saved from this design`);
          },
        });
      }}
    >
      Use this design as the plant
    </Button>
  );
}

/** One result: key figures, capacities, days covered and constraint checks, with a link to make a report. */
export function ResultPane({ projectId, resultId }: Props) {
  const result = useQuery(resultQuery(projectId, resultId));
  if (result.isPending) return <Notice status="loading" what="the result" />;
  if (result.isError) return <Notice status="failed" error={result.error} />;
  const data = result.data;
  return (
    <>
      <div className="mb-3.5 flex justify-end gap-2">
        <AdoptButton projectId={projectId} resultId={data.id} />
        <Button asChild variant="primary">
          <Link to={`/projects/${projectId}/design/report?result=${data.id}`}>
            Make report from this result
          </Link>
        </Button>
      </div>
      {toKpiGroups(data.kpis).map((group) => (
        <section key={group.title} aria-label={group.title}>
          <h2 className="mb-2 text-[13px] text-muted">{group.title}</h2>
          <KpiTiles items={group.items} label={group.title} />
        </section>
      ))}
      {data.tornado === null ? null : <TornadoCard rows={data.tornado} />}
      {data.spread === null ? null : <SpreadCard rows={data.spread} />}
      {data.capacities.length > 0 ? (
        <CapacityTiles items={data.capacities} label="Capacities" />
      ) : null}
      {data.sizes.length > 0 ? <CapacityTiles items={data.sizes} label="Sizes" /> : null}
      <CoverageCard coverage={data.coverage} />
      <ConstraintsCard result={data} />
    </>
  );
}
