import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { session } from "@/shared/api/session";
import { showToast } from "@/shared/ui/toast";
import type { PasswordChange } from "./types";

/** Mutation that changes the password; the backend revokes every token, so the session ends here too. */
export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PasswordChange) => {
      await api.POST("/identity/me/password", { body: input });
    },
    onSuccess: () => {
      showToast("Password changed. Please sign in again.");
      session.clear();
      queryClient.clear();
    },
  });
}
