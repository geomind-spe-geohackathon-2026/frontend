import { Link } from "react-router-dom";
import { toDateTimeLabel } from "@/lib/datelabel";
import { Card, CardHeader } from "@/shared/ui/card";
import { toActivityPath } from "./link";
import type { Activity } from "@/shared/api/types";

function ActivityText({ projectId, item }: { projectId: string; item: Activity }) {
  const text = item.text.toLowerCase().startsWith(item.actor.name.toLowerCase())
    ? item.text
    : `${item.actor.name} ${item.text}`;
  if (item.link === null) return <span>{text}</span>;
  return <Link to={toActivityPath(projectId, item.link)}>{text}</Link>;
}

/** The latest activity rows: who changed what and when, with a link when the row has one. */
export function ActivityList({ projectId, items }: { projectId: string; items: Activity[] }) {
  return (
    <Card>
      <CardHeader>
        <h2>Activity</h2>
      </CardHeader>
      {items.length === 0 ? (
        <p className="p-3 text-muted">Nothing has happened in this project yet.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li
              key={item.id}
              className="flex gap-3 border-b border-border px-3 py-2.5 last:border-b-0"
            >
              <span className="w-28 flex-none text-muted">{toDateTimeLabel(item.time)}</span>
              <ActivityText projectId={projectId} item={item} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
