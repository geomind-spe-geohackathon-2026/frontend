import { useQuery } from "@tanstack/react-query";
import { TriangleAlert, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { TimeSeriesChart } from "@/shared/charts/time-series-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFieldContext, type SeriesSource } from "./field-context";
import { expectedSteps, toPoints, toTable, valueColumns } from "./series-data";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { TableRow } from "@/components/ui/table";
import { DataCell, DataHead, DataTable } from "@/shared/ui/data-table";

type Props = { id: string; name: string; label: string; units: string[] };

const selectClass = "min-w-0";

function useField(name: string): [string, (next: string) => void] {
  const { control, setValue } = useFormContext();
  const value: unknown = useWatch({ control, name });
  return [
    typeof value === "string" ? value : "",
    (next) => {
      setValue(name, next === "" ? undefined : next, { shouldDirty: true, shouldValidate: true });
    },
  ];
}

function Options({ options, value }: { options: string[]; value: string }) {
  return (
    <>
      <NativeSelectOption value="" />
      {value === "" || options.includes(value) ? null : (
        <NativeSelectOption value={value}>{value}</NativeSelectOption>
      )}
      {options.map((option) => (
        <NativeSelectOption key={option} value={option}>
          {option.split("/").at(-1)}
        </NativeSelectOption>
      ))}
    </>
  );
}

function SeriesPreview({
  text,
  column,
  unit,
  time,
}: {
  text: string;
  column: string;
  unit: string;
  time: unknown;
}) {
  const points = toPoints(toTable(text), column);
  const expected = expectedSteps(time);
  return (
    <div className="flex flex-col gap-1 rounded-control bg-sunken p-2">
      <TimeSeriesChart title={column} unit={unit} points={points} />
      {expected === null || expected === points.length ? null : (
        <p className="inline-flex items-center gap-1 text-[12px] text-warn">
          <TriangleAlert aria-hidden="true" className="size-3.5" />
          {points.length} rows, but the case&apos;s time has {expected} steps
        </p>
      )}
    </div>
  );
}

function FileUpload({
  source,
  label,
  field,
  accept,
  title,
}: {
  source: SeriesSource;
  label: string;
  field: string;
  accept: string;
  title: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      role="group"
      aria-label={`Upload a file for ${label}`}
      className={`flex flex-wrap items-center gap-2 rounded-control border border-dashed p-2 ${over ? "border-accent" : "border-border"}`}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => {
        setOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const file = event.dataTransfer.files[0];
        if (file !== undefined) source.upload(file, field);
      }}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        aria-label={`File for ${label}`}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file !== undefined) source.upload(file, field);
        }}
      />
      <Button
        onClick={() => {
          input.current?.click();
        }}
      >
        <Upload aria-hidden="true" className="size-3.5" />
        {title}
      </Button>
      <span className="text-[12px] text-muted">or drop it here</span>
    </div>
  );
}

function usePicked(
  source: SeriesSource | undefined,
  field: string,
  setFile: (next: string) => void,
) {
  useEffect(() => {
    const picked = source?.takePicked(field);
    if (picked !== undefined) setFile(picked);
  }, [source, field, setFile]);
}

function Choice({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id?: string;
  label: string;
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <NativeSelect
      {...(id === undefined ? {} : { id })}
      aria-label={label}
      className={selectClass}
      value={value}
      title={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    >
      <Options options={options} value={value} />
    </NativeSelect>
  );
}

/** Chooses a series: a file of the case, its column and unit, with a preview of the values. */
export function SeriesPicker({ id, name, label, units }: Props) {
  const { series: source } = useFieldContext();
  if (source === undefined) return <PlainFile id={id} name={`${name}.file`} label={label} />;
  return <SourcedSeries id={id} name={name} label={label} units={units} source={source} />;
}

function PlainFile({ id, name, label }: { id: string; name: string; label: string }) {
  const [file, setFile] = useField(name);
  return (
    <Input
      id={id}
      value={file}
      aria-label={`File of ${label}`}
      onChange={(event) => {
        setFile(event.target.value);
      }}
    />
  );
}

function SourcedSeries({ id, name, label, units, source }: Props & { source: SeriesSource }) {
  const [file, setFile] = useField(`${name}.file`);
  const [column, setColumn] = useField(`${name}.column`);
  const [unit, setUnit] = useField(`${name}.unit`);
  const content = useQuery({
    queryKey: ["series-file", source.scope, file],
    queryFn: () => source.read(file),
    enabled: source.files.includes(file),
  });
  const columns = content.data === undefined ? [] : valueColumns(toTable(content.data));
  const [only] = columns;
  usePicked(source, name, setFile);
  useEffect(() => {
    if (column === "" && columns.length === 1 && only !== undefined) setColumn(only);
  }, [column, columns.length, only, setColumn]);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,3fr)_minmax(5rem,1fr)] gap-1">
        <Choice
          id={id}
          label={`File of ${label}`}
          options={source.files}
          value={file}
          onChange={setFile}
        />
        <Choice
          label={`Column of ${label}`}
          options={columns}
          value={column}
          onChange={setColumn}
        />
        <Choice label={`Unit of ${label}`} options={units} value={unit} onChange={setUnit} />
      </div>
      <FileUpload
        source={source}
        label={label}
        field={name}
        accept=".csv,text/csv"
        title="Upload CSV"
      />
      {content.data === undefined || column === "" ? null : (
        <SeriesPreview text={content.data} column={column} unit={unit} time={source.time} />
      )}
    </div>
  );
}

type Fact = { key: string; value: string; source: string; url: string | undefined };

const headerKeys = new Set(["about", "format", "kind", "name"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function toLeaves(node: unknown, path: string): { key: string; value: string }[] {
  if (!isObject(node)) return [{ key: path, value: toText(node) }];
  if ("value" in node) {
    const unit = typeof node.unit === "string" ? ` ${node.unit}` : "";
    return [{ key: path, value: `${toText(node.value)}${unit}` }];
  }
  return Object.entries(node).flatMap(([key, child]) =>
    toLeaves(child, path === "" ? key : `${path}.${key}`),
  );
}

function toSource(cited: unknown): { source: string; url: string | undefined } {
  if (!isObject(cited)) return { source: cited === undefined ? "" : toText(cited), url: undefined };
  const words = [cited.source, cited.year, cited.row, cited.status, cited.basis]
    .filter((part) => part !== undefined && part !== null && part !== "")
    .map(toText);
  return { source: words.join(", "), url: typeof cited.url === "string" ? cited.url : undefined };
}

function toFacts(text: string): Fact[] | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObject(data)) return null;
  const about = isObject(data.about) ? data.about : {};
  const sources = isObject(about.sources) ? about.sources : {};
  return Object.entries(data)
    .filter(([key]) => !headerKeys.has(key))
    .flatMap(([key, node]) => toLeaves(node, key))
    .map((leaf) => ({ ...leaf, ...toSource(sources[leaf.key]) }));
}

function FileFacts({ text, label }: { text: string; label: string }) {
  const facts = toFacts(text);
  if (facts === null || facts.length === 0) return null;
  return (
    <DataTable
      caption={`Values of ${label} with their sources`}
      className="max-h-[420px]"
      head={["Key", "Value", "Source"].map((name) => (
        <DataHead key={name}>{name}</DataHead>
      ))}
    >
      {facts.map((fact) => (
        <TableRow key={fact.key}>
          <DataCell className="font-mono">{fact.key}</DataCell>
          <DataCell className="tabular-nums">{fact.value}</DataCell>
          <DataCell>
            {fact.url === undefined ? (
              fact.source || "-"
            ) : (
              <a href={fact.url} target="_blank" rel="noreferrer" className="text-accent">
                {fact.source || fact.url}
              </a>
            )}
          </DataCell>
        </TableRow>
      ))}
    </DataTable>
  );
}

/** Chooses a whole file of the case, with a look at what it holds. */
export function FilePicker({ id, name, label }: Omit<Props, "units">) {
  const { series: source } = useFieldContext();
  if (source === undefined) return <PlainFile id={id} name={name} label={label} />;
  return <SourcedFile id={id} name={name} label={label} source={source} />;
}

function SourcedFile({ id, name, label, source }: Omit<Props, "units"> & { source: SeriesSource }) {
  const [file, setFile] = useField(name);
  const content = useQuery({
    queryKey: ["series-file", source.scope, file],
    queryFn: () => source.read(file),
    enabled: source.files.includes(file),
  });
  usePicked(source, name, setFile);
  return (
    <div className="flex flex-col gap-1.5">
      <Choice
        id={id}
        label={`File of ${label}`}
        options={source.files.filter((option) => option.endsWith(".json"))}
        value={file}
        onChange={setFile}
      />
      <FileUpload
        source={source}
        label={label}
        field={name}
        accept=".json,application/json"
        title="Upload JSON"
      />
      {content.data === undefined ? null : <FileFacts text={content.data} label={label} />}
      {content.data === undefined ? null : (
        <pre className="max-h-[320px] overflow-auto rounded-control bg-sunken p-2 font-mono text-[12px]">
          {content.data}
        </pre>
      )}
    </div>
  );
}
