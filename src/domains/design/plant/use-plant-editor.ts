import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { isEqualDocument } from "@/shared/forms/document";
import { useDebouncedValue } from "@/shared/forms/use-debounced-value";
import { plantValidationQuery } from "./api";
import type { Flowsheet, Problem } from "@/shared/api/types";
import { fromLayout, type Layout } from "@/shared/api/layout";
import type { PlantSpec } from "./types";

type EditorState = { spec: PlantSpec | null; layout: Layout | null };

const validationDelayMs = 400;

/** Holds the draft of a plant: spec and layout, dirty state and the debounced server check. */
export function usePlantEditor(projectId: string, saved: Flowsheet) {
  const [state, setState] = useState<EditorState>({ spec: null, layout: null });
  const spec = state.spec ?? saved.structure;
  const layout = state.layout ?? fromLayout(saved.layout);
  const dirty = state.spec !== null && !isEqualDocument(state.spec, saved.structure);
  const settled = useDebouncedValue(spec, validationDelayMs);
  const checked = useQuery(plantValidationQuery(projectId, settled));
  const problems: Problem[] = checked.data?.problems ?? [];
  const isChecking = checked.isFetching || settled !== spec;

  const editSpec = (next: PlantSpec, nextLayout?: Layout) => {
    setState((previous) => ({
      spec: next,
      layout: nextLayout ?? previous.layout,
    }));
  };
  const setLayout = (next: Layout) => {
    setState((previous) => ({ ...previous, layout: next }));
  };
  const place = useCallback(
    (placed: Layout) => {
      setState((previous) => ({
        ...previous,
        layout: { ...(previous.layout ?? fromLayout(saved.layout)), ...placed },
      }));
    },
    [saved.layout],
  );
  const reset = () => {
    setState({ spec: null, layout: null });
  };
  const restore = (from: Flowsheet) => {
    setState({ spec: from.structure, layout: fromLayout(from.layout) });
  };
  return { spec, layout, dirty, problems, isChecking, editSpec, setLayout, place, reset, restore };
}
