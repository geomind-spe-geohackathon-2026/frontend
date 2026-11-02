import type { LogStep } from "@/shared/sse/runlog";

export type Total = { name: string; count: number; input: number; output: number; cost: number };

function add(
  totals: Map<string, Total>,
  name: string,
  input: number,
  output: number,
  cost: number,
) {
  const found = totals.get(name) ?? { name, count: 0, input: 0, output: 0, cost: 0 };
  totals.set(name, {
    name,
    count: found.count + 1,
    input: found.input + input,
    output: found.output + output,
    cost: found.cost + cost,
  });
}

/** Sums the LLM calls of the steps per agent (count = calls) and per model. */
export function toTotals(steps: LogStep[]): { agents: Total[]; models: Total[] } {
  const agents = new Map<string, Total>();
  const models = new Map<string, Total>();
  steps.forEach((step) => {
    step.llm_calls.forEach((call) => {
      add(agents, step.agent, call.input_tokens, call.output_tokens, call.cost);
      add(models, call.model, call.input_tokens, call.output_tokens, call.cost);
    });
  });
  return { agents: [...agents.values()], models: [...models.values()] };
}

/** The total tokens of one step: input plus output of all its LLM calls. */
export function toStepTokens(step: LogStep): number {
  return step.llm_calls.reduce((sum, call) => sum + call.input_tokens + call.output_tokens, 0);
}
