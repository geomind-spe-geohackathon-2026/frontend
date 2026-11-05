import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Table, TableHeader } from "@/components/ui/table";
import { DataCell, DataHead, dataTableClass } from "./data-table";
import { fromSvgUrl, ThemedImage } from "./themed-image";

const plugins = [remarkGfm];
const svgImage = "data:image/svg+xml;base64,";

function toSafeUrl(url: string): string {
  return url.startsWith(svgImage) ? url : defaultUrlTransform(url);
}

const components = {
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="max-w-full overflow-x-auto rounded-control bg-sunken p-2">{children}</pre>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className={`${dataTableClass.box} max-h-96`}>
      <Table className="min-w-full text-[12.5px]">{children}</Table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <TableHeader className={dataTableClass.header}>{children}</TableHeader>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <DataHead className="h-auto bg-sunken px-2 py-1 font-semibold">{children}</DataHead>
  ),
  img: ({ src, alt }: { src?: string | Blob | undefined; alt?: string | undefined }) => {
    const svg = typeof src === "string" ? fromSvgUrl(src) : null;
    if (svg !== null) return <ThemedImage svg={svg} alt={alt ?? ""} />;
    return typeof src === "string" ? <img src={src} alt={alt ?? ""} /> : null;
  },
  td: ({ children }: { children?: React.ReactNode }) => (
    <DataCell className="border-b px-2 py-1">{children}</DataCell>
  ),
};

/** Renders Markdown text with GitHub tables and no raw HTML; tables use the shared data table (one-line cells that open on a click, a header that stays on top, scrolling inside their own box). */
export function Markdown({ text }: { text: string }) {
  return (
    <div className="min-w-0 space-y-2 [&_code]:rounded-control [&_code]:bg-sunken [&_code]:px-1 [&_code]:font-mono [&_h1]:text-lg [&_h2]:text-base [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_pre_code]:whitespace-pre [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown remarkPlugins={plugins} components={components} urlTransform={toSafeUrl}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
