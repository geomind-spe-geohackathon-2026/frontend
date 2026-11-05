import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/shared/layout/page-header";
import { useRequiredParam } from "@/shared/layout/params";
import { Notice } from "@/shared/ui/notice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resultsQuery } from "@/shared/api/results";
import { ComparePane } from "./compare-pane";
import { ResultPane } from "./result-pane";

const compareTab = "compare";

const shortTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function toTabNote(entry: { plant_version: number | null; created: string }): string {
  const plant = entry.plant_version === null ? "" : `plant v${String(entry.plant_version)} · `;
  const at = Date.parse(entry.created);
  return `${plant}${Number.isNaN(at) ? entry.created : shortTime.format(at)}`;
}

/** The Results page: one tab per result plus Compare; the selected tab is part of the address. */
export function ResultsPage() {
  const projectId = useRequiredParam("projectId");
  const { resultId } = useParams();
  const navigate = useNavigate();
  const results = useQuery(resultsQuery(projectId));

  function renderBody() {
    if (results.isPending) return <Notice status="loading" what="results" />;
    if (results.isError) return <Notice status="failed" error={results.error} />;
    const first = results.data[0];
    if (first === undefined) {
      return (
        <Notice status="empty">
          <span>
            No results yet.{" "}
            <Link className="text-accent" to={`/projects/${projectId}/design/study`}>
              Run a study
            </Link>{" "}
            to get one.
          </span>
        </Notice>
      );
    }
    const selected = resultId ?? first.id;
    return (
      <Tabs
        value={selected}
        onValueChange={(value) => void navigate(`/projects/${projectId}/design/results/${value}`)}
      >
        <TabsList
          aria-label="Results"
          className="max-w-full justify-start overflow-x-auto overflow-y-hidden group-data-[orientation=horizontal]/tabs:h-auto"
        >
          {results.data.map((entry) => (
            <TabsTrigger key={entry.id} value={entry.id} title={toTabNote(entry)}>
              {entry.name}
              <span className="text-[11px] font-normal text-muted">{toTabNote(entry)}</span>
            </TabsTrigger>
          ))}
          <TabsTrigger value={compareTab}>Compare</TabsTrigger>
        </TabsList>
        {results.data.map((entry) => (
          <TabsContent key={entry.id} value={entry.id}>
            <ResultPane projectId={projectId} resultId={entry.id} />
          </TabsContent>
        ))}
        <TabsContent value={compareTab}>
          <ComparePane projectId={projectId} results={results.data} />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <>
      <PageHeader title="Results" description="Designs found by the studies, with their checks." />
      {renderBody()}
    </>
  );
}
