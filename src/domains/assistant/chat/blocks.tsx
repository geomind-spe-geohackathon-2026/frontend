import { Quantity } from "@/shared/quantity/quantity";
import { Chip } from "@/shared/ui/chip";
import { toDepth, toGroups, toLabel, type Group } from "./agents";
import { MarkdownText } from "@/shared/ui/markdown-text";
import { Copy } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { showToast } from "@/shared/ui/toast";
import { toFailureText, toPretty, toRequestText, toSummary } from "@/shared/sse/pretty";
import { fromRoute } from "@/shared/sse/route";
import type { Block } from "./view";

type ToolBlock = Extract<Block, { kind: "tool" }>;
type TextBlock = Extract<Block, { kind: "text" }>;

const indents = ["", "ml-3", "ml-6"];

/** Counts the tool calls of a run that failed. */
export function toFailedCount(blocks: Block[]): number {
  return blocks.filter((block) => block.kind === "tool" && block.state === "failed").length;
}

function CopyButton({ text }: { text: string }) {
  return (
    <Button
      aria-label="Copy the output"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          showToast("Copied");
        });
      }}
    >
      <Copy aria-hidden="true" className="size-3.5" />
    </Button>
  );
}

function toToolName(tool: string): string {
  const words = tool.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function ToolCard({ block }: { block: ToolBlock }) {
  const tone = block.state === "failed" ? "bad" : block.state === "done" ? "ok" : "info";
  return (
    <details className="rounded-control border border-border bg-surface">
      <summary className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5">
        <Chip tone={tone}>{block.state}</Chip>
        <span>{toToolName(block.tool)}</span>
        <span
          className={`min-w-0 flex-1 truncate ${block.error === null ? "text-muted" : "text-bad"}`}
        >
          {block.error === null ? toSummary(block.summary) : toFailureText(block.error)}
        </span>
        {block.duration === null ? null : <Quantity value={block.duration} unit="s" />}
      </summary>
      <div className="space-y-2 border-t border-border p-2.5">
        <p className="text-[11.5px] tracking-wide text-muted uppercase">Input</p>
        <pre className="overflow-x-auto rounded-control bg-sunken p-2 font-mono text-[12px]">
          {JSON.stringify(block.input, null, 2)}
        </pre>
        <p className="flex items-center justify-between text-[11.5px] tracking-wide text-muted uppercase">
          Output
          <CopyButton text={toPretty(block.summary)} />
        </p>
        <pre
          className={`overflow-x-auto font-mono text-[12px] whitespace-pre-wrap ${block.error === null ? "" : "text-bad"}`}
        >
          {toPretty(block.summary)}
        </pre>
        {block.error === null ? null : <p className="text-bad">{toFailureText(block.error)}</p>}
      </div>
    </details>
  );
}

function TextView({ block, running }: { block: TextBlock; running: boolean }) {
  if (block.text === "")
    return block.open && running ? <p className="text-muted">Thinking</p> : null;
  const route = fromRoute(block.text);
  if (route === null) return <MarkdownText text={block.text} />;
  return route.kind === "answer" ? <MarkdownText text={route.answer} /> : null;
}

function FailedTools({ count }: { count: number }) {
  return (
    <p role="status" className="text-bad">
      Done with {count} {count === 1 ? "error" : "errors"}
    </p>
  );
}

function ToolSteps({ tools, running }: { tools: ToolBlock[]; running: boolean }) {
  const failed = tools.some((tool) => tool.state === "failed");
  const count = tools.length;
  return (
    <details open={running || failed} className="space-y-1.5">
      <summary className="cursor-pointer text-[12px] text-muted">
        {count} {count === 1 ? "step" : "steps"}
      </summary>
      {tools.map((tool) => (
        <ToolCard key={tool.id} block={tool} />
      ))}
    </details>
  );
}

function toRuns(blocks: Block[]): (Block | ToolBlock[])[] {
  const runs: (Block | ToolBlock[])[] = [];
  for (const block of blocks) {
    const last = runs.at(-1);
    if (block.kind !== "tool") runs.push(block);
    else if (Array.isArray(last)) last.push(block);
    else runs.push([block]);
  }
  return runs;
}

function BlockView({ block, running, failed }: { block: Block; running: boolean; failed: number }) {
  switch (block.kind) {
    case "text":
      return <TextView block={block} running={running} />;
    case "tool":
      return null;
    case "request":
      if (!block.resolved) return null;
      return <p className="text-[12px] text-muted">{toRequestText(block.request.message)}</p>;
    case "end":
      if (block.status === "done") return failed === 0 ? null : <FailedTools count={failed} />;
      return (
        <p role="status" className="text-bad">
          Run {block.status}
          {block.message === null ? "" : `: ${block.message}`}
        </p>
      );
  }
}

function AgentGroup({
  group,
  running,
  failed,
}: {
  group: Group;
  running: boolean;
  failed: number;
}) {
  const depth = toDepth(group.agent);
  return (
    <section
      aria-label={`Agent ${group.agent}`}
      className={`space-y-1.5 ${indents[Math.min(depth, 2)] ?? ""} ${depth === 0 ? "" : "border-l-2 border-border pl-2.5"}`}
    >
      {depth === 0 ? null : <p className="text-[12px] text-muted">{toLabel(group.agent)}</p>}
      {toRuns(group.blocks).map((run) =>
        Array.isArray(run) ? (
          <ToolSteps key={run[0]?.id} tools={run} running={running} />
        ) : (
          <BlockView key={run.id} block={run} running={running} failed={failed} />
        ),
      )}
    </section>
  );
}

/** The blocks of a run in event order, grouped by the agent that produced them. */
export function Blocks({ blocks, running }: { blocks: Block[]; running: boolean }) {
  const failed = toFailedCount(blocks);
  return (
    <div className="space-y-2.5">
      {toGroups(blocks).map((group) => (
        <AgentGroup key={group.id} group={group} running={running} failed={failed} />
      ))}
    </div>
  );
}
