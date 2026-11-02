import { Link, useParams } from "react-router-dom";
import { Quantity } from "@/shared/quantity/quantity";
import { Chip } from "@/shared/ui/chip";
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
import { fromRoute } from "@/shared/sse/route";
import type { Block, RecordedStudy } from "./view";

type ToolBlock = Extract<Block, { kind: "tool" }>;
type TextBlock = Extract<Block, { kind: "text" }>;
type EndBlock = Extract<Block, { kind: "end" }>;

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

function toEndText(block: EndBlock): string {
  const { status, message, reason } = block;
  if (status === "cancelled" || message === null) return `Run ${status}`;
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

function toLastFailure(blocks: Block[]): string | null {
  const tools = blocks.filter((block) => block.kind === "tool" && block.tool !== finishTool);
  const last = tools.at(-1);
  return last?.kind === "tool" && last.error !== null ? toFailureText(last.error) : null;
}

function isHiddenText(text: string): boolean {
  return text.trim() === "" || /^[a-z]+ loop: \{.*\}$/.test(text.trim());
}

function toShownText(block: TextBlock): string | null {
  const route = fromRoute(block.text);
  if (route !== null) return null;
  return isHiddenText(block.text) ? null : block.text;
}

function toAnswer(blocks: Block[]): TextBlock | null {
  if (blocks.some((block) => block.kind === "tool" && block.tool === finishTool)) return null;
  const last = blocks.findLast((block) => block.kind === "text" && !block.open);
  return last?.kind === "text" ? last : null;
}

function toAnswerText(block: TextBlock): string | null {
  const route = fromRoute(block.text);
  if (route !== null) return route.kind === "answer" ? route.answer : null;
  return isHiddenText(block.text) ? null : block.text;
}

function isWork(block: Block): boolean {
  if (block.kind === "tool") return block.tool !== finishTool || block.error !== null;
  if (block.kind === "request") return block.resolved;
  return block.kind === "text" && toShownText(block) !== null;
}

function toLatest(blocks: Block[]): string {
  const last = blocks.findLast((block) => block.kind === "tool" && block.state === "running");
  return last?.kind === "tool" ? toToolName(last.tool) : "Thinking";
}

function toDoneLabel(work: Block[]): string {
  const steps = work.filter((block) => block.kind === "tool").length;
  const failed = toFailedCount(work);
  const label = `Worked through ${String(steps)} ${steps === 1 ? "step" : "steps"}`;
  return failed === 0 ? label : `${label}, ${String(failed)} needed another try`;
}

function WorkItem({ block }: { block: Block }) {
  if (block.kind === "tool") return <ToolCard block={block} />;
  if (block.kind === "request") {
    return <p className="text-[12px] text-muted">{toRequestText(block.request.message)}</p>;
  }
  if (block.kind !== "text") return null;
  return (
    <div className="text-muted">
      <MarkdownText text={block.text} />
    </div>
  );
}

function WorkLog({ work, label }: { work: Block[]; label: string }) {
  return (
    <details className="space-y-1.5">
      <summary className="cursor-pointer text-muted">{label}</summary>
      {work.map((block) => (
        <WorkItem key={block.id} block={block} />
      ))}
    </details>
  );
}

/** A run as one quiet line of work that opens to its steps; only the answer and a stop stand out. */
export function Blocks({ blocks, running }: { blocks: Block[]; running: boolean }) {
  const last = running ? null : toAnswer(blocks);
  const answer = last === null ? null : toAnswerText(last);
  const work = blocks.filter((block) => isWork(block) && block.id !== last?.id);
  const end = blocks.find((block) => block.kind === "end");
  const stopped = end?.kind === "end" && end.status !== "done";
  const failure = toLastFailure(blocks);
  return (
    <div className="space-y-2.5">
      {running ? (
        <p role="status" className="text-muted">
          {toLatest(blocks)}
        </p>
      ) : null}
      {work.length === 0 ? null : (
        <WorkLog work={work} label={running ? "Steps so far" : toDoneLabel(work)} />
      )}
      {answer === null ? null : <MarkdownText text={answer} />}
      {!running && !stopped && failure !== null ? (
        <p role="status" className="text-bad">
          {failure}
        </p>
      ) : null}
      {stopped ? (
        <>
          <p role="status" className="text-bad">
            {toEndText(end)}
          </p>
          <RecordedStudies studies={end.studies} />
        </>
      ) : null}
    </div>
  );
}
