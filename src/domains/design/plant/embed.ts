import { createContext, useContext } from "react";

/** Set when the plant sits inside another page: no page title, the inspector shown in the given element, and modules to outline as changed. */
export type PlantEmbed = { inspector: HTMLElement | null; changed?: Set<string> | undefined };

export const PlantEmbedContext = createContext<PlantEmbed | null>(null);

/** The embedding of the plant, or null on its own page. */
export function usePlantEmbed(): PlantEmbed | null {
  return useContext(PlantEmbedContext);
}
