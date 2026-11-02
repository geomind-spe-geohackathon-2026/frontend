import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/shared/api/errors";
import { LoadError } from "@/shared/forms/load-error";
import { NoteDialog } from "@/shared/forms/note-dialog";
import { labelOf } from "@/shared/forms/json-schema";
import { Button } from "@/shared/ui/button";
import { showToast } from "@/shared/ui/toast";
import { parametersQuery, useSaveParameters } from "./api";
import {
  toFieldResult,
  toGroups,
  toParameterFields,
  type FieldEdit,
  type ParameterField,
} from "./parameter-fields";
import { ParameterRow } from "./parameter-row";
import type { Parameters } from "@/shared/api/types";

export type ParameterDraft = {
  module: string;
  edits: Record<string, FieldEdit>;
  params: Record<string, unknown>;
  blocked: boolean;
};

type Props = {
  projectId: string;
  moduleId: string;
  version: number;
  structureDirty: boolean;
  draft: ParameterDraft | null;
  onDraft: (draft: ParameterDraft | null) => void;
  onConflict: () => void;
};

type EditorProps = Props & { data: Parameters };

type RowsProps = {
  fields: ParameterField[];
  data: Parameters;
  edits: Record<string, FieldEdit>;
  onEdit: (name: string, edit: FieldEdit | null) => void;
};

function toDraft(
  module: string,
  fields: ParameterField[],
  edits: Record<string, FieldEdit>,
): ParameterDraft | null {
  const results = Object.entries(edits).flatMap(([name, edit]) => {
    const field = fields.find((item) => item.name === name);
    return field === undefined ? [] : [[name, toFieldResult(field, edit)] as const];
  });
  if (results.length === 0) return null;
  return {
    module,
    edits,
    params: Object.fromEntries(results.map(([name, result]) => [name, result.value])),
    blocked: results.some(([, result]) => result.problem !== null),
  };
}

function toServerMessage(error: ApiError): string {
  const detail = error.details.message;
  return typeof detail === "string" ? detail : `${error.code}: ${error.message}`;
}

function ParameterRows({ fields, data, edits, onEdit }: RowsProps) {
  return (
    <div className="flex flex-col gap-3">
      {fields.map((field) => (
        <ParameterRow
          key={field.name}
          field={field}
          stored={data.values[field.local]}
          edit={edits[field.name]}
          isMissing={data.missing.includes(field.local)}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

type GroupProps = Omit<RowsProps, "data"> & { projectId: string; path: string };

function GroupRows({ projectId, path, ...rows }: GroupProps) {
  const child = useQuery(parametersQuery(projectId, path));
  if (child.isPending) return <p className="text-muted">Loading the parameters…</p>;
  if (child.isError) {
    return <LoadError error={child.error} what="parameters" onRetry={() => void child.refetch()} />;
  }
  return <ParameterRows {...rows} data={child.data} />;
}

function ParameterGroup({ group, ...props }: GroupProps & { group: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const isEdited = props.fields.some((field) => props.edits[field.name] !== undefined);
  return (
    <details
      className="rounded-card border border-border p-2.5"
      open={isOpen || isEdited}
      onToggle={(event) => {
        setIsOpen(event.currentTarget.open);
      }}
    >
      <summary className="cursor-pointer text-[12.5px] font-medium">
        {labelOf(group.replaceAll(".", " "), {})}
      </summary>
      {isOpen || isEdited ? (
        <div className="mt-2.5">
          <GroupRows {...props} />
        </div>
      ) : null}
    </details>
  );
}

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
  const { moduleId, draft, onDraft, data } = props;
  const edited = draft?.module === moduleId ? draft : null;
  const edits = edited?.edits ?? {};
  const fields = toParameterFields(data.schema);
  const { save, isNoting, setIsNoting, submit } = useParameterSave(props, edited);
  const handleEdit = (name: string, edit: FieldEdit | null) => {
    const others = Object.fromEntries(Object.entries(edits).filter(([key]) => key !== name));
    onDraft(toDraft(moduleId, fields, edit === null ? others : { ...others, [name]: edit }));
  };
  const cannotSave = edited === null || edited.blocked || props.structureDirty || save.isPending;
  if (fields.length === 0) return <p className="text-muted">This module has no parameters.</p>;
  const own = fields.filter((field) => field.group === "");
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ParameterRows fields={own} data={data} edits={edits} onEdit={handleEdit} />
      {toGroups(fields).map((group) => (
        <ParameterGroup
          key={group}
          group={group}
          projectId={props.projectId}
          path={`${moduleId}.${group}`}
          fields={fields.filter((field) => field.group === group)}
          edits={edits}
          onEdit={handleEdit}
        />
      ))}
      {save.error instanceof ApiError ? (
        <p role="alert" className="text-bad">
          {toServerMessage(save.error)}
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

/** The parameters of one module, each with its value, unit and range; saving makes a new plant version. */
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
