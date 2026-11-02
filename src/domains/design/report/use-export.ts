import { showToast } from "@/shared/ui/toast";
import type { ReportRequest } from "@/shared/api/types";
import { useExportReport } from "./api";
import { toDownload } from "./download";

/** Exports the report in a format, downloads the file as report-<name>.<format> and toasts. */
export function useReportExport(request: ReportRequest, name: string, flowsheet: string | null) {
  const exporter = useExportReport();

  function handleExport(format: "md" | "pdf"): void {
    const filename = `report-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${format}`;
    exporter.mutate(
      { ...request, format, flowsheet_svg: flowsheet },
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
