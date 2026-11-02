import { Quantity } from "@/shared/quantity/quantity";
import { Chip } from "@/shared/ui/chip";
import { toDepth, toGroups, toLabel, type Group } from "./agents";
import { MarkdownText } from "@/shared/ui/markdown-text";
import type { Block } from "./view";

type ToolBlock = Extract<Block, { kind: "tool" }>;

const indents = ["", "ml-3", "ml-6"];

function ToolCard({ block }: { block: ToolBlock }) {
  const tone = block.state === "failed" ? "bad" : block.state === "done" ? "ok" : "info";
  return (
    <details className="rounded-control border border-border bg-surface">
      <summary className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5">
        <Chip tone={tone}>{block.state}</Chip>
        <code className="font-mono">{block.tool}</code>
        <span className="min-w-0 flex-1 truncate text-muted">{block.error ?? block.summary}</span>
        {block.duration === null ? null : <Quantity value={block.duration} unit="s" />}
      </summary>
      <div className="space-y-2 border-t border-border p-2.5">
        <p className="text-[11.5px] tracking-wide text-muted uppercase">Input</p>
        <pre className="overflow-x-auto rounded-control bg-sunken p-2 font-mono text-[12px]">
          {JSON.stringify(block.input, null, 2)}
        </pre>
        <p className="text-[11.5px] tracking-wide text-muted uppercase">Output</p>
        <p className={block.error === null ? "" : "text-bad"}>{block.error ?? block.summary}</p>
      </div>
    </details>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "text":
      if (block.text === "") return block.open ? <p className="text-muted">Thinking</p> : null;
      return <MarkdownText text={block.text} />;
    case "tool":
      return <ToolCard block={block} />;
    case "request":
      return (
        <p className="rounded-control border border-warn bg-warn-soft px-2.5 py-1.5">
          {block.request.message}{" "}
          <span className="text-muted">
            {block.resolved ? "answered" : "waiting for your answer"}
          </span>
        </p>
      );
    case "end":
      if (block.status === "done") return null;
      return (
        <p role="status" className="text-bad">
          Run {block.status}
          {block.message === null ? "" : `: ${block.message}`}
        </p>
      );
  }
}

function AgentGroup({ group }: { group: Group }) {
  const depth = toDepth(group.agent);
  return (
    <section
      aria-label={`Agent ${group.agent}`}
      className={`space-y-1.5 ${indents[Math.min(depth, 2)] ?? ""} ${depth === 0 ? "" : "border-l-2 border-border pl-2.5"}`}
    >
      <p className="text-[12px] text-muted">
        {toLabel(group.agent)}
        {depth === 0 ? "" : " · delegated"}
      </p>
      {group.blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
    </section>
  );
}

/** The blocks of a run in event order, grouped by the agent that produced them. */
export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-2.5">
      {toGroups(blocks).map((group) => (
        <AgentGroup key={group.id} group={group} />
      ))}
    </div>
  );
}
