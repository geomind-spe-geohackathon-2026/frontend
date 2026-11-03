import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { PortSuggestions } from "@/shared/api/pending";
import { plantSuggestQuery } from "./api";
import type { Suggested } from "./canvas";

/** Groups the server's suggestions by module and port name, splitting each `module.port` path at its last dot. */
export function toSuggested(data: PortSuggestions | undefined): Suggested {
  const suggested: Suggested = new Map();
  for (const item of data?.suggestions ?? []) {
    const cut = item.port.lastIndexOf(".");
    if (cut <= 0) continue;
    const module = item.port.slice(0, cut);
    const ports = suggested.get(module) ?? new Map<string, "exact" | "loose">();
    ports.set(item.port.slice(cut + 1), item.match);
    suggested.set(module, ports);
  }
  return suggested;
}

/** While a pipe is drawn from a port, asks the server which ports fit it; nothing is marked when it cannot say (older gemini, unsaved module). */
export function useSuggestedPorts(projectId: string) {
  const [port, setPort] = useState<string | null>(null);
  const answer = useQuery({ ...plantSuggestQuery(projectId, port ?? ""), enabled: port !== null });
  const suggested = port === null || answer.isError ? new Map() : toSuggested(answer.data);
  return { suggested, onDragPort: setPort };
}
