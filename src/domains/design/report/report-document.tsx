import { MarkdownText } from "@/shared/ui/markdown-text";
import { ThemedImage } from "@/shared/ui/themed-image";
import type { Report } from "@/shared/api/types";

type Props = { preview: Report; flowsheet: string | null };

/** The report as a page in the theme of the app; the PDF always comes out light. */
export function ReportDocument({ preview, flowsheet }: Props) {
  return (
    <article className="paper mx-auto flex w-full max-w-[794px] min-w-0 flex-col gap-5 rounded-control p-7 shadow-sm">
      <h2 className="text-[22px] font-semibold">{preview.title}</h2>
      {preview.sections.map((section) => (
        <section key={section.key} aria-label={section.title} className="flex flex-col gap-2">
          <h3 className="text-[15px] font-semibold">{section.title}</h3>
          <MarkdownText text={section.markdown} />
          {section.key === "design" && flowsheet !== null ? (
            <ThemedImage svg={flowsheet} alt="Flowsheet of the plant" zoom />
          ) : null}
        </section>
      ))}
    </article>
  );
}
