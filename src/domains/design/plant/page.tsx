import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError, hasCode } from "@/shared/api/errors";
import { ConflictDialog } from "@/shared/forms/conflict-dialog";
import { LoadError } from "@/shared/forms/load-error";
import { NoteDialog } from "@/shared/forms/note-dialog";
import { UnsavedChangesDialog, useUnsavedGuard } from "@/shared/forms/unsaved-guard";
import { PageHeader } from "@/shared/layout/page-header";
import { useRequiredParam } from "@/shared/layout/params";
import { Button } from "@/shared/ui/button";
import { Card, CardBody } from "@/shared/ui/card";
import { Chip } from "@/shared/ui/chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { showToast } from "@/shared/ui/toast";
import {
  flowsheetQuery,
  paletteQuery,
  plantKeys,
  plantVersionQuery,
  useSaveFlowsheet,
} from "./api";
import { FlowsheetTab, type FlowsheetProps } from "./flowsheet-tab";
import { HistoryPanel } from "./history-panel";
import type { ParameterDraft } from "./parameters-panel";
import { TemplatesDialog } from "./templates-dialog";
import type { Flowsheet, Palette } from "@/shared/api/types";
import type { SaveFlowsheetInput } from "./types";
import { usePlantActions } from "./use-plant-actions";
import { useAutoLayout } from "./use-auto-layout";
import { usePlantEditor } from "./use-plant-editor";

type Editor = ReturnType<typeof usePlantEditor>;

function validityChip(editor: Editor) {
  const blocking = editor.problems.filter((problem) => problem.code !== "missing_value").length;
  const missing = editor.problems.length - blocking;
  if (editor.isChecking) return <Chip tone="off">checking</Chip>;
  if (blocking > 0) return <Chip tone="bad">{blocking} problems</Chip>;
  if (missing > 0) return <Chip tone="warn">{missing} values missing</Chip>;
  return <Chip tone="ok">valid</Chip>;
}

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
    save.mutate(input, {
      onSuccess: (saved) => {
        setIsNoting(false);
        then();
        showToast(`Plant v${String(saved.version)} saved`);
      },
      onError: (error) => {
        setIsNoting(false);
        if (error instanceof ApiError && "latest" in error.details) setHasConflict(true);
      },
    });
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

type EditorProps = { projectId: string; saved: Flowsheet; palette: Palette[] };

type ActionsProps = {
  editor: Editor;
  version: number;
  dirty: boolean;
  canSave: boolean;
  onTemplate: () => void;
  onDiscard: () => void;
  onSave: () => void;
};

function PlantActions({ editor, version, dirty, canSave, ...handlers }: ActionsProps) {
  return (
    <>
      {validityChip(editor)}
      <Chip tone="off">v{version}</Chip>
      <Button onClick={handlers.onTemplate}>Start from template</Button>
      <Button disabled={!dirty} onClick={handlers.onDiscard}>
        Discard changes
      </Button>
      <Button variant="primary" disabled={!canSave} onClick={handlers.onSave}>
        Save version
      </Button>
    </>
  );
}

type DialogsProps = {
  saved: Flowsheet;
  editor: Editor;
  flow: PlantSaveFlow;
  isPickingTemplate: boolean;
  onPickingTemplate: (value: boolean) => void;
  onDiscard: () => void;
};

function PlantDialogs({
  saved,
  editor,
  flow,
  isPickingTemplate,
  onPickingTemplate,
  onDiscard,
}: DialogsProps) {
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
      <TemplatesDialog
        open={isPickingTemplate}
        pending={flow.pending}
        replaces
        onClose={() => {
          onPickingTemplate(false);
        }}
        onPick={(name) => {
          const note = `Started from template ${name}`;
          flow.submit({ base: saved.version, note, template: name }, () => {
            onPickingTemplate(false);
            onDiscard();
          });
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

function usePlantParams() {
  const [params, setParams] = useSearchParams();
  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };
  return { selected: params.get("module"), tab: params.get("tab") ?? "flowsheet", setParam };
}

type TabsProps = FlowsheetProps & {
  tab: string;
  onTab: (tab: string) => void;
  onRestore: (number: number) => void;
};

function PlantTabs({ tab, onTab, onRestore, ...flowsheet }: TabsProps) {
  return (
    <Tabs value={tab} onValueChange={onTab}>
      <TabsList aria-label="Plant views">
        <TabsTrigger value="flowsheet">Flowsheet</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="flowsheet">
        <FlowsheetTab {...flowsheet} />
      </TabsContent>
      <TabsContent value="history">
        <HistoryPanel
          projectId={flowsheet.projectId}
          current={flowsheet.saved.version}
          onRestore={onRestore}
        />
      </TabsContent>
    </Tabs>
  );
}

function PlantHeader({ error, ...actions }: ActionsProps & { error: unknown }) {
  return (
    <>
      <PageHeader
        title="2 · Plant"
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

function PlantEditor({ projectId, saved, palette }: EditorProps) {
  const editor = usePlantEditor(saved);
  const queryClient = useQueryClient();
  const { selected, tab, setParam } = usePlantParams();
  const [draft, setDraft] = useState<ParameterDraft | null>(null);
  const [isPickingTemplate, setIsPickingTemplate] = useState(false);
  const flow = useSaveFlow(projectId);
  const select = (id: string | null) => {
    setParam("module", id);
  };
  const actions = usePlantActions(projectId, saved, editor, select);
  useAutoLayout(editor.spec, editor.layout, editor.place);
  const dirty = editor.dirty || draft !== null;
  const blocker = useUnsavedGuard(dirty);
  const hasBlocking = editor.problems.some((problem) => problem.code !== "missing_value");
  const canSave =
    editor.dirty && !hasBlocking && !editor.isChecking && draft === null && !flow.pending;
  const discard = () => {
    editor.reset();
    setDraft(null);
  };
  const restore = async (number: number) => {
    editor.restore(await queryClient.query(plantVersionQuery(projectId, number)));
    setParam("tab", null);
    showToast(`Version ${String(number)} loaded into the editor; save to keep it`);
  };
  return (
    <>
      <PlantHeader
        {...{ editor, dirty, canSave }}
        version={saved.version}
        error={flow.error}
        onTemplate={() => {
          setIsPickingTemplate(true);
        }}
        onDiscard={discard}
        onSave={() => {
          flow.setIsNoting(true);
        }}
      />
      <PlantTabs
        {...{ projectId, saved, palette, editor, actions, selected, draft, tab }}
        onSelect={select}
        onDraft={setDraft}
        onConflict={() => {
          flow.setHasConflict(true);
        }}
        onTab={(next) => {
          setParam("tab", next === "flowsheet" ? null : next);
        }}
        onRestore={(number) => void restore(number)}
      />
      <PlantDialogs
        {...{ saved, editor, flow, isPickingTemplate, onDiscard: discard }}
        onPickingTemplate={setIsPickingTemplate}
      />
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}

function EmptyPlant({ projectId }: { projectId: string }) {
  const [isPicking, setIsPicking] = useState(false);
  const flow = useSaveFlow(projectId);
  return (
    <Card>
      <CardBody className="flex flex-col items-start gap-2">
        <p className="font-medium">This project has no plant yet.</p>
        <p className="text-muted">
          Start from one of gemini's plant templates, then edit the modules.
        </p>
        <Button
          variant="primary"
          onClick={() => {
            setIsPicking(true);
          }}
        >
          Start from template
        </Button>
        <TemplatesDialog
          open={isPicking}
          pending={flow.pending}
          replaces={false}
          onClose={() => {
            setIsPicking(false);
          }}
          onPick={(name) => {
            flow.submit(
              { base: null, note: `Started from template ${name}`, template: name },
              () => {
                setIsPicking(false);
              },
            );
          }}
        />
      </CardBody>
    </Card>
  );
}

/** The 2 · Plant page: a flowsheet editor on gemini's plant document, with validation, versions and templates. */
export function PlantPage() {
  const projectId = useRequiredParam("projectId");
  const saved = useQuery(flowsheetQuery(projectId));
  const palette = useQuery(paletteQuery());
  const header = <PageHeader title="2 · Plant" />;
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
  if (saved.isError && !hasCode(saved.error, "plant_not_found")) {
    return (
      <>
        {header}
        <LoadError error={saved.error} what="plant" onRetry={() => void saved.refetch()} />
      </>
    );
  }
  if (saved.isPending || palette.isPending) {
    return (
      <>
        {header}
        <p className="text-muted" role="status">
          Loading the plant…
        </p>
      </>
    );
  }
  if (saved.isError)
    return (
      <>
        {header}
        <EmptyPlant projectId={projectId} />
      </>
    );
  return <PlantEditor projectId={projectId} saved={saved.data} palette={palette.data} />;
}
