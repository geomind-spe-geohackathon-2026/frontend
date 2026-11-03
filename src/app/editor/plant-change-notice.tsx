import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { plantVersionQuery, plantVersionsQuery } from "@/domains/design/plant/api";
import { meQuery } from "@/shared/api/me";
import type { Version } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { toChangedModules } from "./changed-modules";

export type PlantChange = { version: Version; changed: Set<string>; dismiss: () => void };

const none = new Set<string>();

/** The newest plant version someone else, such as the agent, saved while the editor is open, with the modules it changed. */
export function usePlantChange(projectId: string): PlantChange | null {
  const versions = useQuery(plantVersionsQuery(projectId));
  const me = useQuery(meQuery());
  const newest = versions.data?.[0];
  const [seen, setSeen] = useState<number | null>(null);
  if (seen === null && newest !== undefined) setSeen(newest.number);
  const isNew =
    newest !== undefined &&
    me.data !== undefined &&
    seen !== null &&
    newest.number > seen &&
    newest.author.id !== me.data.id;
  const before = useQuery({ ...plantVersionQuery(projectId, seen ?? 0), enabled: isNew });
  const after = useQuery({ ...plantVersionQuery(projectId, newest?.number ?? 0), enabled: isNew });
  if (!isNew) return null;
  const changed =
    before.data === undefined || after.data === undefined
      ? none
      : toChangedModules(before.data, after.data);
  return {
    version: newest,
    changed,
    dismiss: () => {
      setSeen(newest.number);
    },
  };
}

/** Says when someone else saved a new plant version while the editor is open; its changed modules are outlined on the canvas. */
export function PlantChangeNotice({
  change,
  onHistory,
}: {
  change: PlantChange | null;
  onHistory: () => void;
}) {
  if (change === null) return null;
  const { version, changed } = change;
  const count =
    changed.size === 0 ? "" : ` Changed modules are outlined: ${[...changed].join(", ")}.`;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-accent bg-accent-soft px-3 py-2"
    >
      <span>
        {version.author.name} saved plant version {version.number}: {version.note}
        {count}
      </span>
      <div className="flex gap-2">
        <Button onClick={onHistory}>Show history</Button>
        <Button onClick={change.dismiss}>Dismiss</Button>
      </div>
    </div>
  );
}
