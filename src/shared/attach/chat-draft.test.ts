import { describe, expect, it } from "vitest";
import { clearDraft, keepDraft, keepDraftFiles, readDraft, readDraftFiles } from "./chat-draft";

describe("chat draft", () => {
  it("keeps the goal and the uploaded files for the first message until it is sent", () => {
    keepDraft("p1", "Design a plant");
    keepDraftFiles("p1", ["wells.csv", "site.pdf"]);
    expect(readDraft("p1")).toBe("Design a plant");
    expect(readDraftFiles("p1")).toEqual(["wells.csv", "site.pdf"]);
    clearDraft("p1");
    expect(readDraft("p1")).toBe("");
    expect(readDraftFiles("p1")).toEqual([]);
  });
});
