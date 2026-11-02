import { matchRoutes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { assistantRoutes } from "@/domains/assistant/routes";
import { designRoutes } from "@/domains/design/routes";
import { toActivityPath } from "@/domains/workspace/overview/link";

const routes = [...(designRoutes.project ?? []), ...(assistantRoutes.project ?? [])].map(
  (route) => ({ path: route.path ?? "" }),
);

const written = [
  { route: "design/case", id: null, param: null },
  { route: "design/plant", id: null, param: null },
  { route: "design/study", id: null, param: null },
  { route: "design/results", id: "example-result-1", param: "resultId" },
  { route: "design/report", id: null, param: null },
  { route: "assistant/runs", id: "example-run-1", param: "runId" },
];

describe("activity links of the backend", () => {
  it.each(written)("$route opens a page of the project", ({ route, id, param }) => {
    const path = toActivityPath("example-project-1", { route, id }).replace(
      "/projects/example-project-1",
      "",
    );
    const matches = matchRoutes(routes, path);
    expect(matches).not.toBeNull();
    expect(param === null ? null : matches?.[0]?.params[param]).toBe(param === null ? null : id);
  });
});
