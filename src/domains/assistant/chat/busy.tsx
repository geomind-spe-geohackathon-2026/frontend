import { Loader2 } from "lucide-react";
import type { AgentNode, View } from "./view";

/** A small spinning circle that marks an agent at work; it stands still when the user asks for less motion. */
export function BusyMark() {
  return (
    <Loader2
      aria-hidden="true"
      className="size-3.5 shrink-0 animate-spin text-accent motion-reduce:animate-none"
    />
  );
}

/** The agents of the run that are working now: none while the run waits for the user, ends or fails. */
export function toWorkingAgents(view: View): AgentNode[] {
  if (view.status !== "running") return [];
  return Object.values(view.agents).filter((agent) => agent.state === "running");
}

/** Every agent of an active run, the finished ones too (they stay in the busy list with a done mark); none while the run waits for the user. */
export function toBusyListAgents(view: View): AgentNode[] {
  if (view.status !== "running") return [];
  return Object.values(view.agents);
}
