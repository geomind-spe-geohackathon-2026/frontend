import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toSpeed, toTickMs, toWordEnd, usePacedText } from "./paced-text";

describe("toSpeed", () => {
  it("stays calm while text keeps up", () => {
    expect(toSpeed(20)).toBe(45);
  });

  it("speeds up with the backlog, within the brisk limit", () => {
    expect(toSpeed(200)).toBe(100);
    expect(toSpeed(1000)).toBe(240);
  });

  it("finishes even a very long backlog in seconds", () => {
    expect(toSpeed(12_000)).toBe(2000);
  });
});

describe("toTickMs", () => {
  it("updates less often as the text grows", () => {
    expect(toTickMs(100)).toBe(50);
    expect(toTickMs(5000)).toBe(100);
    expect(toTickMs(50_000)).toBe(200);
  });
});

describe("toWordEnd", () => {
  it("never cuts a word", () => {
    expect(toWordEnd("one two three", 5, 0, true)).toBe(8);
    expect(
      toWordEnd(
        "\u0633\u0644\u0627\u0645 \u062f\u0646\u06cc\u0627 \u062e\u0648\u0628\u06cc",
        6,
        0,
        true,
      ),
    ).toBe(10);
  });

  it("holds a word that may still grow, and shows it when the text ends", () => {
    expect(toWordEnd("one tw", 6, 4, true)).toBe(4);
    expect(toWordEnd("one tw", 6, 4, false)).toBe(6);
  });

  it("does not wait forever for the end of a very long word", () => {
    const url = "x".repeat(60);
    expect(toWordEnd(url, 60, 0, true)).toBe(60);
  });

  it("does not split an emoji", () => {
    const text = "😀".repeat(30);
    expect(toWordEnd(text, 1, 0, true) % 2).toBe(0);
  });
});

describe("usePacedText", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const props = (text: string, settled: number, open: boolean) => ({ text, settled, open });
  const render = (text: string, settled: number, open: boolean) =>
    renderHook((p: ReturnType<typeof props>) => usePacedText(p.text, p.settled, p.open), {
      initialProps: props(text, settled, open),
    });

  it("shows settled text at once, as after a reload", () => {
    const text = "already here";
    expect(render(text, text.length, false).result.current).toBe(text);
  });

  it("reveals text gradually and ends with all of it", () => {
    const text = "word ".repeat(40);
    const { result } = render(text, 0, false);
    expect(result.current).toBe("");
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current.length).toBeLessThan(text.length);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current).toBe(text);
  });

  it("keeps what it showed when more text arrives", () => {
    const { result, rerender } = render("first words here ", 0, true);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    const before = result.current;
    expect(before.length).toBeGreaterThan(0);
    rerender(props("first words here and then some more ", 0, true));
    expect(result.current.startsWith(before)).toBe(true);
  });

  it("shows everything at once when motion is reduced", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { result } = render("short text", 0, false);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("short text");
  });
});
