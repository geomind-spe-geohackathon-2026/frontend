import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/cn";
import { headerHeight, portRowHeight } from "@/shared/plant/auto-layout";
import { toStreamColor } from "@/shared/plant/stream-colors";
import type { PortKinds } from "@/shared/plant/spec";

export type ModuleNodeData = {
  title: string;
  moduleId: string;
  category: string;
  ports: PortKinds;
  issue: "none" | "missing" | "invalid";
};

export type ModuleFlowNode = Node<ModuleNodeData, "module">;
export type GroupFlowNode = Node<{ label: string }, "frame">;

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
        "relative flex items-center text-[14px] whitespace-nowrap text-muted",
        side === "in" ? "justify-start pl-3" : "justify-end pr-3",
      )}
      style={{ height: portRowHeight }}
    >
      <Handle
        id={name}
        type={side === "in" ? "target" : "source"}
        position={side === "in" ? Position.Left : Position.Right}
        aria-label={`${side === "in" ? "Inlet" : "Outlet"} ${label}`}
        title={label}
        style={{ background: toStreamColor(stream), width: 11, height: 11 }}
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
        "size-full rounded-card border bg-surface shadow-sm",
        issueClass[data.issue],
        selected && "outline-2 outline-accent",
      )}
    >
      <div className="px-3 pt-2" style={{ height: headerHeight }}>
        <p className="truncate text-[15px] leading-5 font-medium" title={data.title}>
          {data.title}
        </p>
        <p className="truncate font-mono text-[13px] leading-5 text-muted" title={data.moduleId}>
          {data.moduleId}
          {data.issue === "none" ? null : (
            <span className={data.issue === "missing" ? " text-warn" : " text-bad"}>
              {data.issue === "missing" ? " · missing values" : " · has problems"}
            </span>
          )}
        </p>
      </div>
      <div className="flex justify-between gap-3">
        <ul className="m-0 min-w-0 list-none p-0">
          {[...data.ports.inlets].map(([name, stream]) => (
            <PortRow key={name} name={name} stream={stream} side="in" />
          ))}
        </ul>
        <ul className="m-0 min-w-0 list-none p-0">
          {[...data.ports.outlets].map(([name, stream]) => (
            <PortRow key={name} name={name} stream={stream} side="out" />
          ))}
        </ul>
      </div>
    </div>
  );
}

/** The frame behind the modules of one group, with the group's name. */
export function GroupFrameNode({ data }: NodeProps<GroupFlowNode>) {
  return (
    <div className="size-full rounded-card border border-dashed border-border bg-surface/40 px-3 py-1.5">
      <p className="text-[15px] font-medium tracking-wide text-muted uppercase">{data.label}</p>
    </div>
  );
}
