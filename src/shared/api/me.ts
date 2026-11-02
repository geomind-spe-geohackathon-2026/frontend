import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { api, toData } from "./client";
import { session } from "./session";

export const meKey = ["me"] as const;

/** Query options for the signed-in user. */
export const meQuery = () =>
  queryOptions({
    queryKey: meKey,
    queryFn: async ({ signal }) => toData(await api.GET("/identity/me", { signal })),
    staleTime: 5 * 60_000,
  });

/** Ends the session: tells the server, forgets the tokens and empties the cache. */
export async function signOut(queryClient: QueryClient): Promise<void> {
  try {
    await api.POST("/identity/authn/logout");
  } finally {
    session.clear();
    queryClient.clear();
  }
}
