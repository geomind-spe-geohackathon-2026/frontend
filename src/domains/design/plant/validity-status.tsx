import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { modulesOfProblem } from "@/shared/plant/spec";
import type { Problem } from "@/shared/api/types";
import type { PlantGraph } from "./use-auto-layout";
import type { usePlantEditor } from "./use-plant-editor";

type Graph = Pick<PlantGraph, "connections" | "modules">;

type Props = {
  editor: ReturnType<typeof usePlantEditor>;
  graph: Graph;
  selected: string | null;
  onSelect: (id: string | null) => void;
};

function toModule(problem: Problem, graph: Graph): string | undefined {
  const ids = graph.modules.map((module) => module.id);
  return modulesOfProblem(problem.path, graph.connections, ids)[0];
}

function isMissing(problem: Problem): boolean {
  return problem.code === "missing_value";
}

/** Lists the modules with missing values once each, in the order of the plant. */
export function toMissingModules(problems: Problem[], graph: Graph): string[] {
  const named = new Set(problems.filter(isMissing).map((problem) => toModule(problem, graph)));
  return graph.modules.map((module) => module.id).filter((id) => named.has(id));
}

/** Picks the module after the selected one in a list, going round; the first when none is selected. */
export function toNextModule(modules: string[], selected: string | null): string | null {
  const at = selected === null ? -1 : modules.indexOf(selected);
  return modules[(at + 1) % modules.length] ?? null;
}

function MissingStatus({ editor, graph, selected, onSelect }: Props) {
  const missing = editor.problems.filter(isMissing);
  const modules = toMissingModules(editor.problems, graph);
  return (
    <span className="inline-flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer rounded-pill border-0 bg-transparent p-0">
          <Badge variant="off">
            {missing.length} {missing.length === 1 ? "value" : "values"} missing
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-[60vh] max-w-[min(420px,calc(100vw-32px))] overflow-y-auto">
          {missing.map((problem) => (
            <DropdownMenuItem
              key={`${problem.path}:${problem.message}`}
              className="font-mono text-[12px] [overflow-wrap:anywhere]"
              onSelect={() => {
                onSelect(toModule(problem, graph) ?? null);
              }}
            >
              {problem.path.replace(/^params\./, "")}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {modules.length === 0 ? null : (
        <Button
          variant="link"
          onClick={() => {
            onSelect(toNextModule(modules, selected));
          }}
        >
          next
        </Button>
      )}
    </span>
  );
}

/** The state of the draft for the header: checking, problems, or the missing values with a way through them. */
export function ValidityStatus(props: Props) {
  const { editor } = props;
  const blocking = editor.problems.filter((problem) => !isMissing(problem)).length;
  if (editor.isChecking) return <Badge variant="off">checking</Badge>;
  if (blocking > 0)
    return (
      <Badge variant="bad">
        {blocking} {blocking === 1 ? "problem" : "problems"}
      </Badge>
    );
  if (editor.problems.length > 0) return <MissingStatus {...props} />;
  return <Badge variant="ok">valid</Badge>;
}
