import { useSaveLayout } from "./api";
import {
  nextModuleId,
  readConnections,
  readModules,
  withConnection,
  withModule,
  withoutConnection,
  withoutModule,
  withPosition,
  withRenamedModule,
  withRenamedPosition,
} from "./spec";
import type { Flowsheet } from "@/shared/api/types";
import type { usePlantEditor } from "./use-plant-editor";

type Editor = ReturnType<typeof usePlantEditor>;

const stepY = 110;

/** The canvas and inspector edits as small functions over the editor draft. */
export function usePlantActions(
  projectId: string,
  saved: Flowsheet,
  editor: Editor,
  select: (id: string | null) => void,
) {
  const layoutSave = useSaveLayout(projectId);
  const add = (type: string, x?: number, y?: number) => {
    const id = nextModuleId(editor.spec, type);
    const bottom = Math.max(0, ...Object.values(editor.layout).map((at) => at.y));
    const next = withModule(editor.spec, id, type);
    editor.editSpec(next, withPosition(editor.layout, id, x ?? 0, y ?? bottom + stepY));
    select(id);
  };
  const moved = (id: string, x: number, y: number) => {
    const layout = withPosition(editor.layout, id, x, y);
    editor.setLayout(layout);
    if (!editor.dirty) layoutSave.mutate({ base: saved.version, layout });
  };
  const connect = (source: string, target: string) => {
    const exists = readConnections(editor.spec).some(
      (item) => item.source === source && item.target === target,
    );
    if (!exists) editor.editSpec(withConnection(editor.spec, { source, target }));
  };
  const rename = (from: string, to: string) => {
    editor.editSpec(
      withRenamedModule(editor.spec, from, to),
      withRenamedPosition(editor.layout, from, to),
    );
    select(to);
  };
  const remove = (id: string) => {
    editor.editSpec(withoutModule(editor.spec, id));
    select(null);
  };
  return {
    add,
    moved,
    connect,
    rename,
    remove,
    move: (id: string, x: number, y: number) => {
      editor.setLayout(withPosition(editor.layout, id, x, y));
    },
    removeConnection: (index: number) => {
      editor.editSpec(withoutConnection(editor.spec, index));
    },
    hasModule: (id: string) => readModules(editor.spec).some((module) => module.id === id),
  };
}
