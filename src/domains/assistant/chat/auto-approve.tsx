import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { api, toData } from "@/shared/api/client";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { InputGroupButton } from "@/components/ui/input-group";
import type { RunRequest } from "@/shared/sse/types";

function toKey(chatId: string | null) {
  return ["chats", chatId ?? "new", "auto-approve"] as const;
}

/** Whether the worker approves this chat's tool calls itself, stored per chat on the server; off for a chat not created yet. */
export function useAutoApprove(chatId: string | null): [boolean, (on: boolean) => void] {
  const queryClient = useQueryClient();
  const stored = useQuery({
    queryKey: toKey(chatId),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/assistant/chat/{chat_id}/auto-approve", {
          params: { path: { chat_id: chatId ?? "" } },
          signal,
        }),
      ),
    enabled: chatId !== null,
  });
  const save = useMutation({
    mutationFn: async (next: boolean) =>
      toData(
        await api.PUT("/assistant/chat/{chat_id}/auto-approve", {
          params: { path: { chat_id: chatId ?? "" } },
          body: { auto_approve: next },
        }),
      ),
    onMutate: (next) => {
      queryClient.setQueryData(toKey(chatId), { auto_approve: next });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: toKey(chatId) }),
  });
  const change = (next: boolean) => {
    if (chatId === null) return;
    save.mutate(next);
  };
  return [stored.data?.auto_approve ?? false, change];
}

/** Approves an approval request once, as soon as it shows, while auto-approve is on; questions still wait for the user. */
export function useApproveByItself(
  on: boolean,
  request: RunRequest | null,
  approve: (request: string) => void,
): void {
  const answered = useRef<string | null>(null);
  useEffect(() => {
    if (!on || request?.kind !== "approval" || answered.current === request.request) return;
    answered.current = request.request;
    approve(request.request);
  }, [on, request, approve]);
}

/** The switch next to the usage ring: on, the assistant's tool calls are approved without asking. */
export function AutoApproveButton({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  const title = on
    ? "Auto-approve is on for this chat: tool calls run without asking, also with the tab closed. A run already waiting picks it up when it goes on."
    : "Ask before tool calls run. Turn on to let this chat's runs approve tool calls by themselves.";
  return (
    <InputGroupButton
      size="sm"
      aria-pressed={on}
      title={title}
      className={cn(
        "gap-1 rounded-full text-[12px]",
        on ? "text-primary" : "text-muted-foreground",
      )}
      onClick={() => {
        onChange(!on);
      }}
    >
      <ShieldCheck aria-hidden="true" />
      Auto-approve
    </InputGroupButton>
  );
}
