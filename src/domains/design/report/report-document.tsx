import { MarkdownText } from "@/shared/ui/markdown-text";
import { ThemedImage } from "@/shared/ui/themed-image";
import type { Report } from "@/shared/api/types";
import type { FlowsheetPictures } from "./use-flowsheet-svg";

type Props = { preview: Report; flowsheet: FlowsheetPictures | null };

type Section = Report["sections"][number];

const marker = /^[ \t]*<!--\s*flowsheet\s*-->[ \t]*$/m;

const caption = "p:has(> em:only-child)";

const reportStyle = `
.report-doc .report-body { display: flex; flex-direction: column; gap: 0.75rem; line-height: 1.6; }
.report-doc .report-body > div > * + * { margin-top: 0.9rem; }
.report-doc .report-body p, .report-doc .report-body li { max-width: 75ch; }
.report-doc .report-body div:has(> [data-slot="table-container"]),
.report-doc .report-body p:has(img),
.report-doc .report-flowsheet { margin-top: 1.5rem; margin-bottom: 0.5rem; }
.report-doc .report-body h2 { font-size: 16px; font-weight: 600; margin-top: 2rem; }
.report-doc .report-body h3 { font-size: 15px; font-weight: 600; margin-top: 1.75rem; }
.report-doc .report-body h4 { font-size: 13.5px; font-weight: 600; margin-top: 1.25rem; }
.report-doc .report-body table { width: 100%; }
.report-doc .report-body div:has(> [data-slot="table-container"]) { max-height: none; width: 100%; }
.report-doc .report-body p:has(img) + ${caption},
.report-doc .report-body div:has(table) + ${caption},
.report-doc .report-flowsheet + div > ${caption}:first-child {
  margin: 0.4rem auto 1.25rem; text-align: center; font-size: 12px; color: var(--muted);
}
`;

function toFlowsheet(section: Section, flowsheet: FlowsheetPictures | null) {
  if (flowsheet === null) return null;
  const full = section.key === "appendix";
  if (!full && section.key !== "design" && !marker.test(section.markdown)) return null;
  return (
    <div className="report-flowsheet">
      <ThemedImage
        svg={full ? flowsheet.full : flowsheet.process}
        alt={full ? "Flowsheet of every module" : "Process diagram of the plant"}
        zoom
      />
    </div>
  );
}

function SectionBody({
  section,
  flowsheet,
}: {
  section: Section;
  flowsheet: FlowsheetPictures | null;
}) {
  const picture = toFlowsheet(section, flowsheet);
  const found = marker.exec(section.markdown);
  if (found === null) {
    return (
      <div className="report-body">
        <MarkdownText text={section.markdown} />
        {picture}
      </div>
    );
  }
  return (
    <div className="report-body">
      <MarkdownText text={section.markdown.slice(0, found.index)} />
      {picture}
      <MarkdownText text={section.markdown.slice(found.index + found[0].length)} />
    </div>
  );
}

/** The report as a page in the theme of the app, read like a document; the PDF always comes out light. */
export function ReportDocument({ preview, flowsheet }: Props) {
  return (
    <article className="report-doc paper mx-auto flex w-full max-w-[794px] min-w-0 flex-col gap-14 rounded-control px-10 py-10 shadow-sm">
      <style>{reportStyle}</style>
      <h1 className="text-[26px] leading-tight font-semibold">{preview.title}</h1>
      {preview.sections.map((section) => (
        <section key={section.key} aria-label={section.title} className="flex flex-col gap-4">
          <h2 className="border-b pb-2 text-[19px] font-semibold">{section.title}</h2>
          <SectionBody section={section} flowsheet={flowsheet} />
        </section>
      ))}
    </article>
  );
}
