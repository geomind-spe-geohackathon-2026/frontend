import { Chip } from "@/shared/ui/chip";
import type { RunStatus } from "./types";

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
  return <Chip tone={tones[status]}>{status}</Chip>;
}
