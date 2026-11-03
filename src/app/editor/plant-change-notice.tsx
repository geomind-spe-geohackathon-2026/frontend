import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { plantVersionsQuery } from "@/domains/design/plant/api";
import { meQuery } from "@/shared/api/me";
import { Button } from "@/shared/ui/button";

type Props = { projectId: string; onHistory: () => void };

/** Says when someone else, such as the agent, saved a new plant version while the editor is open. */
export function PlantChangeNotice({ projectId, onHistory }: Props) {
  const versions = useQuery(plantVersionsQuery(projectId));
  const me = useQuery(meQuery());
  const newest = versions.data?.[0];
  const [seen, setSeen] = useState<number | null>(null);
  if (newest === undefined || me.data === undefined) return null;
  if (seen === null) {
    setSeen(newest.number);
    return null;
  }
  if (newest.number <= seen || newest.author.id === me.data.id) return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-accent bg-accent-soft px-3 py-2"
    >
      <span>
        {newest.author.name} saved plant version {newest.number}: {newest.note}
      </span>
      <div className="flex gap-2">
        <Button onClick={onHistory}>Show history</Button>
        <Button
          onClick={() => {
            setSeen(newest.number);
          }}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
