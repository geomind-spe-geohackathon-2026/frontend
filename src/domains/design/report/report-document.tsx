import Markdown from "react-markdown";
import { Card, CardBody } from "@/shared/ui/card";
import type { ReportPreview } from "@/shared/api/design";

/** The report as it will be exported: the title and each chosen section rendered from Markdown without raw HTML. */
export function ReportDocument({ preview }: { preview: ReportPreview }) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <h2>{preview.title}</h2>
        {preview.sections.map((section) => (
          <section key={section.key} aria-label={section.title} className="flex flex-col gap-1">
            <h3>{section.title}</h3>
            <Markdown>{section.markdown}</Markdown>
          </section>
        ))}
      </CardBody>
    </Card>
  );
}
