import { Link } from "react-router-dom";
import { toDateTimeLabel } from "@/lib/datelabel";
import { Card, CardHeader } from "@/components/ui/card";
import { toActivityPath } from "./link";
import type { Activity } from "@/shared/api/types";

function ActivityText({ projectId, item }: { projectId: string; item: Activity }) {
  const text = item.text.toLowerCase().startsWith(item.actor.name.toLowerCase())
    ? item.text
    : `${item.actor.name} ${item.text}`;
  if (item.link === null) return <span>{text}</span>;
  return <Link to={toActivityPath(projectId, item.link)}>{text}</Link>;
}

type Row = { item: Activity; times: number };

function toRows(items: Activity[]): Row[] {
  const rows: Row[] = [];
  for (const item of items) {
    const last = rows.at(-1);
    if (last?.item.text === item.text) last.times += 1;
    else rows.push({ item, times: 1 });
  }
  return rows;
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
          {toRows(items).map(({ item, times }) => (
            <li
              key={item.id}
              className="flex gap-3 border-b border-border px-3 py-2.5 last:border-b-0"
            >
              <span className="w-28 flex-none text-muted">{toDateTimeLabel(item.time)}</span>
              <span className="min-w-0 flex-1">
                <ActivityText projectId={projectId} item={item} />
              </span>
              {times === 1 ? null : <span className="text-muted">{times} times</span>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
