import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";
import { modulesOfProblem, type SpecConnection } from "@/shared/plant/spec";
import type { Problem } from "@/shared/api/types";

type Severity = "error" | "warning";

type Entry = { problem: Problem; severity: Severity; target: string | undefined };

type Props = {
  problems: Problem[];
  warnings: Problem[];
  connections: SpecConnection[];
  ids: string[];
  onSelect: (moduleId: string) => void;
};

const icons: Record<Severity, typeof CircleX> = { error: CircleX, warning: TriangleAlert };
const tones: Record<Severity, string> = { error: "text-bad", warning: "text-warn" };
const labels: Record<Severity, string> = { error: "Error", warning: "Warning" };

function toEntries({ problems, warnings, connections, ids }: Props): Entry[] {
  const toEntry = (problem: Problem, severity: Severity): Entry => ({
    problem,
    severity,
    target: modulesOfProblem(problem.path, connections, ids)[0],
  });
  const errors = problems.filter((problem) => problem.code !== "missing_value");
  const missing = problems.filter((problem) => problem.code === "missing_value");
  return [
    ...errors.map((problem) => toEntry(problem, "error")),
    ...missing.map((problem) => toEntry(problem, "warning")),
    ...warnings.map((problem) => toEntry(problem, "warning")),
  ];
}

function Count({ severity, count }: { severity: Severity; count: number }) {
  const Icon = icons[severity];
  return (
    <span
      className="flex items-center gap-1 tabular-nums"
      title={`${String(count)} ${count === 1 ? labels[severity] : `${labels[severity]}s`}`}
    >
      <Icon aria-hidden="true" className={`size-3.5 ${tones[severity]}`} />
      {count}
    </span>
  );
}

function Row({ entry, onSelect }: { entry: Entry; onSelect: (moduleId: string) => void }) {
  const Icon = icons[entry.severity];
  const { target, problem } = entry;
  const body = (
    <>
      <Icon
        aria-label={labels[entry.severity]}
        className={`size-3.5 shrink-0 ${tones[entry.severity]}`}
      />
      <span className="min-w-0 flex-1 truncate">{problem.message}</span>
      <span className="shrink-0 truncate font-mono text-[11.5px] text-muted-foreground">
        {problem.path}
      </span>
    </>
  );
  const row = "flex w-full items-center gap-2 px-3 py-1 text-left text-[12.5px]";
  return (
    <li>
      {target === undefined ? (
        <div className={row}>{body}</div>
      ) : (
        <button
          type="button"
          className={`${row} cursor-pointer hover:bg-accent focus-visible:bg-accent focus-visible:outline-none`}
          title={`Open ${target}`}
          onClick={() => {
            onSelect(target);
          }}
        >
          {body}
        </button>
      )}
    </li>
  );
}

/** Like VS Code's Problems panel: counts of errors and warnings, one row per problem; a row opens its module. */
export function ProblemsPanel(props: Props) {
  const entries = toEntries(props);
  const errors = entries.filter((entry) => entry.severity === "error").length;
  return (
    <section aria-label="Problems" className="overflow-hidden rounded-card border border-border">
      <header className="flex items-center gap-3 border-b border-border bg-muted/40 px-3 py-1.5">
        <h3 className="text-[11.5px] font-semibold tracking-wide uppercase">Problems</h3>
        <Count severity="error" count={errors} />
        <Count severity="warning" count={entries.length - errors} />
        {errors > 0 ? (
          <span className="ml-auto text-[12px] text-muted-foreground">
            Fix errors before saving
          </span>
        ) : null}
      </header>
      {entries.length === 0 ? (
        <p className="flex items-center gap-2 px-3 py-2 text-[12.5px] text-muted-foreground">
          <CircleCheck aria-hidden="true" className="size-3.5 text-ok" />
          No problems found in the plant.
        </p>
      ) : (
        <ul className="m-0 max-h-48 list-none overflow-y-auto p-0 py-1">
          {entries.map((entry) => (
            <Row
              key={`${entry.severity}:${entry.problem.path}:${entry.problem.message}`}
              entry={entry}
              onSelect={props.onSelect}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
