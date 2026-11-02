import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/shared/layout/page-header";
import { Notice } from "@/shared/ui/notice";
import type { ReportPart, Result } from "@/shared/api/types";
import type { Run } from "@/shared/api/types";
import { previewQuery } from "./api";
import { ExportButtons } from "./export-buttons";
import { reportParts, toOrderedParts } from "./parts";
import { ReportDocument } from "./report-document";
import { ReportOptions } from "./report-options";
import { useReportExport } from "./use-export";

type Props = { projectId: string; results: Result[]; runs: Run[] };

const allParts = reportParts.map((entry) => entry.part);

/** The report workspace: options on the right, live preview on the left, export buttons in the header. */
export function ReportEditor({ projectId, results, runs }: Props) {
  const [params, setParams] = useSearchParams();
  const [chosen, setChosen] = useState<ReportPart[]>(allParts);
  const result = params.get("result") ?? results[0]?.id ?? "";
  const run = params.get("run") ?? "";
  const include = toOrderedParts(chosen);
  const request = { project: projectId, result, ...(run === "" ? {} : { run }), include };
  const preview = useQuery(previewQuery(request));
  const name = results.find((entry) => entry.id === result)?.name ?? result;
  const { exporter, handleExport } = useReportExport(request, name);

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
          <ExportButtons
            disabled={exporter.isPending || include.length === 0}
            onExport={handleExport}
          />
        }
      />
      {exporter.isError ? <Notice status="failed" error={exporter.error} /> : null}
      <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {include.length === 0 ? (
            <Notice status="empty">Choose at least one section.</Notice>
          ) : null}
          {include.length > 0 && preview.isPending ? (
            <Notice status="loading" what="the preview" />
          ) : null}
          {preview.isError ? <Notice status="failed" error={preview.error} /> : null}
          {include.length > 0 && preview.data !== undefined ? (
            <ReportDocument preview={preview.data} />
          ) : null}
        </div>
        <ReportOptions
          results={results}
          runs={runs}
          result={result}
          run={run}
          chosen={chosen}
          onResult={(id) => {
            handleParam("result", id);
          }}
          onRun={(id) => {
            handleParam("run", id);
          }}
          onPart={handlePart}
        />
      </div>
    </>
  );
}
