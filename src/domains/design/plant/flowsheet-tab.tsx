import { Card, CardBody } from "@/shared/ui/card";
import { Canvas, type Issues } from "./canvas";
import { ModuleInspector } from "./module-inspector";
import { PalettePanel } from "./palette-panel";
import { ParametersPanel, type ParameterDraft } from "./parameters-panel";
import { ProblemsPanel } from "./problems-panel";
import { modulesOfProblem, readConnections, readModules, toPorts } from "./spec";
import type { Flowsheet, ModulePorts, Palette } from "@/shared/api/types";
import type { usePlantActions } from "./use-plant-actions";
import type { usePlantEditor } from "./use-plant-editor";

export type FlowsheetProps = {
  projectId: string;
  saved: Flowsheet;
  palette: Palette[];
  catalog: ModulePorts[];
  editor: ReturnType<typeof usePlantEditor>;
  actions: ReturnType<typeof usePlantActions>;
  selected: string | null;
  onSelect: (id: string | null) => void;
  draft: ParameterDraft | null;
  onDraft: (draft: ParameterDraft | null) => void;
  onConflict: () => void;
};

function toIssues(editor: FlowsheetProps["editor"]): Issues {
  const connections = readConnections(editor.spec);
  const ids = readModules(editor.spec).map((module) => module.id);
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

/** The flowsheet tab: palette, canvas with problems below it, and the inspector of the selected module. */
export function FlowsheetTab(props: FlowsheetProps) {
  const { palette, editor, actions, selected } = props;
  const modules = readModules(editor.spec);
  const connections = readConnections(editor.spec);
  const ports = toPorts(modules, props.catalog);
  const current = modules.find((module) => module.id === selected);
  return (
    <div className="grid gap-3.5 lg:grid-cols-[170px_minmax(0,1fr)_280px]">
      <Card>
        <CardBody>
          <PalettePanel
            items={palette}
            onAdd={(type) => {
              actions.add(type);
            }}
          />
        </CardBody>
      </Card>
      <div className="min-w-0">
        <Canvas
          spec={editor.spec}
          layout={editor.layout}
          palette={palette}
          ports={ports}
          issues={toIssues(editor)}
          selected={selected}
          onSelect={props.onSelect}
          onMove={actions.move}
          onMoved={actions.moved}
          onConnect={actions.connect}
          onRemoveModule={actions.remove}
          onRemoveConnection={actions.removeConnection}
          onDropModule={actions.add}
        />
        <ProblemsPanel
          problems={editor.problems}
          connections={connections}
          ids={modules.map((module) => module.id)}
          onSelect={props.onSelect}
        />
      </div>
      <Card>
        <CardBody className="flex flex-col gap-4">
          {current === undefined ? (
            <p className="text-muted">Select a module to edit it.</p>
          ) : (
            <Inspector key={current.id} {...props} moduleId={current.id} type={current.type} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
