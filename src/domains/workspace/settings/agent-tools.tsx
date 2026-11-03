import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { connectorsQuery } from "@/shared/api/connectors";
import { toFieldMessage } from "@/shared/api/errors";
import type { Project } from "@/shared/api/types";
import { useSetAgentTools } from "./api";

function MemoryField({ project }: { project: Project }) {
  const save = useSetAgentTools(project.id);
  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor="project-memory">Shared memory</FieldLabel>
      <NativeSelect
        id="project-memory"
        value={project.memory ?? ""}
        disabled={save.isPending}
        onChange={(event) => {
          const memory = event.target.value === "on" ? "on" : "off";
          save.mutate({ memory }, { onSuccess: () => toast(`Memory ${memory}`) });
        }}
      >
        {project.memory === null || project.memory === undefined ? (
          <NativeSelectOption value="">Not chosen (no memory)</NativeSelectOption>
        ) : null}
        <NativeSelectOption value="on">
          On: agents use the knowledge and past designs
        </NativeSelectOption>
        <NativeSelectOption value="off">Off: agents work from this project only</NativeSelectOption>
      </NativeSelect>
      {save.error === null ? null : (
        <p role="alert" className="text-bad">
          {toFieldMessage(save.error)}
        </p>
      )}
    </Field>
  );
}

function ConnectorChoice({ project }: { project: Project }) {
  const connectors = useQuery(connectorsQuery());
  const save = useSetAgentTools(project.id);
  const chosen = new Set(project.connectors ?? []);
  if (connectors.isError || connectors.data === undefined) return null;
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">Connectors</legend>
      {connectors.data.length === 0 ? (
        <p className="text-muted-foreground">No connectors yet.</p>
      ) : null}
      {connectors.data.map((connector) => (
        <label
          key={connector.id}
          htmlFor={`project-connector-${connector.id}`}
          className="inline-flex items-center gap-2 text-sm"
        >
          <Checkbox
            id={`project-connector-${connector.id}`}
            checked={chosen.has(connector.id)}
            disabled={save.isPending || !connector.enabled}
            onCheckedChange={(checked) => {
              const next = new Set(chosen);
              if (checked === true) next.add(connector.id);
              else next.delete(connector.id);
              save.mutate({ connectors: [...next] });
            }}
          />
          {connector.name}
          {connector.enabled ? null : <span className="text-muted-foreground">(off)</span>}
        </label>
      ))}
    </fieldset>
  );
}

/** What the project's agents may use: the shared memory, on or off, and the connectors. */
export function AgentTools({ project }: { project: Project }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <b>Agents</b>
        <p className="text-muted">What the assistant may use in this project.</p>
      </div>
      <MemoryField project={project} />
      <ConnectorChoice project={project} />
    </div>
  );
}
