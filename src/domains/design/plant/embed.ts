import { createContext, useContext } from "react";

/** Set when the plant sits inside another page: no page title, and the inspector shown in the given element. */
export type PlantEmbed = { inspector: HTMLElement | null };

export const PlantEmbedContext = createContext<PlantEmbed | null>(null);

/** The embedding of the plant, or null on its own page. */
export function usePlantEmbed(): PlantEmbed | null {
  return useContext(PlantEmbedContext);
}
