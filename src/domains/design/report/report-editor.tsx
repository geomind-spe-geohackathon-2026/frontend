import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { SlidersHorizontal, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { projectQuery } from "@/shared/api/projects";
import { toCaseText, toPlantNote } from "@/shared/ui/out-of-date";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/shared/layout/page-header";
import { Notice } from "@/shared/ui/notice";
import type {
  Project,
  Report,
  ReportPart,
  ReportPartInfo,
  Result,
  Study,
} from "@/shared/api/types";
import type { Run } from "@/shared/api/types";
import { previewQuery } from "./api";
import { ExportButtons } from "./export-buttons";
import { toOrderedParts } from "./parts";
import { useFlowsheetSvg, type FlowsheetPictures } from "./use-flowsheet-svg";
import { ReportDocument } from "./report-document";
import { ReportOptions } from "./report-options";
import { useReportExport } from "./use-export";
import { toDefaultResult, toDefaultRun } from "./defaults";

const compactParts: ReportPart[] = [
  "summary",
  "design",
  "capacities",
  "coverage",
  "checks",
  "costs",
];

type Props = {
  projectId: string;
  results: Result[];
  runs: Run[];
  studies: Study[];
  parts: ReportPartInfo[];
};

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

function OutOfDate({ project, made }: { project: Project | undefined; made: Result | undefined }) {
  if (project === undefined || made === undefined) return null;
  const text = toCaseText(project, made);
  const note = toPlantNote(project, made);
  return (
    <>
      {text === null ? null : (
        <Alert className="border-warn bg-warn-soft">
          <TriangleAlert aria-hidden="true" className="text-warn" />
          <AlertTitle>Out of date</AlertTitle>
          <AlertDescription>{`${text} Do this before you send this report.`}</AlertDescription>
        </Alert>
      )}
      {note === null ? null : <p className="text-[12.5px] text-muted">{note}</p>}
    </>
  );
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
export function ReportEditor({ projectId, results, runs, studies, parts }: Props) {
  const order = parts.map((entry) => entry.key);
  const [params, setParams] = useSearchParams();
  const [chosen, setChosen] = useState<ReportPart[]>(order);
  const result = params.get("result") ?? toDefaultResult(results, studies)?.id ?? "";
  const run =
    params.get("run") ??
    toDefaultRun(
      results.find((entry) => entry.id === result),
      studies,
    );
  const include = toOrderedParts(order, chosen);
  const request = { project: projectId, result, ...(run === "" ? {} : { run }), include };
  const preview = useQuery(previewQuery(request));
  const made = results.find((entry) => entry.id === result);
  const name = made?.name ?? result;
  const project = useQuery(projectQuery(projectId));
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
      <OutOfDate project={project.data} made={made} />
      {exporter.isError ? <Notice status="failed" error={exporter.error} /> : null}
      <PreviewBody include={include} preview={preview} flowsheet={flowsheet} />
    </>
  );
}
