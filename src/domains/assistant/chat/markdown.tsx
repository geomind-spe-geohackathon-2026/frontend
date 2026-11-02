import ReactMarkdown from "react-markdown";

/** Renders Markdown text without raw HTML. */
export function Markdown({ text }: { text: string }) {
  return (
    <div className="space-y-2 [&_code]:rounded-control [&_code]:bg-sunken [&_code]:px-1 [&_code]:font-mono [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded-control [&_pre]:bg-sunken [&_pre]:p-2 [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}
