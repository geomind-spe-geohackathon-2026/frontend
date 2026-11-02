import { splitPort, type PortKinds, type SpecConnection } from "./spec";

type Parents = Map<string, string>;

function find(parents: Parents, key: string): string {
  let root = key;
  for (let next = parents.get(root); next !== undefined; next = parents.get(root)) root = next;
  if (root !== key) parents.set(key, root);
  return root;
}

function join(parents: Parents, first: string, second: string): void {
  const left = find(parents, first);
  const right = find(parents, second);
  if (left !== right) parents.set(left, right);
}

function toStem(port: string): string {
  return port.replace(/_(in|out)$/, "");
}

function joinOpenPorts(parents: Parents, module: string, kinds: PortKinds): void {
  const inlets = [...kinds.inlets].filter(([, kind]) => kind === null).map(([port]) => port);
  const outlets = [...kinds.outlets].filter(([, kind]) => kind === null).map(([port]) => port);
  const isOneStream = inlets.length === 1 || outlets.length === 1;
  for (const inlet of inlets) {
    for (const outlet of outlets) {
      if (isOneStream || toStem(inlet) === toStem(outlet)) {
        join(parents, `${module}.${inlet}`, `${module}.${outlet}`);
      }
    }
  }
}

function toKnownKinds(ports: Map<string, PortKinds>, parents: Parents): Map<string, string> {
  const known = new Map<string, string>();
  for (const [module, kinds] of ports) {
    for (const [port, kind] of [...kinds.inlets, ...kinds.outlets]) {
      if (kind !== null) known.set(find(parents, `${module}.${port}`), kind);
    }
  }
  return known;
}

function declaredKind(ports: Map<string, PortKinds>, reference: string): string | null {
  const { module, port } = splitPort(reference);
  const kinds = ports.get(module);
  return kinds?.outlets.get(port) ?? kinds?.inlets.get(port) ?? null;
}

/** Finds the stream of every connection; a port that takes any stream gets it from what it is connected to, through pipes, mixers and the like. */
export function toConnectionStreams(
  connections: SpecConnection[],
  ports: Map<string, PortKinds>,
): (string | null)[] {
  const parents: Parents = new Map();
  for (const [module, kinds] of ports) joinOpenPorts(parents, module, kinds);
  for (const { source, target } of connections) {
    const isKnown = declaredKind(ports, source) !== null && declaredKind(ports, target) !== null;
    if (!isKnown) join(parents, source, target);
  }
  const known = toKnownKinds(ports, parents);
  return connections.map(
    ({ source, target }) =>
      declaredKind(ports, source) ??
      declaredKind(ports, target) ??
      known.get(find(parents, source)) ??
      null,
  );
}
