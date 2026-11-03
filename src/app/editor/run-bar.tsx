import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { plantVersionsQuery } from "@/domains/design/plant/api";
import { useEffect, useRef, useState } from "react";
import { hasActiveStudy, studiesQuery, useCancelStudy } from "@/domains/design/study/api";
import { NewStudyDialog } from "@/domains/design/study/new-study-dialog";
import { toProgress } from "@/domains/design/study/progress";
import { useRefreshOnFinish } from "@/domains/design/study/use-refresh-on-finish";
import { toItems } from "@/shared/api/pagination";
import type { Study } from "@/shared/api/types";
import { ProgressBar } from "@/shared/charts/progress-bar";
import { Button } from "@/shared/ui/button";

type Props = {
  projectId: string;
  isChatOpen: boolean;
  isResultsOpen: boolean;
  onToggleChat: () => void;
  onToggleResults: () => void;
  onStudyEnded: () => void;
};

function StudyStatus({ projectId, study }: { projectId: string; study: Study }) {
  const cancel = useCancelStudy(projectId);
  const progress = toProgress(study);
  const isActive = study.status === "queued" || study.status === "running";
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <span className="truncate font-medium">{study.name}</span>
      <span className="text-muted">{progress.kind === "none" ? study.status : progress.text}</span>
      {study.plant_pinned && study.plant_version !== null ? (
        <span className="text-muted">on plant version {study.plant_version}</span>
      ) : null}
      {isActive ? (
        <div className="w-32">
          <ProgressBar
            value={progress.kind === "determinate" ? progress.done : null}
            max={progress.kind === "determinate" ? progress.total : 1}
            label={`Progress of ${study.name}`}
          />
        </div>
      ) : null}
      {isActive ? (
        <Button
          disabled={cancel.isPending}
          onClick={() => {
            cancel.mutate(study.id);
          }}
        >
          Cancel
        </Button>
      ) : null}
    </div>
  );
}

function useStudyEnd(isActive: boolean, onEnded: () => void): void {
  const wasActive = useRef(false);
  useEffect(() => {
    if (wasActive.current && !isActive) onEnded();
    wasActive.current = isActive;
  }, [isActive, onEnded]);
}

/** The editor toolbar: the latest study with its progress, Run study, and the Chat and Results switches. */
export function RunBar(props: Props) {
  const { projectId } = props;
  const studies = useInfiniteQuery(studiesQuery(projectId));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const versions = useQuery({ ...plantVersionsQuery(projectId), enabled: isDialogOpen });
  const items = toItems(studies.data?.pages);
  const isActive = hasActiveStudy(items);
  useRefreshOnFinish(projectId, isActive);
  useStudyEnd(isActive, props.onStudyEnded);
  const latest = items[0];
  const canPin = items.some((study) => Object.hasOwn(study, "plant_pinned"));
  return (
    <div
      role="toolbar"
      aria-label="Editor"
      className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-surface px-3 py-2"
    >
      {latest === undefined ? (
        <span className="text-muted">No study yet</span>
      ) : (
        <StudyStatus projectId={projectId} study={latest} />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button aria-pressed={props.isChatOpen} onClick={props.onToggleChat}>
          Chat
        </Button>
        <Button aria-pressed={props.isResultsOpen} onClick={props.onToggleResults}>
          Results
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            setIsDialogOpen(true);
          }}
        >
          Run study
        </Button>
      </div>
      <NewStudyDialog
        projectId={projectId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        plants={canPin ? versions.data : undefined}
      />
    </div>
  );
}
