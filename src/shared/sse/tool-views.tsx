import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

type Fields = Record<string, unknown>;

/** A calculation of the problem state (calculate, or a value run_python derived). */
export type Calculation = {
  id: string;
  label: string;
  operation: string;
  expression: string;
  value: number;
  unit: string;
  operands: Fields[];
  code?: string;
};

function isFields(value: unknown): value is Fields {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number") return String(value);
  return null;
}

function list(value: unknown): Fields[] {
  return Array.isArray(value) ? value.filter(isFields) : [];
}

const numberFormat = new Intl.NumberFormat("en", { maximumSignificantDigits: 6 });

function toFigure(value: unknown, unit: unknown): string {
  const shown = typeof value === "number" ? numberFormat.format(value) : (text(value) ?? "?");
  const suffix = text(unit);
  return suffix === null || suffix === "-" ? shown : `${shown} ${suffix}`;
}

/** Reads the calculations of a problem state document; anything that is not one is left out. */
export function fromCalculations(document: unknown): Calculation[] {
  if (!isFields(document)) return [];
  return list(document.calculations).flatMap((item) => {
    const id = text(item.id);
    if (id === null) return [];
    return [
      {
        id,
        label: text(item.label) ?? id,
        operation: text(item.operation) ?? "",
        expression: text(item.expression) ?? "",
        value: typeof item.value === "number" ? item.value : Number.NaN,
        unit: text(item.unit) ?? "",
        operands: list(item.operands),
        ...(text(item.code) === null ? {} : { code: text(item.code) ?? "" }),
      },
    ];
  });
}

/** Reads the result id at the start of a tool summary, such as C1 or P1a2b3c4d. */
export function toResultId(summary: string): string | null {
  const found = /['"]id['"]\s*:\s*['"]([^'"]+)['"]/.exec(summary);
  return found?.[1] ?? null;
}

function WebLink({ url, label }: { url: string; label?: string | null }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-accent underline [overflow-wrap:anywhere]">
      {label ?? url}
    </a>
  );
}

function Source({ source }: { source: unknown }) {
  if (!isFields(source)) return null;
  const kind = text(source.kind) ?? "";
  const url = text(source.url);
  const parts = [text(source.publisher), text(source.year), text(source.page) === null ? null : `p. ${text(source.page) ?? ""}`]
    .filter((part): part is string => part !== null);
  if (kind === "number") return <Badge variant="outline">plain</Badge>;
  if (kind === "constant") return <span className="text-muted">constant {text(source.name)}</span>;
  if (kind === "case") return <span className="text-muted">case {text(source.path) ?? ""}</span>;
  if (kind === "assumption") {
    return (
      <span className="text-muted">
        assumption {text(source.id)}: {text(source.text)}
        {text(source.source) === null ? null : ` (${text(source.source) ?? ""})`}
      </span>
    );
  }
  if (kind === "calculation") {
    return <span className="text-muted">calculation {text(source.id)} {text(source.label)}</span>;
  }
  if (kind === "stored") {
    return <span className="text-muted">stored {text(source.reference)} {text(source.path)}</span>;
  }
  return (
    <span className="text-muted">
      {kind === "catalogue" ? `catalogue ${text(source.row) ?? ""}` : kind}
      {text(source.document) === null ? null : `, ${text(source.document) ?? ""}`}
      {parts.length === 0 ? null : ` · ${parts.join(", ")}`}
      {url === null ? null : (
        <>
          {" · "}
          <WebLink url={url} label="link" />
        </>
      )}
    </span>
  );
}

function Operands({ operands }: { operands: Fields[] }) {
  if (operands.length === 0) return null;
  return (
    <ul className="space-y-0.5 text-[12.5px]">
      {operands.map((operand, position) => (
        <li key={position} className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="font-mono">{toFigure(operand.value, operand.unit)}</span>
          {text(operand.name) === null ? null : <span>{text(operand.name)}</span>}
          <Source source={operand.source} />
        </li>
      ))}
    </ul>
  );
}

function CalculationView({ calculation }: { calculation: Calculation }) {
  return (
    <div className="space-y-1">
      <p>
        <span className="font-medium">{calculation.label}</span> ={" "}
        <span className="font-mono font-medium">{toFigure(calculation.value, calculation.unit)}</span>
      </p>
      {calculation.expression === "" ? null : (
        <p className="font-mono text-[12px] text-muted [overflow-wrap:anywhere]">{calculation.expression}</p>
      )}
      <Operands operands={calculation.operands} />
    </div>
  );
}

function Code({ code }: { code: string }) {
  return (
    <details>
      <summary className="cursor-pointer text-[12.5px] text-muted">Code</summary>
      <pre className="mt-1 max-h-[320px] overflow-auto rounded-control bg-sunken p-2 font-mono text-[12px] whitespace-pre">
        {code}
      </pre>
    </details>
  );
}

function Output({ label, value, tone }: { label: string; value: unknown; tone?: string }) {
  const shown = text(value);
  if (shown === null) return null;
  return (
    <details>
      <summary className="cursor-pointer text-[12.5px] text-muted">{label}</summary>
      <pre className={`mt-1 max-h-[320px] overflow-auto rounded-control bg-sunken p-2 font-mono text-[12px] whitespace-pre-wrap ${tone ?? ""}`}>
        {shown}
      </pre>
    </details>
  );
}

const statusTones: Record<string, "ok" | "bad" | "warn"> = { ok: "ok", failed: "bad", timed_out: "warn" };

function PythonView({ input, output, calculations }: { input: unknown; output: Fields | null; calculations: Calculation[] }) {
  const given = isFields(input) ? input : {};
  const status = text(output?.status);
  const code = text(output?.code) ?? text(given.code);
  return (
    <div className="space-y-1.5">
      <p className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{text(output?.purpose) ?? text(given.purpose) ?? "Python code"}</span>
        {status === null ? null : <Badge variant={statusTones[status] ?? "info"}>{status.replace("_", " ")}</Badge>}
        {typeof output?.duration === "number" ? <span className="text-muted">{numberFormat.format(output.duration)} s</span> : null}
      </p>
      {code === null ? null : <Code code={code} />}
      <Operands operands={list(output?.inputs)} />
      {list(output?.inputs).length > 0 || !isFields(given.inputs) ? null : (
        <p className="text-[12.5px] text-muted">Inputs: {Object.keys(given.inputs).join(", ")}</p>
      )}
      <Output label="Output (stdout)" value={output?.stdout} />
      <Output label="Errors (stderr)" value={output?.stderr} tone="text-bad" />
      {list(output?.outputs).map((file) => (
        <Output key={text(file.path) ?? ""} label={`File ${text(file.path) ?? ""}`} value={file.text} />
      ))}
      {calculations.map((calculation) => (
        <CalculationView key={calculation.id} calculation={calculation} />
      ))}
    </div>
  );
}

function toHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function SearchView({ input, output }: { input: unknown; output: Fields | null }) {
  const query = text(output?.query) ?? (isFields(input) ? text(input.query) : null);
  const results = list(output?.results);
  return (
    <div className="space-y-1.5">
      <p className="text-muted">Searched the web for “{query ?? ""}”</p>
      <ul className="space-y-1.5">
        {results.map((result, position) => {
          const url = text(result.url);
          return (
            <li key={position} className="rounded-control border border-border p-2">
              {url === null ? <p className="font-medium">{text(result.title)}</p> : <WebLink url={url} label={text(result.title)} />}
              <p className="text-[12px] text-muted">
                {url === null ? null : toHost(url)}
                {text(result.date) === null ? null : ` · ${text(result.date) ?? ""}`}
              </p>
              {text(result.snippet) === null ? null : <p className="text-[12.5px]">{text(result.snippet)}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PageView({ input, output }: { input: unknown; output: Fields | null }) {
  const url = text(output?.url) ?? (isFields(input) ? text(input.url) : null);
  const facts = [text(output?.publisher), text(output?.author), text(output?.date), text(output?.kind)]
    .filter((part): part is string => part !== null);
  return (
    <div className="space-y-1.5 rounded-control border border-border p-2">
      <p className="font-medium">{text(output?.title) ?? "Web page"}</p>
      {facts.length === 0 ? null : <p className="text-[12px] text-muted">{facts.join(" · ")}</p>}
      {url === null ? null : <WebLink url={url} label={text(output?.site) ?? url} />}
      <Output label="Text read" value={output?.text} />
      {typeof output?.next_start === "number" ? (
        <p className="text-[12px] text-muted">More text follows from character {String(output.next_start)}.</p>
      ) : null}
    </div>
  );
}

function PlantsNeed({ output }: { output: Fields | null }) {
  const needs = list(output?.plants_need);
  if (needs.length === 0) return null;
  return (
    <div className="space-y-0.5 text-[12.5px]">
      <p className="font-medium text-warn">Plants still need:</p>
      <ul className="list-inside list-disc">
        {needs.map((need, position) => {
          const plants = Array.isArray(need.plants) ? need.plants.filter((plant) => typeof plant === "string") : [];
          return (
            <li key={position} className="[overflow-wrap:anywhere]">
              <span className="font-mono">{text(need.path)}</span>
              {text(need.message) === null ? null : ` · ${text(need.message) ?? ""}`}
              {plants.length === 0 ? null : <span className="text-muted"> ({plants.join(", ")})</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A readable view of a calculate, run_python, web_search, read_web_page or set_case call, or null for any other tool. */
export function ToolResultView({
  tool,
  input,
  output,
  calculations,
}: {
  tool: string;
  input: unknown;
  output: unknown;
  calculations: Calculation[];
}): ReactNode {
  const full = isFields(output) ? output : null;
  if (tool === "calculate") {
    const own = full === null ? calculations : fromCalculations({ calculations: [full] });
    return own.length === 0 ? null : <CalculationView calculation={own[0] as Calculation} />;
  }
  if (tool === "run_python") {
    const derived = full === null ? calculations : fromCalculations({ calculations: full.calculations });
    return <PythonView input={input} output={full} calculations={derived} />;
  }
  if (tool === "web_search") return <SearchView input={input} output={full} />;
  if (tool === "read_web_page") return <PageView input={input} output={full} />;
  if (tool === "set_case") return list(full?.plants_need).length === 0 ? null : <PlantsNeed output={full} />;
  return null;
}

/** Splits a text into plain parts and links for every http(s) address in it. */
export function withLinks(value: string): ReactNode[] {
  return value.split(/(https?:\/\/[^\s"'<>)]+)/g).map((part, position) =>
    /^https?:\/\//.test(part) ? <WebLink key={position} url={part} /> : part,
  );
}
