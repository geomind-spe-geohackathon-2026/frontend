import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError, hasCode } from "@/shared/api/errors";
import { ConflictDialog } from "@/shared/forms/conflict-dialog";
import { LoadError } from "@/shared/forms/load-error";
import { NoteDialog } from "@/shared/forms/note-dialog";
import { UnsavedChangesDialog, useUnsavedGuard } from "@/shared/forms/unsaved-guard";
import { PageHeader } from "@/shared/layout/page-header";
import { HistoryButton, toVersionParam } from "@/shared/layout/history-button";
import { useRequiredParam } from "@/shared/layout/params";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import {
  flowsheetQuery,
  paletteQuery,
  portsQuery,
  plantKeys,
  plantVersionQuery,
  useSaveFlowsheet,
} from "./api";
import { FlowsheetTab } from "./flowsheet-tab";
import { HistoryPanel } from "./history-panel";
import { ValidityStatus, toMissingModules } from "./validity-status";
import type { ParameterDraft } from "./parameters-panel";
import { AddModuleButton } from "./palette-panel";
import type { Flowsheet, ModulePorts, Palette } from "@/shared/api/types";
import type { SaveFlowsheetInput } from "./types";
import { usePlantActions } from "./use-plant-actions";
import { useAutoLayout, usePlantGraph, type PlantGraph } from "./use-auto-layout";
import { usePlantEditor } from "./use-plant-editor";
import { Notice } from "@/shared/ui/notice";

type Editor = ReturnType<typeof usePlantEditor>;

type PlantSaveFlow = {
  isNoting: boolean;
  setIsNoting: (value: boolean) => void;
  hasConflict: boolean;
  setHasConflict: (value: boolean) => void;
  pending: boolean;
  error: unknown;
  submit: (input: SaveFlowsheetInput, then: () => void) => void;
  reload: (discard: () => void) => void;
};

function useSaveFlow(projectId: string): PlantSaveFlow {
  const queryClient = useQueryClient();
  const save = useSaveFlowsheet(projectId);
  const [isNoting, setIsNoting] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const submit = (input: SaveFlowsheetInput, then: () => void) => {
    save.mutateAsync(input).then(
      (saved) => {
        setIsNoting(false);
        then();
        toast(`Plant v${String(saved.version)} saved`);
      },
      (error: unknown) => {
        setIsNoting(false);
        if (error instanceof ApiError && "latest" in error.details) setHasConflict(true);
      },
    );
  };
  const reload = (discard: () => void) => {
    setHasConflict(false);
    discard();
    void queryClient.invalidateQueries({ queryKey: plantKeys.all(projectId) });
  };
  return {
    isNoting,
    setIsNoting,
    hasConflict,
    setHasConflict,
    pending: save.isPending,
    error: save.error,
    submit,
    reload,
  };
}

type EditorProps = {
  projectId: string;
  saved: Flowsheet;
  palette: Palette[];
  catalog: ModulePorts[];
};

type ActionsProps = {
  editor: Editor;
  graph: PlantGraph;
  selected: string | null;
  onSelect: (id: string | null) => void;
  version: number;
  dirty: boolean;
  canSave: boolean;
  history: ReactNode;
  add: ReactNode;
  onDiscard: () => void;
  onSave: () => void;
};

function PlantActions({
  dirty,
  canSave,
  history,
  add,
  ...handlers
}: Pick<ActionsProps, "dirty" | "canSave" | "history" | "add" | "onDiscard" | "onSave">) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {dirty ? <span className="text-[12.5px] text-muted">unsaved changes</span> : null}
      {add}
      {history}
      <Button disabled={!dirty} onClick={handlers.onDiscard}>
        Discard changes
      </Button>
      <Button variant="default" disabled={!canSave} onClick={handlers.onSave}>
        Save version
      </Button>
    </div>
  );
}

type DialogsProps = {
  saved: Flowsheet;
  editor: Editor;
  flow: PlantSaveFlow;
  onDiscard: () => void;
};

function PlantDialogs({ saved, editor, flow, onDiscard }: DialogsProps) {
  return (
    <>
      <NoteDialog
        open={flow.isNoting}
        pending={flow.pending}
        onSave={(note) => {
          flow.submit(
            { base: saved.version, note, spec: editor.spec, layout: editor.layout },
            onDiscard,
          );
        }}
        onClose={() => {
          flow.setIsNoting(false);
        }}
      />
      <ConflictDialog
        open={flow.hasConflict}
        what="plant"
        onKeep={() => {
          flow.setHasConflict(false);
        }}
        onReload={() => {
          flow.reload(onDiscard);
        }}
      />
    </>
  );
}

const followKey = "follow";

function usePlantParams() {
  const [params, setParams] = useSearchParams();
  const setValues = (values: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
  };
  return {
    selected: params.get("module"),
    isFollowing: params.has(followKey),
    setValues,
    setParam: (key: string, value: string | null) => {
      setValues({ [key]: value });
    },
    follow: () => {
      setValues({ [followKey]: "missing" });
    },
  };
}

function useFollowMissing(
  { isFollowing, setValues }: ReturnType<typeof usePlantParams>,
  editor: Editor,
  graph: PlantGraph,
) {
  const { problems, isChecking } = editor;
  useEffect(() => {
    if (!isFollowing || isChecking) return;
    const first = toMissingModules(problems, graph)[0] ?? null;
    setValues({ [followKey]: null, module: first });
  });
}

function PlantHeader({ error, version, ...actions }: ActionsProps & { error: unknown }) {
  return (
    <>
      <PageHeader
        title="Plant"
        badge={
          <>
            <Badge variant="off">v{version}</Badge>
            <ValidityStatus
              editor={actions.editor}
              graph={actions.graph}
              selected={actions.selected}
              onSelect={actions.onSelect}
            />
          </>
        }
        description="The modules of the plant and how they are connected."
        actions={<PlantActions {...actions} />}
      />
      {error instanceof ApiError ? (
        <p role="alert" className="mb-3 text-bad">
          {error.code}: {error.message}
        </p>
      ) : null}
    </>
  );
}

function useRestore(projectId: string, editor: Editor) {
  const queryClient = useQueryClient();
  return async (number: number) => {
    editor.restore(await queryClient.query(plantVersionQuery(projectId, number)));
    toast(`Version ${String(number)} loaded into the editor; save to keep it`);
  };
}

function PlantHistory({
  projectId,
  current,
  onRestore,
}: {
  projectId: string;
  current: number;
  onRestore: (number: number) => Promise<void>;
}) {
  const [params, setParams] = useSearchParams();
  const initial = toVersionParam(params);
  const [open, setOpen] = useState(initial !== undefined);
  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next || initial === undefined) return;
    const rest = new URLSearchParams(params);
    rest.delete("version");
    setParams(rest, { replace: true });
  };
  return (
    <HistoryButton what="plant" open={open} onOpenChange={onOpenChange}>
      <HistoryPanel
        projectId={projectId}
        current={current}
        initial={initial}
        onRestore={(number) => {
          onOpenChange(false);
          void onRestore(number);
        }}
      />
    </HistoryButton>
  );
}

function useModuleWindow(
  selected: string | null,
  setParam: (key: string, value: string | null) => void,
) {
  const [closed, setClosed] = useState<string | null>(null);
  const select = (id: string | null) => {
    setParam("module", id);
  };
  const open = (id: string | null) => {
    setClosed(null);
    select(id);
  };
  const setEditing = (value: boolean) => {
    setClosed(value ? null : selected);
  };
  const edit = () => {
    setClosed(null);
  };
  return { editing: selected !== null && closed !== selected, setEditing, select, open, edit };
}

function EditModuleButton({ selected, onEdit }: { selected: string | null; onEdit: () => void }) {
  return (
    <Button
      disabled={selected === null}
      title={selected === null ? "Click a module on the flowsheet first" : `Edit ${selected}`}
      onClick={onEdit}
    >
      <Pencil aria-hidden="true" />
      Edit module
    </Button>
  );
}

function ModuleButtons({
  palette,
  selected,
  onAdd,
  onEdit,
}: {
  palette: Palette[];
  selected: string | null;
  onAdd: ReturnType<typeof usePlantActions>["add"];
  onEdit: () => void;
}) {
  return (
    <>
      <AddModuleButton items={palette} onAdd={onAdd} />
      <EditModuleButton selected={selected} onEdit={onEdit} />
    </>
  );
}

function toCanSave(editor: Editor, draft: ParameterDraft | null, flow: PlantSaveFlow): boolean {
  const hasBlocking = editor.problems.some((problem) => problem.code !== "missing_value");
  return editor.dirty && !hasBlocking && !editor.isChecking && draft === null && !flow.pending;
}

function PlantEditor({ projectId, saved, palette, catalog }: EditorProps) {
  const editor = usePlantEditor(projectId, saved);
  const params = usePlantParams();
  const { selected, setParam } = params;
  const [draft, setDraft] = useState<ParameterDraft | null>(null);
  const flow = useSaveFlow(projectId);
  const { editing, setEditing, select, open, edit } = useModuleWindow(selected, setParam);
  const actions = usePlantActions(projectId, saved, editor, select);
  const graph = usePlantGraph(editor.spec, catalog, palette);
  useAutoLayout(graph, editor.layout, editor.place);
  useFollowMissing(params, editor, graph);
  const dirty = editor.dirty || draft !== null;
  const blocker = useUnsavedGuard(dirty);
  const canSave = toCanSave(editor, draft, flow);
  const discard = () => {
    editor.reset();
    setDraft(null);
  };
  const restore = useRestore(projectId, editor);
  return (
    <>
      <PlantHeader
        {...{ editor, graph, selected, dirty, canSave }}
        version={saved.version}
        error={flow.error}
        add={
          <ModuleButtons palette={palette} selected={selected} onAdd={actions.add} onEdit={edit} />
        }
        history={<PlantHistory projectId={projectId} current={saved.version} onRestore={restore} />}
        onSelect={open}
        onDiscard={discard}
        onSave={() => {
          flow.setIsNoting(true);
        }}
      />
      <FlowsheetTab
        {...{ projectId, saved, palette, graph, editor, actions, selected, draft, editing }}
        onSelect={select}
        onOpen={open}
        onEditing={setEditing}
        onDraft={setDraft}
        onConflict={() => {
          flow.setHasConflict(true);
        }}
      />
      <PlantDialogs {...{ saved, editor, flow, onDiscard: discard }} />
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}

function EmptyPlant() {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-2">
        <p className="font-medium">This project has no plant yet.</p>
        <p className="text-muted">Ask the assistant in the chat to design one for this project.</p>
      </CardContent>
    </Card>
  );
}

/** The Plant page: a flowsheet editor on gemini's plant document, with validation, versions and templates. */
export function PlantPage() {
  const projectId = useRequiredParam("projectId");
  const saved = useQuery(flowsheetQuery(projectId));
  const palette = useQuery(paletteQuery());
  const ports = useQuery(portsQuery());
  const header = <PageHeader title="Plant" />;
  if (palette.isError) {
    return (
      <>
        {header}
        <LoadError
          error={palette.error}
          what="module palette"
          onRetry={() => void palette.refetch()}
        />
      </>
    );
  }
  if (ports.isError) {
    return (
      <>
        {header}
        <LoadError error={ports.error} what="module ports" onRetry={() => void ports.refetch()} />
      </>
    );
  }
  if (saved.isError && !hasCode(saved.error, "plant_not_found")) {
    return (
      <>
        {header}
        <LoadError error={saved.error} what="plant" onRetry={() => void saved.refetch()} />
      </>
    );
  }
  if (saved.isPending || palette.isPending || ports.isPending) {
    return (
      <>
        {header}
        <Notice status="loading" what="the plant" />
      </>
    );
  }
  if (saved.isError)
    return (
      <>
        {header}
        <EmptyPlant />
      </>
    );
  return (
    <PlantEditor
      projectId={projectId}
      saved={saved.data}
      palette={palette.data}
      catalog={ports.data}
    />
  );
}
