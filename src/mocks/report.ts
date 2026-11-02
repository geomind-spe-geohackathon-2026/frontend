import { http, HttpResponse, type RequestHandler } from "msw";
import type { Report, ReportExport, ReportPartInfo, ReportRequest } from "@/shared/api/types";
import { toRoute, type NoParams } from "./url";

const parts: ReportPartInfo[] = [
  { key: "capacities", title: "Capacities" },
  { key: "design", title: "Design" },
  { key: "checks", title: "Constraint checks" },
  { key: "costs", title: "Costs and sources" },
  { key: "agentlog", title: "Agent log and tokens" },
  { key: "summary", title: "Summary" },
];

function toTitle(key: ReportPartInfo["key"]): string {
  return parts.find((part) => part.key === key)?.title ?? key;
}

function toMarkdown(key: ReportRequest["include"][number]): string {
  if (key === "costs") return "Cost per unit: **missing**";
  if (key === "capacities") return "| Module | Capacity |\n| --- | --- |\n| Example pump | 3 MW |";
  return `Example text for ${key}.`;
}

function toPreview(body: ReportRequest): Report {
  return {
    title: `Example report for ${body.result}`,
    sections: body.include.map((key) => ({
      key,
      title: toTitle(key),
      markdown: toMarkdown(key),
    })),
  };
}

/** Example report routes: a preview built from the chosen parts and a small export file. */
export function reportHandlers(): RequestHandler[] {
  return [
    http.get(toRoute("/reporting/design/parts"), () => HttpResponse.json<ReportPartInfo[]>(parts)),
    http.post<NoParams, ReportRequest>(toRoute("/reporting/design/preview"), async ({ request }) =>
      HttpResponse.json<Report>(toPreview(await request.json())),
    ),
    http.post<NoParams, ReportExport>(toRoute("/reporting/design/export"), async ({ request }) => {
      const body = await request.json();
      const text = toPreview(body)
        .sections.map((section) => `## ${section.title}\n\n${section.markdown}`)
        .join("\n\n");
      return new HttpResponse(text, { headers: { "Content-Type": "text/markdown" } });
    }),
  ];
}
