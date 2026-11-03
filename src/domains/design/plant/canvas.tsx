import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useRef, useState, type DragEvent, type RefObject } from "react";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { toAutoLayout, toNodeSize, toStartViewport } from "@/shared/plant/auto-layout";
import { toGroupFrames } from "@/shared/plant/groups";
import { GroupFrameNode, ModuleNode, type GroupFlowNode, type ModuleFlowNode } from "./module-node";
import { StreamLegend } from "./stream-legend";
import {
  toLegendStreams,
  toStreamColor,
  toStreamDash,
  unknownStream,
} from "@/shared/plant/stream-colors";
import { isSameKind, splitPort, type PortKinds } from "@/shared/plant/spec";
import type { Palette } from "@/shared/api/types";
import type { Layout } from "@/shared/api/layout";
import type { PlantGraph } from "./use-auto-layout";

export const moduleDragType = "application/x-plant-module";

const nodeTypes = { module: ModuleNode, frame: GroupFrameNode };

const readableZoom = 0.8;
const largestStartZoom = 1;
const startMargin = 16;
const fanWidth = 1.25;
const fanOpacity = 0.55;
const overviewZoom = 0.2;
const fitPadding = 0.04;
const fitFloor = 0.3;
const framePrefix = "frame:";

export type Issues = Map<string, "missing" | "invalid">;

/** Ports that fit the port being dragged, by module id then port name. */
export type Suggested = Map<string, Map<string, "exact" | "loose">>;

const noSuggestions = new Map<string, "exact" | "loose">();

type Props = {
  graph: PlantGraph;
  layout: Layout;
  palette: Palette[];
  issues: Issues;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onMoved: (id: string, x: number, y: number) => void;
  onArrange: (layout: Layout) => void;
  onConnect: (source: string, target: string) => void;
  onRemoveModule: (id: string) => void;
  onRemoveConnection: (index: number) => void;
  onDropModule: (type: string, x: number, y: number) => void;
  suggested: Suggested;
  onDragPort: (port: string | null) => void;
};

function toModuleNodes(props: Props): ModuleFlowNode[] {
  const empty: PortKinds = { inlets: new Map(), outlets: new Map() };
  const { modules, ports } = props.graph;
  return modules.map((module) => ({
    id: module.id,
    type: "module",
    position: props.layout[module.id] ?? { x: 0, y: 0 },
    selected: module.id === props.selected,
    ...toNodeSize(ports.get(module.id)),
    data: {
      title: props.palette.find((item) => item.type === module.type)?.title ?? module.type,
      moduleId: module.id,
      category: props.palette.find((item) => item.type === module.type)?.category ?? "",
      ports: ports.get(module.id) ?? empty,
      issue: props.issues.get(module.id) ?? "none",
      suggested: props.suggested.get(module.id) ?? noSuggestions,
    },
  }));
}

function toFrameNodes(props: Props): GroupFlowNode[] {
  const { groups, ports } = props.graph;
  return toGroupFrames(groups, props.layout, (id) => toNodeSize(ports.get(id))).map((frame) => ({
    id: `${framePrefix}${frame.group}`,
    type: "frame",
    position: { x: frame.x, y: frame.y },
    width: frame.width,
    height: frame.height,
    data: { label: frame.label },
    draggable: false,
    selectable: false,
    connectable: false,
    focusable: false,
    deletable: false,
    zIndex: -1,
    style: { pointerEvents: "none" },
  }));
}

function toEdges(props: Props, hidden: Set<string>): Edge[] {
  const { connections, streams, fans } = props.graph;
  const { selected } = props;
  return connections.map((connection, index) => {
    const from = splitPort(connection.source);
    const to = splitPort(connection.target);
    const stream = streams[index] ?? null;
    const isNear = selected === null || from.module === selected || to.module === selected;
    const color = toStreamColor(stream);
    const isFan = fans.has(index);
    const isLit = selected !== null && isNear;
    const quiet = isFan ? fanOpacity : 1;
    return {
      id: `c${String(index)}`,
      source: from.module,
      sourceHandle: from.port,
      target: to.module,
      targetHandle: to.port,
      type: "smoothstep",
      hidden: hidden.has(stream ?? unknownStream),
      ariaLabel: `${connection.source} to ${connection.target}${stream === null ? "" : `, ${stream}`}`,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
        width: 14,
        height: 14,
        markerUnits: "userSpaceOnUse",
      },
      style: {
        stroke: color,
        strokeWidth: isLit ? 3 : isFan ? fanWidth : 2,
        strokeDasharray: toStreamDash(stream),
        opacity: isLit ? 1 : isNear ? quiet : 0.15,
      },
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
  if (connection.source === connection.target) return false;
  return isSameKind(
    props.graph.ports,
    connection.source,
    connection.sourceHandle ?? "",
    connection.target,
    connection.targetHandle ?? "",
  );
}

function fitToStart(flow: ReactFlowInstance, element: HTMLDivElement | null) {
  const nodes = flow.getNodes();
  if (element === null || nodes.length === 0) return;
  const size = { width: element.clientWidth, height: element.clientHeight };
  if (size.width === 0 || size.height === 0) return;
  const bounds = flow.getNodesBounds(nodes);
  const first = nodes.find((node) => node.id.startsWith(framePrefix));
  const limits = { minimum: readableZoom, maximum: largestStartZoom, margin: startMargin };
  const anchor = first === undefined ? bounds : flow.getNodesBounds([first]);
  void flow.setViewport(toStartViewport(bounds, size, limits, anchor));
}

function useFitWhenPlaced(
  graph: PlantGraph,
  layout: Layout,
  view: RefObject<HTMLDivElement | null>,
) {
  const flow = useReactFlow();
  const isPlaced = graph.modules.every((module) => layout[module.id] !== undefined);
  useEffect(() => {
    if (!isPlaced) return;
    const frame = requestAnimationFrame(() => {
      fitToStart(flow, view.current);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isPlaced, flow, view]);
}

function useHiddenStreams() {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (stream: string) => {
    setHidden((previous) => {
      const next = new Set(previous);
      if (!next.delete(stream)) next.add(stream);
      return next;
    });
  };
  return { hidden, toggle };
}

function ArrangeButton({
  graph,
  onArrange,
  view,
}: Pick<Props, "graph" | "onArrange"> & { view: RefObject<HTMLDivElement | null> }) {
  const flow = useReactFlow();
  const arrange = async () => {
    const { modules, connections, ports, groups } = graph;
    onArrange(await toAutoLayout(modules, connections, ports, groups));
    requestAnimationFrame(() => {
      fitToStart(flow, view.current);
    });
  };
  return (
    <Button
      onClick={() => {
        void arrange();
      }}
    >
      Arrange
    </Button>
  );
}

function CanvasMap() {
  return (
    <MiniMap
      pannable
      zoomable
      className="hidden min-[1400px]:block"
      style={{ width: 150, height: 96, backgroundColor: "var(--surface)" }}
      maskColor="color-mix(in srgb, var(--sunken) 70%, transparent)"
      maskStrokeColor="var(--border)"
      nodeColor={(node) => (node.type === "frame" ? "transparent" : "var(--muted)")}
      nodeStrokeColor="transparent"
    />
  );
}

function toFlowHandlers(props: Props) {
  return {
    onNodeClick: (_: unknown, node: { id: string }) => {
      props.onSelect(node.id);
    },
    onPaneClick: () => {
      props.onSelect(null);
    },
    onNodeDrag: (_: unknown, node: ModuleFlowNode | GroupFlowNode) => {
      props.onMove(node.id, node.position.x, node.position.y);
    },
    onNodeDragStop: (_: unknown, node: ModuleFlowNode | GroupFlowNode) => {
      props.onMoved(node.id, node.position.x, node.position.y);
    },
    onConnectStart: (_: unknown, start: { nodeId: string | null; handleId: string | null }) => {
      props.onDragPort(
        start.nodeId === null || start.handleId === null
          ? null
          : `${start.nodeId}.${start.handleId}`,
      );
    },
    onConnectEnd: () => {
      props.onDragPort(null);
    },
    onConnect: (connection: Connection) => {
      props.onConnect(
        `${connection.source}.${connection.sourceHandle ?? ""}`,
        `${connection.target}.${connection.targetHandle ?? ""}`,
      );
    },
    onNodesDelete: (nodes: { id: string }[]) => {
      nodes.forEach((node) => {
        props.onRemoveModule(node.id);
      });
    },
    onEdgesDelete: (edges: { id: string }[]) => {
      edges.forEach((edge) => {
        props.onRemoveConnection(Number(edge.id.slice(1)));
      });
    },
  };
}

function FlowCanvas(props: Props) {
  const flow = useReactFlow();
  const { hidden, toggle } = useHiddenStreams();
  const legend = useMemo(() => toLegendStreams(props.graph.streams), [props.graph.streams]);
  const view = useRef<HTMLDivElement>(null);
  useFitWhenPlaced(props.graph, props.layout, view);
  const handleDrop = (event: DragEvent) => {
    const type = event.dataTransfer.getData(moduleDragType);
    if (type === "") return;
    const at = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    props.onDropModule(type, at.x, at.y);
  };
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div
        ref={view}
        className="h-[max(380px,50vh)] min-w-0 overflow-hidden rounded-card border border-border bg-sunken"
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={handleDrop}
      >
        <ReactFlow<ModuleFlowNode | GroupFlowNode>
          nodes={[...toFrameNodes(props), ...toModuleNodes(props)]}
          edges={toEdges(props, hidden)}
          nodeTypes={nodeTypes}
          fitViewOptions={{ padding: fitPadding, minZoom: fitFloor }}
          className="plant-flow"
          proOptions={{ hideAttribution: true }}
          minZoom={overviewZoom}
          isValidConnection={(connection) => isAllowed(props, connection)}
          {...toFlowHandlers(props)}
        >
          <Background />
          <Controls position="top-left" showInteractive={false} />
          <CanvasMap />
          <Panel position="top-right">
            <ArrangeButton graph={props.graph} onArrange={props.onArrange} view={view} />
          </Panel>
        </ReactFlow>
      </div>
      <StreamLegend streams={legend} hidden={hidden} onToggle={toggle} />
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
