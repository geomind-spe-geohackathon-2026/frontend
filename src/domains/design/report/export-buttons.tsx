import { Button } from "@/components/ui/button";

type Props = { disabled: boolean; onExport: (format: "md" | "pdf") => void };

/** The two export buttons of the report header. */
export function ExportButtons({ disabled, onExport }: Props) {
  return (
    <>
      <Button
        disabled={disabled}
        onClick={() => {
          onExport("pdf");
        }}
      >
        Export PDF
      </Button>
      <Button
        disabled={disabled}
        onClick={() => {
          onExport("md");
        }}
      >
        Export Markdown
      </Button>
    </>
  );
}
