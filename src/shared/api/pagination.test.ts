import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { pagedQuery, toItems, type Page } from "./pagination";

const pages: Record<string, Page<number>> = {
  first: { items: [1, 2], next: "second" },
  second: { items: [3], next: null },
};

describe("pagedQuery", () => {
  it("follows the next cursor until it is null", async () => {
    const seen: (string | null)[] = [];
    const options = pagedQuery(["numbers"], (cursor) => {
      seen.push(cursor);
      return Promise.resolve(pages[cursor ?? "first"] ?? { items: [], next: null });
    });
    const client = new QueryClient();
    const first = await client.infiniteQuery(options);
    expect(first.pages).toHaveLength(1);
    const second = await client.infiniteQuery({ ...options, pages: 2 });
    expect(toItems(second.pages)).toEqual([1, 2, 3]);
    expect(seen).toEqual([null, null, "second"]);
  });

  it("gives an empty list before any page is loaded", () => {
    expect(toItems(undefined)).toEqual([]);
  });
});
