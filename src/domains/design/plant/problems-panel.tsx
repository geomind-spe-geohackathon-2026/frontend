import { Button } from "@/shared/ui/button";
import { modulesOfProblem, type SpecConnection } from "./spec";
import type { Problem } from "@/shared/api/types";

type Props = {
  problems: Problem[];
  connections: SpecConnection[];
  ids: string[];
  onSelect: (moduleId: string) => void;
};

function ProblemItem({
  problem,
  connections,
  ids,
  onSelect,
}: Omit<Props, "problems"> & { problem: Problem }) {
  const target = modulesOfProblem(problem.path, connections, ids)[0];
  return (
    <li>
      {target === undefined ? (
        <span className="font-mono">{problem.path}</span>
      ) : (
        <Button
          variant="link"
          onClick={() => {
            onSelect(target);
          }}
        >
          {problem.path}
        </Button>
      )}{" "}
      <span className="text-muted">{problem.message}</span>
    </li>
  );
}

/** The validation result as two lists: problems that block saving, and missing values that do not. */
export function ProblemsPanel({ problems, connections, ids, onSelect }: Props) {
  const missing = problems.filter((problem) => problem.code === "missing_value");
  const invalid = problems.filter((problem) => problem.code !== "missing_value");
  if (problems.length === 0) return null;
  return (
    <div className="mt-3 flex max-h-60 flex-col gap-2 overflow-y-auto">
      {[
        { title: "Problems to fix before saving", items: invalid, tone: "text-bad" },
        { title: "Missing values", items: missing, tone: "text-warn" },
      ]
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <section key={group.title} aria-label={group.title}>
            <h3 className={`mb-1 text-[12.5px] font-medium ${group.tone}`}>
              {group.title} ({group.items.length})
            </h3>
            <ul className="m-0 list-none p-0">
              {group.items.map((problem) => (
                <ProblemItem
                  key={`${problem.path}:${problem.message}`}
                  problem={problem}
                  connections={connections}
                  ids={ids}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
