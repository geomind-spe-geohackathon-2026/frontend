import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RunRequest } from "@/shared/sse/types";
import { useApproveByItself, useAutoApprove } from "./auto-approve";

const approval: RunRequest = { request: "q1", kind: "approval", message: "Allow build_plant?" };

describe("auto-approve", () => {
  it("is off until turned on and remembers the choice per project", () => {
    const first = renderHook(() => useAutoApprove("p-auto"));
    expect(first.result.current[0]).toBe(false);
    act(() => {
      first.result.current[1](true);
    });
    expect(renderHook(() => useAutoApprove("p-auto")).result.current[0]).toBe(true);
    expect(renderHook(() => useAutoApprove("p-other")).result.current[0]).toBe(false);
  });

  it("approves each approval once while on, and never a question", () => {
    const approve = vi.fn();
    const hook = renderHook(
      ({ on, request }) => {
        useApproveByItself(on, request, approve);
      },
      { initialProps: { on: true, request: approval } },
    );
    hook.rerender({ on: true, request: { ...approval } });
    expect(approve).toHaveBeenCalledTimes(1);
    expect(approve).toHaveBeenCalledWith("q1");
    hook.rerender({ on: true, request: { ...approval, request: "q2", kind: "question" as const } });
    expect(approve).toHaveBeenCalledTimes(1);
  });

  it("leaves approvals to the user while off", () => {
    const approve = vi.fn();
    renderHook(() => {
      useApproveByItself(false, approval, approve);
    });
    expect(approve).not.toHaveBeenCalled();
  });
});
