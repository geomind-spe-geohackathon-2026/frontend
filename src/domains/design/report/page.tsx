import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PageHeader } from "@/shared/layout/page-header";
import { useRequiredParam } from "@/shared/layout/params";
import { Notice } from "@/shared/ui/notice";
import { reportResultsQuery, reportRunsQuery } from "./api";
import { ReportEditor } from "./report-editor";

/** The Report page: loads the results and runs, then shows the report workspace. */
export function ReportPage() {
  const projectId = useRequiredParam("projectId");
  const results = useQuery(reportResultsQuery(projectId));
  const runs = useQuery(reportRunsQuery(projectId));
  if (results.isPending || results.isError || results.data.length === 0) {
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
    <ReportEditor projectId={projectId} results={results.data} runs={runs.data?.items ?? []} />
  );
}
