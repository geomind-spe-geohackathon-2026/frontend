import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";
import { pagedQuery } from "@/shared/api/pagination";
import type { NewUser, UserChanges } from "@/shared/api/types";

export const userKeys = {
  all: ["users"] as const,
};

/** Paged query options for the admin users list. */
export const usersQuery = () =>
  pagedQuery(userKeys.all, async (cursor, signal) =>
    toData(
      await api.GET("/identity/users", {
        params: { query: cursor === null ? {} : { cursor } },
        signal,
      }),
    ),
  );

/** Mutation that creates a user and refreshes the list. */
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewUser) =>
      toData(await api.POST("/identity/users", { body: input })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

/** Mutation that changes the role, name or active flag of one user and refreshes the list. */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; changes: UserChanges }) =>
      toData(
        await api.PATCH("/identity/users/{user_id}", {
          params: { path: { user_id: input.id } },
          body: input.changes,
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
