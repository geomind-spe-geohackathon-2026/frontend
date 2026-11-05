import { Duration } from "@/shared/quantity/usage";
import { memo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";
import { Link, useParams } from "react-router-dom";
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
import { BusyMark } from "./busy";
import { toDecisionText } from "./answers";
import { ToolResultView, toResultId, type Calculation } from "@/shared/sse/tool-views";
import { toDepth, toLabel } from "./agents";
import { toAgentName } from "@/shared/sse/agent-names";
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

function toOwnCalculations(block: ToolBlock, calculations: Calculation[]): Calculation[] {
  const id = toResultId(block.summary);
  if (id === null) return [];
  if (block.tool === "calculate") return calculations.filter((item) => item.id === id);
  return calculations.filter((item) => item.expression.startsWith(`run_python ${id}`));
}

function toCalculationLine(block: ToolBlock, calculations: Calculation[]): string | null {
  if (block.tool !== "calculate") return null;
  const [own] = toOwnCalculations(block, calculations);
  return own === undefined ? null : `${own.label} = ${String(Number(own.value.toPrecision(6)))} ${own.unit}`.trim();
}

const fullViewTools = ["calculate", "run_python", "web_search", "read_web_page", "set_case"];

function useFullCall(runId: string | null, block: ToolBlock, open: boolean) {
  return useQuery({
    queryKey: ["run-call", runId, block.id],
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/assistant/runs/{run_id}/calls/{call_id}", {
          params: { path: { run_id: runId ?? "", call_id: block.id } },
          signal,
        }),
      ),
    enabled: open && runId !== null && block.state === "done" && fullViewTools.includes(block.tool),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
}

function ToolCard({
  block,
  calculations,
  runId,
}: {
  block: ToolBlock;
  calculations: Calculation[];
  runId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const call = useFullCall(runId, block, open);
  const tone = block.state === "failed" ? "bad" : block.state === "done" ? "ok" : "info";
  const full = call.data?.output ?? null;
  const view =
    block.error === null && fullViewTools.includes(block.tool) ? (
      <ToolResultView
        tool={block.tool}
        input={block.input}
        output={full}
        calculations={toOwnCalculations(block, calculations)}
      />
    ) : null;
  return (
    <details
      className="rounded-control border border-border bg-surface"
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5">
        <Badge variant={tone}>{block.state}</Badge>
        <span>{toToolName(block.tool)}</span>
        <span
          className={`min-w-0 flex-1 truncate ${block.error === null ? "text-muted" : "text-bad"}`}
        >
          {block.error === null
            ? (toCalculationLine(block, calculations) ?? toSummary(block.summary))
            : toFailureText(block.error, block.problem)}
        </span>
        {block.duration === null ? null : <Duration seconds={block.duration} />}
      </summary>
      <div className="space-y-2 border-t border-border p-2.5">
        {view === null ? null : (
          <>
            {view}
            {full !== null ? null : (
              <p className="text-[12px] text-muted">
                {call.isFetching ? "Loading the full result..." : "The full result is in Runs and logs."}
              </p>
            )}
          </>
        )}
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
  return reason === internalStop ? internalFailure : `Run ${status}: ${toFailureText(message)}`;
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
  if (block.kind === "request") {
    return block.resolved && toDecisionText(block.request.request, block.request.message, block.answer) === null;
  }
  return block.kind === "text" && toShownText(block) !== null;
}

function toLatest(blocks: Block[]): string {
  const last = blocks.findLast((block) => block.kind === "tool" && block.state === "running");
  return last?.kind === "tool" ? toToolName(last.tool) : "Thinking";
}

const doingTexts: Record<string, string> = {
  read_case: "Reading the case",
  set_case: "Writing the case",
  describe_case: "Looking up the case's fields",
  ask_user: "Waiting for your answer",
  ask_economics: "Asking you about the economics",
  list_files: "Listing the project documents",
  read_document: "Reading a document",
  rag_search: "Searching the files and Knowledge",
  rag_read: "Reading a document",
  search_knowledge: "Searching the Knowledge",
  list_mcp: "Listing the connectors",
  save_mcp_table: "Saving a connector table to the case",
  build_plant: "Building the plant",
  read_plant: "Reading the plant",
  patch_plant: "Changing the plant",
  size_plant: "Sizing the plant",
  run_simulation: "Running the simulation",
  run_study: "Running a study",
  set_ranges: "Setting the search ranges",
  compare_runs: "Comparing the runs",
  estimate_costs: "Estimating the costs",
  write_report: "Writing the report",
  calculate: "Calculating",
  run_python: "Running Python code",
  finish: "Handing over",
};

function readInput(input: unknown, key: string): string | null {
  if (typeof input !== "object" || input === null || !(key in input)) return null;
  const value: unknown = (input as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function toDoing(blocks: Block[], agent: string, agents: string[]): string {
  const own = blocks.filter((block) => block.agent === agent);
  const call = own.findLast((block) => block.kind === "tool" && block.state === "running");
  if (call?.kind !== "tool") return "Thinking";
  const { tool, input } = call;
  const server = readInput(input, "server") ?? (tool.includes("__") ? tool.split("__")[0] ?? null : null);
  if ((tool === "call_mcp" || tool === "read_mcp" || tool.includes("__")) && server !== null) {
    return `Asking connector ${server}`;
  }
  if (tool === "web_search") {
    const query = readInput(input, "query");
    return query === null ? "Searching the web" : `Searching the web for ${query}`;
  }
  if (tool === "read_web_page") {
    const url = readInput(input, "url");
    return url === null ? "Reading a web page" : `Reading ${url}`;
  }
  if (agents.some((path) => toLabel(path).split(".").at(-1) === tool) || /_(lead|engineer)$/.test(tool)) {
    return `Asking the ${toAgentName(tool).toLowerCase()}`;
  }
  return doingTexts[tool] ?? toToolName(tool);
}

function DoingLine({ text }: { text: string }) {
  return (
    <span className="min-w-0 truncate" title={text}>
      · {text}
    </span>
  );
}

function WorkingAgents({ blocks, agents }: { blocks: Block[]; agents: string[] }) {
  return (
    <ul className="space-y-0.5">
      {agents.map((agent) => (
        <li
          key={agent}
          className="flex min-w-0 items-center gap-1.5 text-muted"
          style={{ paddingLeft: `${String(toDepth(agent) * 12)}px` }}
        >
          <BusyMark />
          <span className="shrink-0 font-medium text-foreground">{toAgentName(agent)}</span>
          <DoingLine text={toDoing(blocks, agent, agents)} />
        </li>
      ))}
    </ul>
  );
}

function toRunningLabel(work: Block[]): string {
  const steps = work.filter((block) => block.kind === "tool").length;
  return `Steps so far (${String(steps)} ${steps === 1 ? "step" : "steps"})`;
}

function toDoneLabel(work: Block[]): string {
  const steps = work.filter((block) => block.kind === "tool").length;
  const failed = toFailedCount(work);
  const label = `Worked through ${String(steps)} ${steps === 1 ? "step" : "steps"}`;
  return failed === 0 ? label : `${label}, ${String(failed)} needed another try`;
}

const WorkItem = memo(function WorkItem({
  block,
  calculations,
  runId,
}: {
  block: Block;
  calculations: Calculation[];
  runId: string | null;
}) {
  if (block.kind === "tool") {
    return <ToolCard block={block} calculations={calculations} runId={runId} />;
  }
  if (block.kind === "request") {
    const decision = toDecisionText(block.request.request, block.request.message, block.answer);
    return (
      <p className="text-[12px] whitespace-pre-line text-muted [overflow-wrap:anywhere]">
        {decision ?? toRequestText(block.request.message)}
      </p>
    );
  }

  if (block.kind !== "text") return null;
  return (
    <div className="text-muted">
      <MarkdownText text={block.text} />
    </div>
  );
});

function Decisions({ blocks }: { blocks: Block[] }) {
  const lines = blocks.flatMap((block) => {
    if (block.kind !== "request" || !block.resolved) return [];
    const text = toDecisionText(block.request.request, block.request.message, block.answer);
    return text === null ? [] : [{ id: block.id, text }];
  });
  if (lines.length === 0) return null;
  return (
    <ul className="space-y-0.5 text-[12.5px] text-muted">
      {lines.map((line) => (
        <li key={line.id} className="[overflow-wrap:anywhere]">
          {line.text}
        </li>
      ))}
    </ul>
  );
}

function WorkLog({
  work,
  label,
  calculations,
  runId,
}: {
  work: Block[];
  label: string;
  calculations: Calculation[];
  runId: string | null;
}) {
  return (
    <details className="space-y-1.5">
      <summary className="cursor-pointer text-muted">{label}</summary>
      {work.map((block) => (
        <WorkItem key={block.id} block={block} calculations={calculations} runId={runId} />
      ))}
    </details>
  );
}

/** A run as one quiet line of work that opens to its steps; only the answer and a stop stand out. */
export function Blocks({
  blocks,
  running,
  retry = null,
  agents = [],
  waiting = false,
  calculations = [],
  runId = null,
}: {
  blocks: Block[];
  running: boolean;
  retry?: string | null;
  agents?: string[];
  waiting?: boolean;
  calculations?: Calculation[];
  runId?: string | null;
}) {
  const last = running ? toLiveBlock(blocks) : toAnswer(blocks);
  const answer = last === null ? null : running ? toLiveText(last.text) : toAnswerText(last);
  const work = blocks.filter((block) => isWork(block) && block.id !== last?.id);
  const end = blocks.find((block) => block.kind === "end");
  const stopped = end?.kind === "end" && end.status !== "done";
  const failure = toLastFailure(blocks);
  return (
    <div className="space-y-2.5">
      {running ? (
        <div role="status" className="space-y-0.5 text-muted">
          {waiting ? (
            <p className="text-warn">Waiting for your answer below</p>
          ) : agents.length === 0 ? (
            <p>{toLatest(blocks)}</p>
          ) : (
            <WorkingAgents blocks={blocks} agents={agents} />
          )}
          {retry === null ? null : <p className="text-warn">{retry}</p>}
        </div>
      ) : null}
      {work.length === 0 ? null : (
        <WorkLog
          work={work}
          label={running ? toRunningLabel(work) : toDoneLabel(work)}
          calculations={calculations}
          runId={runId}
        />
      )}
      <Decisions blocks={blocks} />
      {answer === null || last === null ? null : (
        <PacedMarkdown
          key={last.id}
          text={answer}
          settled={last.open ? last.settled : answer.length}
          open={last.open}
        />
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
