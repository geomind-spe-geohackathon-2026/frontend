import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/shared/layout/page-header";
import { Notice } from "@/shared/ui/notice";
import type { Report, ReportPart, ReportPartInfo, Result } from "@/shared/api/types";
import type { Run } from "@/shared/api/types";
import { previewQuery } from "./api";
import { ExportButtons } from "./export-buttons";
import { toOrderedParts } from "./parts";
import { useFlowsheetSvg, type FlowsheetPictures } from "./use-flowsheet-svg";
import { ReportDocument } from "./report-document";
import { ReportOptions } from "./report-options";
import { useReportExport } from "./use-export";

const compactParts: ReportPart[] = [
  "summary",
  "design",
  "capacities",
  "coverage",
  "checks",
  "costs",
];

type Props = { projectId: string; results: Result[]; runs: Run[]; parts: ReportPartInfo[] };

function PreviewBody({
  include,
  preview,
  flowsheet,
}: {
  include: ReportPart[];
  preview: UseQueryResult<Report>;
  flowsheet: FlowsheetPictures | null;
}) {
  if (include.length === 0) return <Notice status="empty">Choose at least one section.</Notice>;
  if (preview.isPending) return <Notice status="loading" what="the preview" />;
  if (preview.isError) return <Notice status="failed" error={preview.error} />;
  return <ReportDocument preview={preview.data} flowsheet={flowsheet} />;
}

function OptionsButton({ children }: { children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>
          <SlidersHorizontal aria-hidden="true" />
          Options
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[70svh] w-80 overflow-y-auto">
        {children}
      </PopoverContent>
    </Popover>
  );
}

/** The report workspace: the live preview, with Options (design, agent log, sections) and export in the header. */
export function ReportEditor({ projectId, results, runs, parts }: Props) {
  const order = parts.map((entry) => entry.key);
  const [params, setParams] = useSearchParams();
  const [chosen, setChosen] = useState<ReportPart[]>(order);
  const result = params.get("result") ?? results[0]?.id ?? "";
  const run = params.get("run") ?? "";
  const include = toOrderedParts(order, chosen);
  const request = { project: projectId, result, ...(run === "" ? {} : { run }), include };
  const preview = useQuery(previewQuery(request));
  const name = results.find((entry) => entry.id === result)?.name ?? result;
  const flowsheet = useFlowsheetSvg(preview.data?.flowsheet);
  const { exporter, handleExport } = useReportExport(request, name, flowsheet);

  function handleParam(key: string, value: string): void {
    setParams((current) => new URLSearchParams({ ...Object.fromEntries(current), [key]: value }));
  }

  function handlePart(part: ReportPart, checked: boolean): void {
    setChosen(checked ? [...chosen, part] : chosen.filter((entry) => entry !== part));
  }

  return (
    <>
      <PageHeader
        title="Report"
        description={`Draft from ${name}.`}
        actions={
          <>
            <OptionsButton>
              <ReportOptions
                results={results}
                runs={runs}
                result={result}
                run={run}
                parts={parts}
                chosen={chosen}
                onResult={(id) => {
                  handleParam("result", id);
                }}
                onRun={(id) => {
                  handleParam("run", id);
                }}
                onPart={handlePart}
                onCompact={() => {
                  setChosen(order.filter((part) => compactParts.includes(part)));
                }}
              />
            </OptionsButton>
            <ExportButtons
              disabled={exporter.isPending || include.length === 0}
              onExport={handleExport}
            />
          </>
        }
      />
      {exporter.isError ? <Notice status="failed" error={exporter.error} /> : null}
      <PreviewBody include={include} preview={preview} flowsheet={flowsheet} />
    </>
  );
}
