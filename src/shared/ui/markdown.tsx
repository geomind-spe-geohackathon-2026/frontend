import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
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
    <div className="max-w-full overflow-x-auto rounded-control border border-border">
      <table className="w-max min-w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border-b border-border bg-sunken px-2 py-1 font-semibold">{children}</th>
  ),
  img: ({ src, alt }: { src?: string | Blob | undefined; alt?: string | undefined }) => {
    const svg = typeof src === "string" ? fromSvgUrl(src) : null;
    if (svg !== null) return <ThemedImage svg={svg} alt={alt ?? ""} />;
    return typeof src === "string" ? <img src={src} alt={alt ?? ""} /> : null;
  },
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border-b border-border px-2 py-1 align-top">{children}</td>
  ),
};

/** Renders Markdown text with GitHub tables and no raw HTML; a wide table scrolls inside its own box. */
export function Markdown({ text }: { text: string }) {
  return (
    <div className="min-w-0 space-y-2 [&_code]:rounded-control [&_code]:bg-sunken [&_code]:px-1 [&_code]:font-mono [&_h1]:text-lg [&_h2]:text-base [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_pre_code]:whitespace-pre [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown remarkPlugins={plugins} components={components} urlTransform={toSafeUrl}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
