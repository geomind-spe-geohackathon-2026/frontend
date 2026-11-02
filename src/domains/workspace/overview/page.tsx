import { useQuery } from "@tanstack/react-query";
import { projectQuery } from "@/shared/api/projects";
import { useRequiredParam } from "@/shared/layout/params";
import { PageHeader } from "@/shared/layout/page-header";
import { resultsQuery } from "@/shared/api/results";
import { overviewQuery } from "./api";
import { toStaleSteps } from "./stale";
import { ActivityList } from "./activity-list";
import { AskBox } from "./ask-box";
import { RecentChats } from "./recent-chats";
import { Stepper } from "./stepper";

/** The project overview: ask box, the five-step stepper, recent chats and the activity feed. */
export function OverviewPage() {
  const projectId = useRequiredParam("projectId");
  const project = useQuery(projectQuery(projectId));
  const overview = useQuery(overviewQuery(projectId));
  const results = useQuery(resultsQuery(projectId));
  const stale =
    project.data === undefined ? new Set<never>() : toStaleSteps(project.data, results.data?.[0]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Overview"
        {...(project.data === undefined ? {} : { description: project.data.name })}
      />
      <AskBox projectId={projectId} />
      {overview.isPending ? <p role="status">Loading the overview</p> : null}
      {overview.isError ? <p role="alert">{overview.error.message}</p> : null}
      {overview.data === undefined ? null : (
        <>
          <section aria-labelledby="progress-heading" className="flex flex-col gap-2">
            <h2
              id="progress-heading"
              className="text-[11px] tracking-[0.06em] text-muted uppercase"
            >
              Design progress
            </h2>
            <Stepper projectId={projectId} progress={overview.data.progress} stale={stale} />
          </section>
          <div className="grid grid-cols-2 gap-3.5 max-[1000px]:grid-cols-1">
            <RecentChats projectId={projectId} chats={overview.data.chats} />
            <ActivityList projectId={projectId} items={overview.data.activity} />
          </div>
        </>
      )}
    </div>
  );
}
