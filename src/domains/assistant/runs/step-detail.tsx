import { Quantity } from "@/shared/quantity/quantity";
import type { LlmCall, LogMessage, LogStep, ToolCall } from "@/shared/sse/runlog";
import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fromRoute, toRouteLabel } from "@/shared/sse/route";
import { toProblem } from "@/shared/sse/events";
import { toFailureText, toPretty as toPrettyText, toToolName } from "@/shared/sse/pretty";
import { toPretty, toSplit } from "./split";

function toAnswer(answer: string): string {
  const route = fromRoute(answer);
  if (route === null) return answer;
  return route.kind === "answer" ? route.answer : toRouteLabel(route);
}

function toOutput(output: unknown): string {
  return typeof output === "string" ? toPrettyText(output) : toPretty(output);
}

function toCallFailure(call: ToolCall): string {
  if (typeof call.error === "string" && call.error !== "") return toFailureText(call.error);
  const output: unknown = call.output;
  const fields = typeof output === "object" && output !== null ? (output as Record<string, unknown>) : null;
  const problem = fields === null ? null : toProblem(fields.error);
  if (problem !== null) return toFailureText("", problem);
  return typeof output === "string" ? toFailureText(output) : "The tool call failed.";
}

function Messages({ messages }: { messages: LogMessage[] }) {
  return (
    <ul className="space-y-1.5">
      {messages.map((message, position) => (
        <li key={position}>
          <span className="text-[11.5px] tracking-wide text-muted uppercase">{message.role}</span>
          <pre className="rounded-control bg-sunken p-2 font-mono text-[12px] whitespace-pre-wrap">
            {message.content}
          </pre>
        </li>
      ))}
    </ul>
  );
}

function LlmCard({ call, label }: { call: LlmCall; label: string }) {
  const { history, fresh } = toSplit(call.messages);
  return (
    <Card>
      <CardHeader>
        <h2>LLM call · {label}</h2>
        <CardAction className="font-mono text-[12px] text-muted">
          {call.model} · <Quantity value={call.input_tokens} unit="in" fractionDigits={0} /> ·{" "}
          <Quantity value={call.output_tokens} unit="out" fractionDigits={0} /> ·{" "}
          <Quantity value={call.cost} unit="USD" fractionDigits={3} /> ·{" "}
          <Quantity value={call.duration} unit="s" />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <details>
          <summary className="cursor-pointer">System prompt and history ({history.length})</summary>
          <div className="mt-2">
            <Messages messages={history} />
          </div>
        </details>
        <section aria-label="New messages" className="space-y-1.5">
          <h3 className="text-[11.5px] tracking-wide text-muted uppercase">New messages</h3>
          {fresh.length === 0 ? <p className="text-muted">None.</p> : <Messages messages={fresh} />}
        </section>
        <section aria-label="Answer" className="space-y-1.5">
          <h3 className="text-[11.5px] tracking-wide text-muted uppercase">Answer</h3>
          <pre className="rounded-control bg-sunken p-2 font-mono text-[12px] whitespace-pre-wrap">
            {toAnswer(call.answer)}
          </pre>
        </section>
      </CardContent>
    </Card>
  );
}

function ToolCard({ call }: { call: ToolCall }) {
  const failed = call.error !== undefined && call.error !== false;
  return (
    <Card>
      <CardHeader>
        <h2>Tool call · {toToolName(call.tool)}</h2>
        <CardAction className="flex items-center gap-2">
          <Quantity value={call.duration} unit="s" />
          <Badge variant={failed ? "bad" : "ok"}>{failed ? "failed" : "ok"}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
        <section aria-label="Input" className="min-w-0 space-y-1.5">
          <h3 className="text-[11.5px] tracking-wide text-muted uppercase">Input</h3>
          <pre className="overflow-x-auto rounded-control bg-sunken p-2 font-mono text-[12px]">
            {toPretty(call.input)}
          </pre>
        </section>
        <section aria-label="Output" className="min-w-0 space-y-1.5">
          <h3 className="text-[11.5px] tracking-wide text-muted uppercase">Output</h3>
          <pre className="overflow-x-auto rounded-control bg-sunken p-2 font-mono text-[12px]">
            {toOutput(call.output)}
          </pre>
          {failed ? <p className="text-bad">{toCallFailure(call)}</p> : null}
        </section>
      </CardContent>
    </Card>
  );
}

/** The selected step: its LLM calls and tool calls in order, as the exact record of the run. */
export function StepDetail({ step }: { step: LogStep }) {
  const label = `${step.agent} · step ${String(step.index)}`;
  return (
    <div className="space-y-3">
      {step.llm_calls.map((call, position) => (
        <LlmCard key={position} call={call} label={label} />
      ))}
      {step.tool_calls.map((call) => (
        <ToolCard key={call.call_id} call={call} />
      ))}
    </div>
  );
}
