import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { LoadError } from "@/shared/forms/load-error";
import { Notice } from "@/shared/ui/notice";
import { toVersionEntries } from "@/shared/versions/diff";
import { VersionDetail, VersionList } from "@/shared/versions/history";
import { caseKeys, caseVersionQuery, caseVersionsQuery, useRestoreCase } from "./api";

type Props = {
  projectId: string;
  current: number;
  dirty: boolean;
  onRestored: () => void;
  initial?: number | undefined;
};

function toRestoreFailure(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) {
    return "The case was saved again since this list was loaded. Go back to the list and try again.";
  }
  return error instanceof Error ? error.message : "The version could not be restored.";
}

/** The saved case versions, newest first; a version opens read-only with its changes from the version before and a Restore button. */
export function HistoryPanel({ projectId, current, dirty, onRestored, initial }: Props) {
  const versions = useQuery(caseVersionsQuery(projectId));
  const queryClient = useQueryClient();
  const restore = useRestoreCase(projectId);
  const [opened, setOpened] = useState<number | null>(initial ?? null);
  if (versions.isPending) return <Notice status="loading" what="the history" />;
  if (versions.isError) {
    return (
      <LoadError
        error={versions.error}
        what="version history"
        onRetry={() => void versions.refetch()}
      />
    );
  }
  const list = versions.data;
  const index = list.findIndex((version) => version.number === opened);
  const version = list[index];
  if (version === undefined) {
    return <VersionList what="case" versions={list} current={current} onOpen={setOpened} />;
  }
  const load = async (number: number) => {
    const body = await queryClient.fetchQuery(caseVersionQuery(projectId, number));
    return toVersionEntries(body.content, body.files);
  };
  return (
    <VersionDetail
      what="case"
      queryKey={caseKeys.versions(projectId)}
      load={load}
      version={version}
      previous={list[index + 1]?.number}
      current={current}
      onBack={() => {
        restore.reset();
        setOpened(null);
      }}
      restore={
        <Button
          variant="default"
          disabled={dirty || restore.isPending}
          title={dirty ? "Save or discard your changes first" : undefined}
          onClick={() => {
            restore.mutate({ number: version.number, base: current }, { onSuccess: onRestored });
          }}
        >
          Restore this version
        </Button>
      }
      notice={
        <>
          {version.number === current ? null : (
            <p className="text-[13px] text-muted">
              Restore saves the values and files of version {version.number} as version{" "}
              {current + 1}.
            </p>
          )}
          {dirty && version.number !== current ? (
            <p className="text-[13px] text-warn">
              The case has unsaved changes: save or discard them before you restore.
            </p>
          ) : null}
          {restore.isError ? (
            <p role="alert" className="text-[13px] text-bad">
              {toRestoreFailure(restore.error)}
            </p>
          ) : null}
        </>
      }
    />
  );
}
