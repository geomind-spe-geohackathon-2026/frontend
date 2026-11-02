import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/shared/api/errors";
import { isEqualDocument } from "@/shared/forms/document";
import { LoadError } from "@/shared/forms/load-error";
import { NoteDialog } from "@/shared/forms/note-dialog";
import { SchemaForm } from "@/shared/forms/schema-form";
import type { Problem } from "@/shared/forms/json-schema";
import { Button } from "@/shared/ui/button";
import { showToast } from "@/shared/ui/toast";
import { parametersQuery, useSaveParameters } from "./api";
import type { Parameters } from "./types";

export type ParameterDraft = { module: string; params: Record<string, unknown>; blocked: boolean };

type Props = {
  projectId: string;
  moduleId: string;
  version: number;
  structureDirty: boolean;
  draft: ParameterDraft | null;
  onDraft: (draft: ParameterDraft | null) => void;
  onConflict: () => void;
};

function toParams(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : {};
}

type EditorProps = Props & { data: Parameters };

function useParameterSave(props: Props, edited: ParameterDraft | null) {
  const save = useSaveParameters(props.projectId);
  const [isNoting, setIsNoting] = useState(false);
  const submit = (note: string) => {
    if (edited === null) return;
    const input = { base: props.version, module: props.moduleId, params: edited.params, note };
    save.mutate(input, {
      onSuccess: (saved) => {
        setIsNoting(false);
        props.onDraft(null);
        showToast(`Plant v${String(saved.number)} saved`);
      },
      onError: (error) => {
        setIsNoting(false);
        if (error instanceof ApiError && "latest" in error.details) props.onConflict();
      },
    });
  };
  return { save, isNoting, setIsNoting, submit };
}

function ParameterEditor(props: EditorProps) {
  const { moduleId, version, draft, onDraft, data } = props;
  const edited = draft?.module === moduleId ? draft : null;
  const { save, isNoting, setIsNoting, submit } = useParameterSave(props, edited);
  const handleChange = (value: unknown, problems: Problem[]) => {
    const params = toParams(value);
    const same = isEqualDocument(params, data.values);
    onDraft(same ? null : { module: moduleId, params, blocked: problems.length > 0 });
  };
  const cannotSave = edited === null || edited.blocked || props.structureDirty || save.isPending;
  return (
    <div className="flex flex-col gap-3">
      <SchemaForm
        key={`${moduleId}-${String(version)}`}
        schema={data.schema}
        initial={edited?.params ?? data.values}
        missing={data.missing}
        onChange={handleChange}
      />
      {save.error instanceof ApiError ? (
        <p role="alert" className="text-bad">
          {save.error.code}: {save.error.message}
        </p>
      ) : null}
      <Button
        variant="primary"
        className="self-start"
        disabled={cannotSave}
        onClick={() => {
          setIsNoting(true);
        }}
      >
        Save parameters
      </Button>
      {props.structureDirty ? (
        <p className="text-muted">Save the flowsheet before saving parameters.</p>
      ) : null}
      <NoteDialog
        open={isNoting}
        pending={save.isPending}
        onSave={submit}
        onClose={() => {
          setIsNoting(false);
        }}
      />
    </div>
  );
}

/** The parameter form of one module from its schema with units; saving makes a new plant version. */
export function ParametersPanel(props: Props) {
  const parameters = useQuery(parametersQuery(props.projectId, props.moduleId));
  if (parameters.isPending) return <p className="text-muted">Loading the parameters…</p>;
  if (parameters.isError) {
    const code = parameters.error instanceof ApiError ? parameters.error.code : "";
    if (code === "module_not_found") {
      return <p className="text-muted">Save the flowsheet to edit this module's parameters.</p>;
    }
    return (
      <LoadError
        error={parameters.error}
        what="parameters"
        onRetry={() => void parameters.refetch()}
      />
    );
  }
  return <ParameterEditor {...props} data={parameters.data} />;
}
