import { toAgentName } from "@/shared/sse/agent-names";
import type { AgentNode, Block } from "./view";

export type Group = { id: string; agent: string; blocks: Block[] };

/** The nesting depth of an agent path: 0 for the top agent. */
export function toDepth(path: string): number {
  return path.split(".").length - 1;
}

/** The name shown for an agent: its last segment, or the whole dotted path when nested deeper than two levels. */
export function toLabel(path: string): string {
  if (toDepth(path) > 2) return path;
  return path.split(".").at(-1) ?? path;
}

/** The name of an agent run: its instance name ("Geoscientist II") when it is one of several, else the agent's name. */
export function toAgentTitle(node: AgentNode): string {
  return node.instance ?? toAgentName(node.path);
}

/** Splits blocks into groups of consecutive blocks of the same agent. */
export function toGroups(blocks: Block[]): Group[] {
  const groups: Group[] = [];
  blocks.forEach((block) => {
    const last = groups.at(-1);
    if (last?.agent === block.agent) last.blocks.push(block);
    else groups.push({ id: block.id, agent: block.agent, blocks: [block] });
  });
  return groups;
}
