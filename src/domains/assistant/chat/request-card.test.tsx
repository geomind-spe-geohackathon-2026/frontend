import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RunRequest } from "@/shared/sse/types";
import { RequestCard } from "./request-card";

function show(request: RunRequest, onAnswer = vi.fn()) {
  render(<RequestCard request={request} pending={false} failure={null} onAnswer={onAnswer} />);
  return onAnswer;
}

const choice: RunRequest = {
  request: "q1",
  kind: "question",
  message: "Which source?",
  options: [
    { value: "deep", label: "Deep well" },
    { value: "shallow", label: "Shallow field" },
  ],
};

describe("question card", () => {
  it("takes a typed answer next to the options", async () => {
    const onAnswer = show(choice);
    const user = userEvent.setup();
    expect(screen.getByRole("button", { name: "Deep well" })).toBeVisible();
    await user.type(screen.getByLabelText("Or type your own answer"), "Both, deep first");
    await user.click(screen.getByRole("button", { name: "Answer" }));
    expect(onAnswer).toHaveBeenCalledWith({ text: "Both, deep first" });
  });

  it("keeps the step-limit question to its options", () => {
    show({
      ...choice,
      options: [
        { value: "continue", label: "Continue" },
        { value: "stop", label: "Stop" },
      ],
    });
    expect(screen.getByRole("button", { name: "Continue" })).toBeVisible();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
