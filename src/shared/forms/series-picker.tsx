import { useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { Sparkline } from "@/shared/charts/sparkline";
import { Input } from "@/shared/ui/input";
import { useFieldContext, type SeriesSource } from "./field-context";
import { expectedSteps, toPoints, toStats, toTable, valueColumns } from "./series-data";

type Props = { id: string; name: string; label: string; units: string[] };

const selectClass = "min-w-0 rounded-control border border-border bg-surface px-2 py-[7px]";

function toFigure(value: number): string {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value);
}

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
      <option value="" />
      {value === "" || options.includes(value) ? null : <option value={value}>{value}</option>}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
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
  const stats = toStats(points);
  const expected = expectedSteps(time);
  const energy = unit.endsWith("W") ? `, total ${toFigure(stats.sum)} ${unit}h` : "";
  return (
    <div className="flex flex-col gap-1 rounded-control bg-sunken p-2">
      <Sparkline values={points.map((point) => point.value)} label={`Preview of ${column}`} />
      <p className="flex justify-between text-[11.5px] text-muted">
        <span>{points[0]?.time.slice(0, 10)}</span>
        <span>{points.at(-1)?.time.slice(0, 10)}</span>
      </p>
      <p className="text-[12px] text-muted">
        Peak {toFigure(stats.peak)} {unit}, lowest {toFigure(stats.low)} {unit}
        {energy}, {stats.count} rows
        {expected === null ? "" : `, the case's time has ${String(expected)} steps`}
      </p>
      {expected === null || expected === stats.count ? null : (
        <p className="inline-flex items-center gap-1 text-[12px] text-warn">
          <TriangleAlert aria-hidden="true" className="size-3.5" />
          The file does not match the case&apos;s time
        </p>
      )}
    </div>
  );
}

function FileUpload({ source, label }: { source: SeriesSource; label: string }) {
  if (source.uploadBlocked) {
    return <p className="text-[12px] text-muted">Save your changes to upload a file here.</p>;
  }
  return (
    <label className="text-[12px] text-muted">
      Upload a CSV{" "}
      <input
        type="file"
        accept=".csv,text/csv"
        aria-label={`Upload a file for ${label}`}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file !== undefined) source.upload(file);
        }}
      />
    </label>
  );
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
    <select
      {...(id === undefined ? {} : { id })}
      aria-label={label}
      className={selectClass}
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    >
      <Options options={options} value={value} />
    </select>
  );
}

/** Chooses a series: a file of the case, its column and unit, with a preview of the values. */
export function SeriesPicker({ id, name, label, units }: Props) {
  const { series: source } = useFieldContext();
  const [file, setFile] = useField(`${name}.file`);
  const [column, setColumn] = useField(`${name}.column`);
  const [unit, setUnit] = useField(`${name}.unit`);
  const content = useQuery({
    queryKey: ["series-file", source?.scope, file],
    queryFn: () => source?.read(file) ?? "",
    enabled: source?.files.includes(file) === true,
  });
  const columns = content.data === undefined ? [] : valueColumns(toTable(content.data));
  if (source === undefined) {
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
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] gap-1">
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
      <FileUpload source={source} label={label} />
      {content.data === undefined || column === "" ? null : (
        <SeriesPreview text={content.data} column={column} unit={unit} time={source.time} />
      )}
    </div>
  );
}
