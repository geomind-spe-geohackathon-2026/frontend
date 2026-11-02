import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";
import { meKey } from "@/shared/api/me";
import { session } from "@/shared/api/session";
import type { LoginRequest } from "@/shared/api/types";

/** Mutation that signs in, keeps the token pair and seeds the signed-in user in the cache. */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginRequest) =>
      toData(await api.POST("/identity/authn/login", { body: input })),
    onSuccess: (response) => {
      session.set({ accessToken: response.access_token, refreshToken: response.refresh_token });
      queryClient.setQueryData(meKey, response.user);
    },
  });
}
