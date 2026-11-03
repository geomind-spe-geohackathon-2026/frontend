import { toShortId } from "@/lib/shortid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/shared/ui/field";
import type { ReportPart, ReportPartInfo, Result } from "@/shared/api/types";
import type { Run } from "@/shared/api/types";

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

const selectClass = "w-full rounded-control border border-border bg-surface px-2.5 py-[7px]";

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
        <Field label="Design" htmlFor="report-result">
          <select
            id="report-result"
            className={selectClass}
            value={result}
            onChange={(event) => {
              onResult(event.target.value);
            }}
          >
            {results.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Agent log from" htmlFor="report-run">
          <select
            id="report-run"
            className={selectClass}
            value={run}
            onChange={(event) => {
              onRun(event.target.value);
            }}
          >
            <option value="">No run</option>
            {runs.map((entry) => (
              <option
                key={entry.id}
                value={entry.id}
              >{`Run ${toShortId(entry.id)} (${entry.status})`}</option>
            ))}
          </select>
        </Field>
        <PartsFieldset parts={parts} chosen={chosen} onPart={onPart} onCompact={onCompact} />
      </CardContent>
    </Card>
  );
}
