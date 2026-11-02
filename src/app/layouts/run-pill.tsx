import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { activeRunsQuery } from "@/shared/api/runs";

type Props = { projectId: string };

/** The top bar pill that shows the active runs of the project and opens the running chat. */
export function RunPill({ projectId }: Props) {
  const runs = useQuery(activeRunsQuery(projectId));
  const first = runs.data?.items[0];
  if (first === undefined || runs.data === undefined) return null;
  const count = runs.data.items.length;
  return (
    <Link
      to={`/projects/${projectId}/assistant/chat/${first.chat}`}
      className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-2.5 py-0.5 text-xs whitespace-nowrap text-muted no-underline"
    >
      <span
        aria-hidden="true"
        className="size-[7px] rounded-full bg-accent motion-safe:animate-pulse"
      />
      {count === 1 ? "1 run active" : `${String(count)} runs active`}
    </Link>
  );
}
