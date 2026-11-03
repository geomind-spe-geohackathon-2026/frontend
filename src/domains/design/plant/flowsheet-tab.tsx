import { createPortal } from "react-dom";
import { usePlantEmbed } from "./embed";
import { PlantRanges } from "./plant-ranges";
import { Card, CardBody } from "@/shared/ui/card";
import { Canvas, type Issues } from "./canvas";
import { ModuleInspector } from "./module-inspector";
import { PalettePanel } from "./palette-panel";
import { ParametersPanel, type ParameterDraft } from "./parameters-panel";
import { ProblemsPanel } from "./problems-panel";
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

function InspectorCard(props: FlowsheetProps) {
  const current = props.graph.modules.find((module) => module.id === props.selected);
  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        {current === undefined ? (
          <>
            <p className="text-muted">Select a module to edit it.</p>
            <PlantRanges
              projectId={props.projectId}
              version={props.saved.version}
              structureDirty={props.editor.dirty}
            />
          </>
        ) : (
          <Inspector key={current.id} {...props} moduleId={current.id} type={current.type} />
        )}
      </CardBody>
    </Card>
  );
}

const ownColumns = "@min-[1080px]:grid-cols-[180px_minmax(0,1fr)_300px]";

/** The flowsheet tab: palette, canvas with problems below it, and the inspector of the selected module. */
export function FlowsheetTab(props: FlowsheetProps) {
  const { palette, editor, actions, selected, graph } = props;
  const { modules, connections } = graph;
  const embed = usePlantEmbed();
  const inspector = <InspectorCard {...props} />;
  const target = embed === null ? null : embed.inspector;
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)] gap-3.5 @min-[640px]:grid-cols-[170px_minmax(0,1fr)] ${target === null ? ownColumns : ""}`}
    >
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
          graph={graph}
          layout={editor.layout}
          palette={palette}
          issues={toIssues(props)}
          selected={selected}
          onSelect={props.onSelect}
          onMove={actions.move}
          onMoved={actions.moved}
          onArrange={actions.arrange}
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
      {target === null ? inspector : createPortal(inspector, target)}
    </div>
  );
}
