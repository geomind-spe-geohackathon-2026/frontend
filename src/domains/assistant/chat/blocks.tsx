import { Link, useParams } from "react-router-dom";
import { Quantity } from "@/shared/quantity/quantity";
import { Chip } from "@/shared/ui/chip";
import { toDepth, toGroups, toLabel, type Group } from "./agents";
import { MarkdownText } from "@/shared/ui/markdown-text";
import { Copy } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { showToast } from "@/shared/ui/toast";
import {
  toFailureText,
  toPretty,
  toRequestText,
  toBudgetStop,
  toSummary,
} from "@/shared/sse/pretty";
import { fromRoute, toRouteLabel } from "@/shared/sse/route";
import type { Block, RecordedStudy } from "./view";

type ToolBlock = Extract<Block, { kind: "tool" }>;
type TextBlock = Extract<Block, { kind: "text" }>;
type EndBlock = Extract<Block, { kind: "end" }>;

const indents = ["", "ml-3", "ml-6"];
const internalStop = "error";
const internalFailure = "The assistant stopped with an internal error in geomind";

/** The tool an agent ends with; its text is the answer, shown as the message. */
export const finishTool = "finish";

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

function ToolCard({ block }: { block: ToolBlock }) {
  const tone = block.state === "failed" ? "bad" : block.state === "done" ? "ok" : "info";
  return (
    <details className="rounded-control border border-border bg-surface">
      <summary className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5">
        <Chip tone={tone}>{block.state}</Chip>
        <code className="font-mono">{block.tool}</code>
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
  if (route.kind === "answer") return <MarkdownText text={route.answer} />;
  return <p className="text-[12px] text-muted">{toRouteLabel(route)}</p>;
}

function toEndText(block: EndBlock): string {
  const { status, message, reason } = block;
  if (message === null) return `Run ${status}`;
  const budget = toBudgetStop(message);
  if (budget !== null) return budget;
  return reason === internalStop ? internalFailure : `Run ${status}: ${message}`;
}

function RecordedStudies({ studies }: { studies: RecordedStudy[] }) {
  const { projectId = "" } = useParams();
  if (studies.length === 0) return null;
  return (
    <div className="text-[12.5px]">
      <p className="text-muted">Studies this run finished before it stopped:</p>
      <ul className="list-inside list-disc">
        {studies.map((study) => (
          <li key={study.id}>
            <Link to={`/projects/${projectId}/design/study`} className="underline">
              {study.name}
            </Link>
            {study.best === null ? null : ` ${study.best}`}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FailedTools({ count }: { count: number }) {
  return (
    <p role="status" className="text-bad">
      Done with {count} {count === 1 ? "error" : "errors"}
    </p>
  );
}

function BlockView({ block, running, failed }: { block: Block; running: boolean; failed: number }) {
  switch (block.kind) {
    case "text":
      return <TextView block={block} running={running} />;
    case "tool":
      return block.tool === finishTool && block.error === null ? null : <ToolCard block={block} />;
    case "request":
      if (!block.resolved) return null;
      return <p className="text-[12px] text-muted">{toRequestText(block.request.message)}</p>;
    case "end":
      if (block.status === "done") return failed === 0 ? null : <FailedTools count={failed} />;
      return (
        <>
          <p role="status" className="text-bad">
            {toEndText(block)}
          </p>
          <RecordedStudies studies={block.studies} />
        </>
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
      <p className="text-[12px] text-muted">
        {toLabel(group.agent)}
        {depth === 0 ? "" : " · delegated"}
      </p>
      {group.blocks.map((block) => (
        <BlockView key={block.id} block={block} running={running} failed={failed} />
      ))}
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
