import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PageHeader } from "@/shared/layout/page-header";
import { useRequiredParam } from "@/shared/layout/params";
import { Notice } from "@/shared/ui/notice";
import { resultsQuery } from "@/shared/api/results";
import { partsQuery, reportRunsQuery } from "./api";
import { ReportEditor } from "./report-editor";

/** The Report page: loads the results and runs, then shows the report workspace. */
export function ReportPage() {
  const projectId = useRequiredParam("projectId");
  const results = useQuery(resultsQuery(projectId));
  const runs = useQuery(reportRunsQuery(projectId));
  const parts = useQuery(partsQuery());
  if (parts.isError) return <Notice status="failed" error={parts.error} />;
  if (parts.isPending || results.isPending || results.isError || results.data.length === 0) {
    return (
      <>
        <PageHeader title="Report" />
        {results.isPending ? <Notice status="loading" what="results" /> : null}
        {results.isError ? <Notice status="failed" error={results.error} /> : null}
        {results.data?.length === 0 ? (
          <Notice status="empty">
            There is no result to report on.{" "}
            <Link className="text-accent" to={`/projects/${projectId}/design/study`}>
              Run a study
            </Link>{" "}
            first.
          </Notice>
        ) : null}
      </>
    );
  }
  return (
    <ReportEditor
      projectId={projectId}
      results={results.data}
      runs={runs.data?.items ?? []}
      parts={parts.data}
    />
  );
}
