import { describe, expect, it } from "vitest";
import type { LogStep } from "@/shared/sse/contract";
import { toPretty, toSplit } from "./split";
import { toStepTokens, toTotals } from "./totals";

const call = (model: string, input: number, output: number, cost: number) => ({
  model,
  messages: [],
  answer: "",
  input_tokens: input,
  output_tokens: output,
  cost,
  duration: 1,
});

const steps: LogStep[] = [
  { index: 0, agent: "a", parent: null, llm_calls: [call("m1", 10, 1, 0.1)], tool_calls: [] },
  { index: 1, agent: "a", parent: null, llm_calls: [call("m2", 20, 2, 0.2)], tool_calls: [] },
  { index: 0, agent: "a.b", parent: "r", llm_calls: [call("m1", 5, 5, 0.05)], tool_calls: [] },
];

describe("toTotals", () => {
  it("sums calls, tokens and cost per agent and per model", () => {
    const totals = toTotals(steps);
    expect(totals.agents.find((row) => row.name === "a")).toMatchObject({ count: 2, input: 30 });
    expect(totals.models.find((row) => row.name === "m1")).toMatchObject({ count: 2, output: 6 });
  });

  it("adds the tokens of a step", () => {
    const [first] = steps;
    expect(first === undefined ? null : toStepTokens(first)).toBe(11);
  });
});

describe("toSplit", () => {
  it("collapses the system prompt and past turns and keeps the messages after the last answer", () => {
    const { history, fresh } = toSplit([
      { role: "system", content: "s" },
      { role: "user", content: "u1" },
      { role: "assistant", content: "a1" },
      { role: "tool", content: "t1" },
    ]);
    expect(history.map((message) => message.content)).toEqual(["s", "u1", "a1"]);
    expect(fresh.map((message) => message.content)).toEqual(["t1"]);
  });

  it("formats text as is and objects as indented JSON", () => {
    expect(toPretty("x")).toBe("x");
    expect(toPretty({ a: 1 })).toBe('{\n  "a": 1\n}');
  });
});
