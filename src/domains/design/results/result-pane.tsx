import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Notice } from "@/shared/ui/notice";
import { resultQuery } from "./api";
import { ConstraintsCard } from "./constraints-card";
import { CapacityTiles } from "./capacity-tiles";
import { CoverageCard } from "./coverage-card";
import { KpiTiles } from "./kpi-tiles";

type Props = { projectId: string; resultId: string };

/** One result: key figures, capacities, days covered and constraint checks, with a link to make a report. */
export function ResultPane({ projectId, resultId }: Props) {
  const result = useQuery(resultQuery(projectId, resultId));
  if (result.isPending) return <Notice status="loading" what="the result" />;
  if (result.isError) return <Notice status="failed" error={result.error} />;
  const data = result.data;
  return (
    <>
      <div className="mb-3.5 flex justify-end">
        <Button asChild variant="primary">
          <Link to={`/projects/${projectId}/design/report?result=${data.id}`}>
            Make report from this result
          </Link>
        </Button>
      </div>
      <KpiTiles items={data.kpis} label="Key figures" />
      {data.capacities.length > 0 ? (
        <CapacityTiles items={data.capacities} label="Capacities" />
      ) : null}
      {data.sizes.length > 0 ? <CapacityTiles items={data.sizes} label="Sizes" /> : null}
      <CoverageCard coverage={data.coverage} />
      <ConstraintsCard result={data} />
    </>
  );
}
