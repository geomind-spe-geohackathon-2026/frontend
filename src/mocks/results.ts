import { http, HttpResponse, type RequestHandler } from "msw";
import type { Page } from "@/shared/api/pagination";
import type { Coverage, Result, ResultComparison, ResultDetail } from "@/shared/api/types";
import { toErrorResponse } from "./errors";
import { toRoute } from "./url";

function toYear(): Coverage[] {
  const start = Date.UTC(2027, 0, 1);
  return Array.from({ length: 365 }, (_, index) => {
    const date = new Date(start + index * 86_400_000).toISOString().slice(0, 10);
    const down = (index >= 120 && index <= 136) || (index >= 280 && index <= 297);
    return { date, source: down ? "backup" : "geothermal" };
  });
}

const designA: Result = {
  id: "example-result-1",
  name: "Example design A",
  study: "example-study-1",
  case_version: 2,
  plant_version: 3,
  kpis: [
    { name: "heat_capacity", title: "Heat capacity", value: 18, unit: "MW", reason: null },
    { name: "lcoh", title: "LCOH", value: 38.9, unit: "EUR/MWh", reason: null },
    { name: "co2", title: "CO2", value: 27.4, unit: "kt/a", reason: null },
  ],
  checks: { passed: 6, failed: 0, not_assessed: 0 },
  created: "2026-01-12T14:03:00Z",
};

const designB: Result = {
  id: "example-result-2",
  name: "Example design B",
  study: "example-study-2",
  case_version: 2,
  plant_version: 3,
  kpis: [
    { name: "heat_capacity", title: "Heat capacity", value: 31.2, unit: "MW", reason: null },
    { name: "lcoh", title: "LCOH", value: 41.8, unit: "EUR/MWh", reason: null },
    { name: "co2", title: "CO2", value: 19.6, unit: "kt/a", reason: null },
  ],
  checks: { passed: 5, failed: 0, not_assessed: 1 },
  created: "2026-01-12T14:10:00Z",
};

const exampleSummaries: Result[] = [designA, designB];

const exampleDetails: ResultDetail[] = [
  {
    ...designA,
    capacities: [{ name: "heat", title: "Heat", value: 18, unit: "MW", reason: null }],
    coverage: null,
    constraints: [
      {
        name: "return_temperature",
        title: "Return temperature",
        status: "pass",
        message: "within the limit",
      },
    ],
    series: [],
  },
  {
    ...designB,
    capacities: [
      { name: "heat", title: "Heat", value: 31.2, unit: "MW", reason: null },
      { name: "cooling", title: "Cooling", value: 10.4, unit: "MW", reason: null },
    ],
    coverage: toYear(),
    constraints: [
      {
        name: "return_temperature",
        title: "Return temperature",
        status: "pass",
        message: "within the limit",
      },
      {
        name: "pump_efficiency",
        title: "Pump efficiency",
        status: "not_assessed",
        message: "no pump curve given",
      },
    ],
    series: [],
  },
];

/** Example results: design A without coverage (not available) and design B with a daily coverage year. */
export function resultsHandlers(): RequestHandler[] {
  return [
    http.get(toRoute("/design/results"), () =>
      HttpResponse.json<Page<Result>>({ items: exampleSummaries, next: null }),
    ),
    http.get(toRoute("/design/results/compare"), ({ request }) => {
      const ids = new URL(request.url).searchParams.get("ids")?.split(",") ?? [];
      const items = exampleSummaries.filter((summary) => ids.includes(summary.id));
      return HttpResponse.json<ResultComparison>({ items, pareto: items.map((item) => item.id) });
    }),
    http.get<{ id: string }>(toRoute("/design/results/:id"), ({ params }) => {
      const detail = exampleDetails.find((entry) => entry.id === params.id);
      return detail === undefined
        ? toErrorResponse(404, "result_not_found", "No such result")
        : HttpResponse.json<ResultDetail>(detail);
    }),
  ];
}
