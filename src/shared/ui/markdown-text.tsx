import { lazy, memo, Suspense } from "react";

const Markdown = lazy(() => import("./markdown").then((module) => ({ default: module.Markdown })));

/** Renders Markdown text without raw HTML; the Markdown library loads on first use, plain text shows meanwhile. */
export const MarkdownText = memo(function MarkdownText({ text }: { text: string }) {
  return (
    <Suspense fallback={<p className="whitespace-pre-wrap">{text}</p>}>
      <Markdown text={text} />
    </Suspense>
  );
});
