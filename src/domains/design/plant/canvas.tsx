import "@xyflow/react/dist/style.css";
import { useEffect } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
} from "@xyflow/react";
import { ModuleNode, type ModuleFlowNode } from "./module-node";
import { toStreamColor } from "./stream-colors";
import { isSameKind, readConnections, readModules, splitPort, type PortKinds } from "./spec";
import type { Palette } from "@/shared/api/types";
import type { Layout } from "@/shared/api/layout";
import type { PlantSpec } from "./types";

export const moduleDragType = "application/x-plant-module";

const nodeTypes = { module: ModuleNode };

export type Issues = Map<string, "missing" | "invalid">;

type Props = {
  spec: PlantSpec;
  layout: Layout;
  palette: Palette[];
  ports: Map<string, PortKinds>;
  issues: Issues;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onMoved: (id: string, x: number, y: number) => void;
  onConnect: (source: string, target: string) => void;
  onRemoveModule: (id: string) => void;
  onRemoveConnection: (index: number) => void;
  onDropModule: (type: string, x: number, y: number) => void;
};

function toNodes(props: Props): ModuleFlowNode[] {
  const empty: PortKinds = { inlets: new Map(), outlets: new Map() };
  return readModules(props.spec).map((module) => ({
    id: module.id,
    type: "module",
    position: props.layout[module.id] ?? { x: 0, y: 0 },
    selected: module.id === props.selected,
    data: {
      title: props.palette.find((item) => item.type === module.type)?.title ?? module.type,
      moduleId: module.id,
      category: props.palette.find((item) => item.type === module.type)?.category ?? "",
      ports: props.ports.get(module.id) ?? empty,
      issue: props.issues.get(module.id) ?? "none",
    },
  }));
}

function toEdges(props: Props): Edge[] {
  return readConnections(props.spec).map((connection, index) => {
    const from = splitPort(connection.source);
    const stream = props.ports.get(from.module)?.outlets.get(from.port) ?? null;
    return {
      id: `c${String(index)}`,
      source: from.module,
      sourceHandle: from.port,
      target: splitPort(connection.target).module,
      targetHandle: splitPort(connection.target).port,
      label: stream ?? undefined,
      style: { stroke: toStreamColor(stream), strokeWidth: 2 },
    };
  });
}

type Ends = {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

function isAllowed(props: Props, connection: Ends): boolean {
  return isSameKind(
    props.ports,
    connection.source,
    connection.sourceHandle ?? "",
    connection.target,
    connection.targetHandle ?? "",
  );
}

function useFitWhenPlaced(spec: PlantSpec, layout: Layout) {
  const flow = useReactFlow();
  const isPlaced = readModules(spec).every((module) => layout[module.id] !== undefined);
  useEffect(() => {
    if (!isPlaced) return;
    const frame = requestAnimationFrame(() => {
      void flow.fitView({ padding: 0.1 });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isPlaced, flow]);
}

function FlowCanvas(props: Props) {
  const flow = useReactFlow();
  useFitWhenPlaced(props.spec, props.layout);
  return (
    <div
      className="h-[520px] min-w-0 rounded-card border border-border bg-sunken"
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        const type = event.dataTransfer.getData(moduleDragType);
        if (type === "") return;
        const at = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
        props.onDropModule(type, at.x, at.y);
      }}
    >
      <ReactFlow
        nodes={toNodes(props)}
        edges={toEdges(props)}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        isValidConnection={(connection) => isAllowed(props, connection)}
        onNodeClick={(_, node) => {
          props.onSelect(node.id);
        }}
        onPaneClick={() => {
          props.onSelect(null);
        }}
        onNodeDrag={(_, node) => {
          props.onMove(node.id, node.position.x, node.position.y);
        }}
        onNodeDragStop={(_, node) => {
          props.onMoved(node.id, node.position.x, node.position.y);
        }}
        onConnect={(connection) => {
          props.onConnect(
            `${connection.source}.${connection.sourceHandle ?? ""}`,
            `${connection.target}.${connection.targetHandle ?? ""}`,
          );
        }}
        onNodesDelete={(nodes) => {
          nodes.forEach((node) => {
            props.onRemoveModule(node.id);
          });
        }}
        onEdgesDelete={(edges) => {
          edges.forEach((edge) => {
            props.onRemoveConnection(Number(edge.id.slice(1)));
          });
        }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

/** The flowsheet canvas: drag to add, connect ports of matching streams, Delete removes the selection. */
export function Canvas(props: Props) {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
}
