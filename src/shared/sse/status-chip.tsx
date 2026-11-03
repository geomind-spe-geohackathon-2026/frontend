import { Badge } from "@/components/ui/badge";
import type { RunStatus } from "@/shared/api/types";

const tones = {
  queued: "off",
  running: "info",
  waiting: "warn",
  done: "ok",
  failed: "bad",
  cancelled: "off",
} as const;

/** The status of a run as a chip; the word carries the meaning. */
export function RunStatusChip({ status }: { status: RunStatus }) {
  return <Badge variant={tones[status]}>{status}</Badge>;
}
