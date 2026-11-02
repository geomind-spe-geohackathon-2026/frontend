import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { checkModuleId, readConnections, splitPort } from "./spec";
import type { PlantSpec } from "./types";

type Props = {
  spec: PlantSpec;
  moduleId: string;
  title: string;
  onRename: (to: string) => void;
  onRemove: () => void;
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

/** The inspector of one module: rename, remove and its connections; new connections are drawn on the canvas. */
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
    </section>
  );
}
