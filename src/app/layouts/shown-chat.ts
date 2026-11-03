import { createContext, useContext } from "react";

export type ShownChat = {
  chatId: string | null;
  sidePage: boolean;
};

export const ShownChatContext = createContext<ShownChat>({ chatId: null, sidePage: false });

/** The chat shown in the main panel and whether a side page is open. */
export function useShownChat(): ShownChat {
  return useContext(ShownChatContext);
}
