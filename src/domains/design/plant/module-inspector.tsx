import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import {
  checkModuleId,
  readConnections,
  readModules,
  splitPort,
  type SpecConnection,
} from "./spec";
import type { PlantSpec } from "./types";

type Props = {
  spec: PlantSpec;
  moduleId: string;
  title: string;
  onRename: (to: string) => void;
  onRemove: () => void;
  onAddConnection: (connection: SpecConnection) => void;
  onRemoveConnection: (index: number) => void;
};

function IdField({ spec, moduleId, onRename }: Pick<Props, "spec" | "moduleId" | "onRename">) {
  const [text, setText] = useState(moduleId);
  const problem = checkModuleId(spec, moduleId, text);
  const commit = () => {
    if (problem === null && text !== moduleId) onRename(text);
  };
  return (
    <Field label="Module id" htmlFor="module-id">
      <Input
        id="module-id"
        value={text}
        aria-invalid={problem !== null}
        aria-describedby={problem === null ? undefined : "module-id-problem"}
        onChange={(event) => {
          setText(event.target.value);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
        }}
      />
      {problem === null ? null : (
        <p id="module-id-problem" className="text-[12px] text-bad">
          {problem}
        </p>
      )}
    </Field>
  );
}

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TextField({ id, label, value, onChange }: TextFieldProps) {
  return (
    <Field label={label} htmlFor={id}>
      <Input
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </Field>
  );
}

function ConnectionForm({
  spec,
  moduleId,
  onAddConnection,
}: Pick<Props, "spec" | "moduleId" | "onAddConnection">) {
  const [outlet, setOutlet] = useState("");
  const [target, setTarget] = useState("");
  const [inlet, setInlet] = useState("");
  const others = readModules(spec);
  const canAdd = outlet.trim() !== "" && target !== "" && inlet.trim() !== "";
  return (
    <form
      className="flex flex-col gap-2"
      aria-label="Add a connection"
      onSubmit={(event) => {
        event.preventDefault();
        onAddConnection({
          source: `${moduleId}.${outlet.trim()}`,
          target: `${target}.${inlet.trim()}`,
        });
        setOutlet("");
        setInlet("");
      }}
    >
      <TextField
        id="connection-outlet"
        label="From outlet of this module"
        value={outlet}
        onChange={setOutlet}
      />
      <Field label="To module" htmlFor="connection-target">
        <select
          id="connection-target"
          className="w-full rounded-control border border-border bg-surface px-2.5 py-[7px]"
          value={target}
          onChange={(event) => {
            setTarget(event.target.value);
          }}
        >
          <option value="" />
          {others.map((module) => (
            <option key={module.id} value={module.id}>
              {module.id}
            </option>
          ))}
        </select>
      </Field>
      <TextField id="connection-inlet" label="To inlet" value={inlet} onChange={setInlet} />
      <Button type="submit" disabled={!canAdd}>
        Add connection
      </Button>
    </form>
  );
}

/** The inspector of one module: rename, remove, its connections, and a form to add a connection by port names. */
export function ModuleInspector(props: Props) {
  const { spec, moduleId, title } = props;
  const mine = readConnections(spec)
    .map((connection, index) => ({ connection, index }))
    .filter(({ connection }) =>
      [splitPort(connection.source).module, splitPort(connection.target).module].includes(moduleId),
    );
  return (
    <section aria-label={`Module ${moduleId}`} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2>{title}</h2>
        <Button variant="danger" aria-label={`Remove module ${moduleId}`} onClick={props.onRemove}>
          <Trash2 aria-hidden="true" className="size-3.5" />
          Remove
        </Button>
      </div>
      <IdField key={moduleId} spec={spec} moduleId={moduleId} onRename={props.onRename} />
      <div>
        <h3 className="mb-1 text-[12.5px] text-muted">Connections</h3>
        {mine.length === 0 ? <p className="text-muted">Not connected.</p> : null}
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {mine.map(({ connection, index }) => (
            <li
              key={index}
              className="flex items-center justify-between gap-2 font-mono text-[12px]"
            >
              <span>
                {connection.source} → {connection.target}
              </span>
              <Button
                aria-label={`Remove connection ${connection.source} to ${connection.target}`}
                onClick={() => {
                  props.onRemoveConnection(index);
                }}
              >
                <Trash2 aria-hidden="true" className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <ConnectionForm spec={spec} moduleId={moduleId} onAddConnection={props.onAddConnection} />
    </section>
  );
}
