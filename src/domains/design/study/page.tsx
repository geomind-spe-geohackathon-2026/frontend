import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toItems } from "@/shared/api/pagination";
import { PageHeader } from "@/shared/layout/page-header";
import { useRequiredParam } from "@/shared/layout/params";
import { Button } from "@/shared/ui/button";
import { Notice } from "@/shared/ui/notice";
import { studiesQuery, useCancelStudy, useStartStudy } from "./api";
import { NewStudyDialog } from "./new-study-dialog";
import { StudyTable } from "./study-table";

/** The 3 · Study page: studies of the project with progress, status, result links and a New study dialog. */
export function StudyPage() {
  const projectId = useRequiredParam("projectId");
  const studies = useInfiniteQuery(studiesQuery(projectId));
  const start = useStartStudy(projectId);
  const cancel = useCancelStudy(projectId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const items = toItems(studies.data?.pages);
  const mutationError = start.error ?? cancel.error;

  return (
    <>
      <PageHeader
        title="3 · Study"
        description="Heavy calculations run in the background. This list refreshes while one is running."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setDialogOpen(true);
            }}
          >
            New study
          </Button>
        }
      />
      <NewStudyDialog projectId={projectId} open={dialogOpen} onOpenChange={setDialogOpen} />
      {studies.isPending ? <Notice status="loading" what="studies" /> : null}
      {studies.isError ? <Notice status="failed" error={studies.error} /> : null}
      {mutationError === null ? null : <Notice status="failed" error={mutationError} />}
      {studies.isSuccess && items.length === 0 ? (
        <Notice status="empty">No studies yet. Choose New study to start one.</Notice>
      ) : null}
      {items.length > 0 ? (
        <StudyTable
          studies={items}
          projectId={projectId}
          busy={start.isPending || cancel.isPending}
          onStart={start.mutate}
          onCancel={cancel.mutate}
        />
      ) : null}
      {studies.hasNextPage ? (
        <Button
          className="mt-3"
          disabled={studies.isFetchingNextPage}
          onClick={() => void studies.fetchNextPage()}
        >
          Load more
        </Button>
      ) : null}
    </>
  );
}
