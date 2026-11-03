import { toShortId } from "@/lib/shortid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import type { ReportPart, ReportPartInfo, Result } from "@/shared/api/types";
import type { Run } from "@/shared/api/types";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

type Props = {
  results: Result[];
  runs: Run[];
  result: string;
  run: string;
  parts: ReportPartInfo[];
  chosen: ReportPart[];
  onResult: (id: string) => void;
  onRun: (id: string) => void;
  onPart: (part: ReportPart, checked: boolean) => void;
  onCompact: () => void;
};

const selectClass = "w-full";

function PartsFieldset({
  parts,
  chosen,
  onPart,
  onCompact,
}: {
  parts: ReportPartInfo[];
  chosen: ReportPart[];
  onPart: (part: ReportPart, checked: boolean) => void;
  onCompact: () => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5 border-0 p-0">
      <legend className="mb-1 text-[12.5px] text-muted">Sections</legend>
      <Button
        className="mb-1 self-start"
        onClick={() => {
          onCompact();
        }}
      >
        Compact
      </Button>
      {parts.map((entry) => (
        <label key={entry.key} className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={chosen.includes(entry.key)}
            onChange={(event) => {
              onPart(entry.key, event.target.checked);
            }}
          />
          {entry.title}
        </label>
      ))}
    </fieldset>
  );
}

/** The report settings: which result, which run's agent log, and which sections to include. */
export function ReportOptions({
  results,
  runs,
  parts,
  result,
  run,
  chosen,
  onResult,
  onRun,
  onPart,
  onCompact,
}: Props) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="report-result">Design</FieldLabel>
          <NativeSelect
            id="report-result"
            className={selectClass}
            value={result}
            onChange={(event) => {
              onResult(event.target.value);
            }}
          >
            {results.map((entry) => (
              <NativeSelectOption key={entry.id} value={entry.id}>
                {entry.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="report-run">Agent log from</FieldLabel>
          <NativeSelect
            id="report-run"
            className={selectClass}
            value={run}
            onChange={(event) => {
              onRun(event.target.value);
            }}
          >
            <NativeSelectOption value="">No run</NativeSelectOption>
            {runs.map((entry) => (
              <NativeSelectOption
                key={entry.id}
                value={entry.id}
              >{`Run ${toShortId(entry.id)} (${entry.status})`}</NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <PartsFieldset parts={parts} chosen={chosen} onPart={onPart} onCompact={onCompact} />
      </CardContent>
    </Card>
  );
}
