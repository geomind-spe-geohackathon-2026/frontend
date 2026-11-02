import { Card, CardBody } from "@/shared/ui/card";
import { MarkdownText } from "@/shared/ui/markdown-text";
import type { Report } from "@/shared/api/types";

/** The report as it will be exported: the title and each chosen section rendered from Markdown (GitHub tables, no raw HTML). */
export function ReportDocument({ preview }: { preview: Report }) {
  return (
    <Card>
      <CardBody className="flex min-w-0 flex-col gap-4">
        <h2>{preview.title}</h2>
        {preview.sections.map((section) => (
          <section key={section.key} aria-label={section.title} className="flex flex-col gap-1">
            <h3>{section.title}</h3>
            <MarkdownText text={section.markdown} />
          </section>
        ))}
      </CardBody>
    </Card>
  );
}
