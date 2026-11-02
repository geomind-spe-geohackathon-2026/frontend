import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/cn";
import { toStreamColor } from "./stream-colors";
import type { PortKinds } from "./spec";

export type ModuleNodeData = {
  title: string;
  moduleId: string;
  category: string;
  ports: PortKinds;
  issue: "none" | "missing" | "invalid";
};

export type ModuleFlowNode = Node<ModuleNodeData, "module">;

const issueClass = {
  none: "border-border",
  missing: "border-warn",
  invalid: "border-bad",
};

function PortRow({
  name,
  stream,
  side,
}: {
  name: string;
  stream: string | null;
  side: "in" | "out";
}) {
  const label = stream === null ? name : `${name} (${stream})`;
  return (
    <li
      className={cn(
        "relative text-[10.5px] text-muted",
        side === "in" ? "pl-3" : "pr-3 text-right",
      )}
    >
      <Handle
        id={name}
        type={side === "in" ? "target" : "source"}
        position={side === "in" ? Position.Left : Position.Right}
        aria-label={`${side === "in" ? "Inlet" : "Outlet"} ${label}`}
        title={label}
        style={{ background: toStreamColor(stream), width: 9, height: 9 }}
      />
      {name}
    </li>
  );
}

/** A flowsheet node: gemini class name as title, the module id, and a coloured handle for every known port. */
export function ModuleNode({ data, selected }: NodeProps<ModuleFlowNode>) {
  return (
    <div
      className={cn(
        "min-w-[170px] rounded-card border bg-surface px-2.5 py-2 shadow-sm",
        issueClass[data.issue],
        selected && "outline-2 outline-accent",
      )}
    >
      <p className="font-medium">{data.title}</p>
      <p className="font-mono text-[11px] text-muted">
        {data.moduleId}
        {data.issue === "none" ? null : (
          <span className={data.issue === "missing" ? " text-warn" : " text-bad"}>
            {data.issue === "missing" ? " · missing values" : " · has problems"}
          </span>
        )}
      </p>
      <div className="mt-1.5 flex justify-between gap-3">
        <ul className="m-0 list-none p-0">
          {[...data.ports.inlets].map(([name, stream]) => (
            <PortRow key={name} name={name} stream={stream} side="in" />
          ))}
        </ul>
        <ul className="m-0 list-none p-0">
          {[...data.ports.outlets].map(([name, stream]) => (
            <PortRow key={name} name={name} stream={stream} side="out" />
          ))}
        </ul>
      </div>
    </div>
  );
}
