import { memo } from "react";
import { Link, useParams } from "react-router-dom";
import { Quantity } from "@/shared/quantity/quantity";
import { Badge } from "@/components/ui/badge";
import { MarkdownText } from "@/shared/ui/markdown-text";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  toFailureText,
  toToolName,
  toPretty,
  toRequestText,
  toBudgetStop,
  toSummary,
} from "@/shared/sse/pretty";
import { fromPartialRoute, fromRoute } from "@/shared/sse/route";
import { PacedMarkdown } from "./paced-markdown";
import type { Block, RecordedStudy } from "./view";

type ToolBlock = Extract<Block, { kind: "tool" }>;
type TextBlock = Extract<Block, { kind: "text" }>;
type EndBlock = Extract<Block, { kind: "end" }>;

const internalStop = "error";
const partialLoopNote = /^[a-z]*( loop(:( \{.*)?)?)?$/;
const internalFailure = "The assistant stopped with an internal error in geomind";
const interruptedStart = "The run stopped because the app was updated or restarted";

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
          toast("Copied");
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
        <Badge variant={tone}>{block.state}</Badge>
        <span>{toToolName(block.tool)}</span>
        <span
          className={`min-w-0 flex-1 truncate ${block.error === null ? "text-muted" : "text-bad"}`}
        >
          {block.error === null
            ? toSummary(block.summary)
            : toFailureText(block.error, block.problem)}
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
        {block.error === null ? null : (
          <p className="text-bad">{toFailureText(block.error, block.problem)}</p>
        )}
      </div>
    </details>
  );
}

const stopTexts: Record<string, string> = {
  no_alternatives: "Stopped: no plant family could be designed for this case.",
  no_verified: "Stopped: designs were found, but none passed verification.",
};

function toEndText(block: EndBlock, problem: string | null): string {
  const { status, message, reason } = block;
  const known = stopTexts[reason];
  if (known !== undefined) return known;
  if (status === "failed" && problem !== null) return problem;
  if (status === "cancelled" || message === null) return `Run ${status}`;
  if (message.startsWith(interruptedStart)) return message;
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

function toLastProblem(blocks: Block[]): string | null {
  const last = blocks.filter((block) => block.kind === "tool" && block.tool !== finishTool).at(-1);
  if (last?.kind !== "tool" || last.problem === null) return null;
  return toFailureText(last.error ?? "", last.problem);
}

function toLastFailure(blocks: Block[]): string | null {
  const tools = blocks.filter((block) => block.kind === "tool" && block.tool !== finishTool);
  const last = tools.at(-1);
  return last?.kind === "tool" && last.error !== null
    ? toFailureText(last.error, last.problem)
    : null;
}

function isHiddenText(text: string): boolean {
  return text.trim() === "" || /^[a-z]+ loop: \{.*\}$/.test(text.trim());
}

function toShownText(block: TextBlock): string | null {
  if (block.open && toLiveText(block.text) === null) return null;
  const route = fromRoute(block.text);
  if (route !== null) return null;
  return isHiddenText(block.text) ? null : block.text;
}

function toLiveText(text: string): string | null {
  const route = fromRoute(text);
  if (route !== null) return route.kind === "answer" ? route.answer : null;
  if (text.trimStart().startsWith("{")) return fromPartialRoute(text);
  return isHiddenText(text) || partialLoopNote.test(text.trim()) ? null : text;
}

function toLiveBlock(blocks: Block[]): TextBlock | null {
  const last = blocks.findLast((block) => block.kind === "text" && toLiveText(block.text) !== null);
  return last?.kind === "text" ? last : null;
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

const WorkItem = memo(function WorkItem({ block }: { block: Block }) {
  if (block.kind === "tool") return <ToolCard block={block} />;
  if (block.kind === "request") {
    return <p className="text-[12px] whitespace-pre-line text-muted [overflow-wrap:anywhere]">
        {toRequestText(block.request.message)}
      </p>;
  }
  if (block.kind !== "text") return null;
  return (
    <div className="text-muted">
      <MarkdownText text={block.text} />
    </div>
  );
});

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
  const last = running ? toLiveBlock(blocks) : toAnswer(blocks);
  const answer = last === null ? null : running ? toLiveText(last.text) : toAnswerText(last);
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
      {answer === null || last === null ? null : (
        <PacedMarkdown key={last.id} text={answer} settled={last.settled} open={last.open} />
      )}
      {!running && !stopped && failure !== null ? (
        <p role="status" className="text-bad">
          {failure}
        </p>
      ) : null}
      {stopped ? (
        <>
          <p role="status" className="text-bad">
            {toEndText(end, toLastProblem(blocks))}
          </p>
          <RecordedStudies studies={end.studies} />
        </>
      ) : null}
    </div>
  );
}
