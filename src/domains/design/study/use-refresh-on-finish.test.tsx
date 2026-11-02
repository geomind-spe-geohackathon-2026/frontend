import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useRefreshOnFinish } from "./use-refresh-on-finish";

describe("useRefreshOnFinish", () => {
  it("invalidates the project when the active studies finish, not before", () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { rerender } = renderHook(
      ({ active }) => {
        useRefreshOnFinish("p1", active);
      },
      {
        wrapper,
        initialProps: { active: true },
      },
    );
    expect(spy).not.toHaveBeenCalled();
    rerender({ active: false });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["projects", "p1"] });
  });
});
