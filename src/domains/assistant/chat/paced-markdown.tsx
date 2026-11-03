import { MarkdownText } from "@/shared/ui/markdown-text";
import { usePacedText } from "./paced-text";

type Props = { text: string; settled: number; open: boolean };

/** Markdown that appears at reading pace while it arrives. */
export function PacedMarkdown({ text, settled, open }: Props) {
  return <MarkdownText text={usePacedText(text, settled, open)} />;
}
