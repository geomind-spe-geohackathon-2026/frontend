import { PlantRanges } from "./plant-ranges";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Canvas, type Issues } from "./canvas";
import { ModuleInspector } from "./module-inspector";
import { ParametersPanel, type ParameterDraft } from "./parameters-panel";
import { ProblemsPanel } from "./problems-panel";
import { useSuggestedPorts } from "./use-suggested-ports";
import { modulesOfProblem } from "@/shared/plant/spec";
import type { Flowsheet, Palette } from "@/shared/api/types";
import type { PlantGraph } from "./use-auto-layout";
import type { usePlantActions } from "./use-plant-actions";
import type { usePlantEditor } from "./use-plant-editor";

export type FlowsheetProps = {
  projectId: string;
  saved: Flowsheet;
  palette: Palette[];
  graph: PlantGraph;
  editor: ReturnType<typeof usePlantEditor>;
  actions: ReturnType<typeof usePlantActions>;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onOpen: (id: string | null) => void;
  editing: boolean;
  onEditing: (open: boolean) => void;
  draft: ParameterDraft | null;
  onDraft: (draft: ParameterDraft | null) => void;
  onConflict: () => void;
};

function toIssues({ editor, graph }: FlowsheetProps): Issues {
  const { connections } = graph;
  const ids = graph.modules.map((module) => module.id);
  const issues: Issues = new Map();
  for (const problem of editor.problems) {
    const tone = problem.code === "missing_value" ? "missing" : "invalid";
    for (const id of modulesOfProblem(problem.path, connections, ids)) {
      if (issues.get(id) !== "invalid") issues.set(id, tone);
    }
  }
  return issues;
}

function Inspector(props: FlowsheetProps & { moduleId: string; type: string }) {
  const { saved, palette, editor, actions, moduleId } = props;
  return (
    <>
      <ModuleInspector
        spec={editor.spec}
        moduleId={moduleId}
        title={palette.find((item) => item.type === props.type)?.title ?? props.type}
        onRename={(to) => {
          actions.rename(moduleId, to);
        }}
        onRemove={() => {
          actions.remove(moduleId);
        }}
        onRemoveConnection={actions.removeConnection}
      />
      <section aria-label="Parameters" className="flex flex-col gap-2">
        <h3 className="text-[12.5px] text-muted">Parameters</h3>
        <ParametersPanel
          projectId={props.projectId}
          moduleId={moduleId}
          version={saved.version}
          structureDirty={editor.dirty}
          draft={props.draft}
          onDraft={props.onDraft}
          onConflict={props.onConflict}
        />
      </section>
    </>
  );
}

function ModuleDialog(props: FlowsheetProps) {
  const { graph, selected, editing, onEditing, palette } = props;
  const current = graph.modules.find((module) => module.id === selected);
  const title = palette.find((item) => item.type === current?.type)?.title ?? current?.type;
  return (
    <Dialog modal={false} open={editing && current !== undefined} onOpenChange={onEditing}>
      <DialogContent
        className="flex max-h-[calc(100svh-4rem)] flex-col sm:max-w-2xl"
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{current === undefined ? "Module" : current.id}</DialogTitle>
          <DialogDescription>{title}: its name, connections and parameters.</DialogDescription>
        </DialogHeader>
        <div className="-mx-1 flex min-h-0 flex-col gap-4 overflow-y-auto px-1">
          {current === undefined ? null : (
            <Inspector key={current.id} {...props} moduleId={current.id} type={current.type} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** The flowsheet: canvas, a Problems panel under it like VS Code's, the plant's ranges, and the selected module's editor in a window. */
export function FlowsheetTab(props: FlowsheetProps) {
  const { palette, editor, actions, selected, graph } = props;
  const { modules, connections } = graph;
  const { suggested, onDragPort } = useSuggestedPorts(props.projectId);
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <Canvas
        graph={graph}
        layout={editor.layout}
        palette={palette}
        issues={toIssues(props)}
        selected={selected}
        onSelect={props.onOpen}
        onMove={actions.move}
        onMoved={actions.moved}
        onArrange={actions.arrange}
        onConnect={actions.connect}
        onRemoveModule={actions.remove}
        onRemoveConnection={actions.removeConnection}
        onDropModule={actions.add}
        suggested={suggested}
        onDragPort={onDragPort}
      />
      <ProblemsPanel
        problems={editor.problems}
        warnings={editor.warnings}
        connections={connections}
        ids={modules.map((module) => module.id)}
        onSelect={props.onOpen}
      />
      <Card>
        <CardContent className="flex flex-col gap-4">
          <PlantRanges
            projectId={props.projectId}
            version={props.saved.version}
            structureDirty={props.editor.dirty}
          />
        </CardContent>
      </Card>
      <ModuleDialog {...props} />
    </div>
  );
}
