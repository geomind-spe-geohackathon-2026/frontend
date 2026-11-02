import { showToast } from "@/shared/ui/toast";
import type { ReportRequest } from "@/shared/api/types";
import { useExportReport } from "./api";
import { toDownload } from "./download";
import type { FlowsheetPictures } from "./use-flowsheet-svg";

/** Exports the report in a format, downloads the file as report-<name>.<format> and toasts. */
export function useReportExport(
  request: ReportRequest,
  name: string,
  flowsheet: FlowsheetPictures | null,
) {
  const exporter = useExportReport();

  function handleExport(format: "md" | "pdf"): void {
    const filename = `report-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${format}`;
    exporter.mutate(
      {
        ...request,
        format,
        flowsheet_svg: flowsheet?.process ?? null,
        flowsheet_full_svg: flowsheet?.full ?? null,
      },
      {
        onSuccess: (blob) => {
          toDownload(blob, filename);
          showToast(`${filename} exported`);
        },
      },
    );
  }

  return { exporter, handleExport };
}
