import { Duration, Tokens } from "@/shared/quantity/usage";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { AgentSession, RunAgents } from "@/shared/api/pending";
import { Quantity } from "@/shared/quantity/quantity";
import { toToolName } from "@/shared/sse/pretty";
import { toAgentName } from "@/shared/sse/agent-names";
import { Ring } from "./ring";

function toShare(agent: AgentSession): number | null {
  if (agent.context_used === null || agent.context_window === null || agent.context_window === 0) {
    return null;
  }
  return agent.context_used / agent.context_window;
}

function ContextShare({ share }: { share: number | null }) {
  if (share === null) return <span className="size-4 shrink-0" />;
  const percent = `${String(Math.round(share * 100))} %`;
  return (
    <span className="flex shrink-0 items-center gap-1" title={`Context used: ${percent} of the window`}>
      <Ring share={share} />
      <span className="text-[11px] text-muted-foreground tabular-nums">{percent}</span>
    </span>
  );
}

function ContextLine({ agent }: { agent: AgentSession }) {
  if (agent.context_used === null) return <span>context n/a</span>;
  return (
    <span>
      <Tokens value={agent.context_used} unit="tokens" />
      {agent.context_left === null ? null : (
        <>
          {" used, "}
          <Tokens value={agent.context_left} unit="left" />
        </>
      )}
    </span>
  );
}

function isFailed(call: AgentSession["tool_calls"][number]): boolean {
  return call.error === true || (typeof call.error === "string" && call.error !== "");
}

function AgentRow({ agent }: { agent: AgentSession }) {
  const failed = agent.tool_calls.filter(isFailed).length;
  return (
    <Collapsible asChild>
      <li className="rounded-md border px-2 py-1.5">
        <CollapsibleTrigger className="group flex w-full items-center gap-2 text-left">
          <ContextShare share={toShare(agent)} />
          <span className="min-w-0 flex-1 truncate font-medium" title={agent.agent}>
            {agent.instance ?? toAgentName(agent.agent)}
          </span>
          <span className="text-muted-foreground tabular-nums">
            <Quantity value={agent.cost} unit="USD" fractionDigits={3} />
          </span>
          <ChevronRight
            aria-hidden="true"
            className="size-3.5 transition-transform group-data-[state=open]:rotate-90"
          />
        </CollapsibleTrigger>
        <div className="mt-1 pl-6 text-[12px] text-muted-foreground">
          <ContextLine agent={agent} />
          {" · "}
          <Tokens value={agent.input_tokens} unit="in" />
          {" · "}
          <Tokens value={agent.output_tokens} unit="out" />
          {` · ${String(agent.tool_calls.length)} tool calls`}
          {failed > 0 ? <span className="text-bad">{` (${String(failed)} failed)`}</span> : null}
        </div>
        <CollapsibleContent>
          <ul className="m-0 mt-1 list-none space-y-0.5 p-0 pl-6 text-[12px]">
            {agent.tool_calls.length === 0 ? (
              <li className="text-muted-foreground">No tool calls.</li>
            ) : null}
            {agent.tool_calls.map((call) => (
              <li key={call.call_id} className={isFailed(call) ? "text-bad" : ""}>
                {toToolName(call.tool)}
                {call.duration === null ? null : (
                  <span className="text-muted-foreground"> · <Duration seconds={call.duration} /></span>
                )}
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
}

/** What each agent session of the last run used: its own context ring (latest call over its window), tokens, cost and tool calls; the run's totals on top. */
export function AgentUsage({ data }: { data: RunAgents }) {
  const { run } = data;
  return (
    <section aria-label="Agents of the last run" className="flex flex-col gap-1.5">
      <p className="text-[12px] text-muted-foreground">
        {"Last run: "}
        <Quantity value={run.cost} unit="USD" fractionDigits={3} />
        {` · ${String(run.llm_calls)} model calls · ${String(run.tool_calls)} tool calls`}
      </p>
      <ul className="m-0 flex max-h-72 list-none flex-col gap-1 overflow-y-auto p-0">
        {data.agents.map((agent) => (
          <AgentRow key={agent.session} agent={agent} />
        ))}
      </ul>
    </section>
  );
}
