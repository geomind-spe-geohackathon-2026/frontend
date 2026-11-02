import { http, HttpResponse, type RequestHandler } from "msw";
import type { Report, ReportExport, ReportRequest } from "@/shared/api/types";
import { toRoute, type NoParams } from "./url";

const titles: Record<ReportRequest["include"][number], string> = {
  capacities: "Capacities",
  design: "Design",
  checks: "Checks",
  costs: "Costs and sources",
  agentlog: "Agent log",
};

function toPreview(body: ReportRequest): Report {
  return {
    title: `Example report for ${body.result}`,
    sections: body.include.map((key) => ({
      key,
      title: titles[key],
      markdown: key === "costs" ? "Cost per unit: **missing**" : `Example text for ${key}.`,
    })),
  };
}

/** Example report routes: a preview built from the chosen parts and a small export file. */
export function reportHandlers(): RequestHandler[] {
  return [
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
