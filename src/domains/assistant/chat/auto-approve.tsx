import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { api, toData } from "@/shared/api/client";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { InputGroupButton } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RunRequest } from "@/shared/sse/types";

const preferencesKey = ["assistant", "preferences"] as const;

/** The user's own auto-approve choice and whether they ever made it, stored on the server (QA-292). */
export function usePreferences() {
  const queryClient = useQueryClient();
  const stored = useQuery({
    queryKey: preferencesKey,
    queryFn: async ({ signal }) => toData(await api.GET("/assistant/preferences", { signal })),
    retry: false,
    staleTime: 60_000,
  });
  const save = useMutation({
    mutationFn: async (next: boolean) =>
      toData(await api.PUT("/assistant/preferences", { body: { auto_approve: next } })),
    onSuccess: (data) => {
      queryClient.setQueryData(preferencesKey, data);
    },
  });
  return { preferences: stored.data, save: save.mutate };
}

function toKey(chatId: string | null) {
  return ["chats", chatId ?? "new", "auto-approve"] as const;
}

/** Whether the worker approves this chat's tool calls itself, stored per chat on the server; for a chat not made yet, kept here until its first message. */
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
  const { preferences } = usePreferences();
  const [draft, setDraft] = useState<boolean | null>(null);
  const change = (next: boolean) => {
    if (chatId === null) {
      setDraft(next);
      return;
    }
    save.mutate(next);
  };
  const fresh = draft ?? preferences?.auto_approve ?? false;
  return [chatId === null ? fresh : (stored.data?.auto_approve ?? false), change];
}

/** Stores the auto-approve choice on a chat that was just made, before its first message starts a run. */
export async function saveAutoApprove(chatId: string, on: boolean): Promise<void> {
  toData(
    await api.PUT("/assistant/chat/{chat_id}/auto-approve", {
      params: { path: { chat_id: chatId } },
      body: { auto_approve: on },
    }),
  );
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
        on ? "bg-accent-soft text-accent" : "bg-transparent text-muted-foreground",
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

/** Asks, when a new chat opens, whether to turn auto-approve on, only while the user never answered (stored on the server); closing the dialog counts as no. */
export function AutoApproveAsk({
  show,
  onAnswer,
}: {
  show: boolean;
  onAnswer: (on: boolean) => void;
}) {
  const { preferences, save } = usePreferences();
  const [asked, setAsked] = useState(false);
  const answer = (on: boolean) => {
    setAsked(true);
    save(on);
    onAnswer(on);
  };
  return (
    <Dialog
      open={show && !asked && preferences?.auto_approve_set === false}
      onOpenChange={(open) => {
        if (!open) answer(false);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Turn on auto-approve for this chat?</DialogTitle>
          <DialogDescription>
            The agents' write steps then run without approval cards. You can change it later with
            the Auto-approve switch below the message box.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              answer(false);
            }}
          >
            No
          </Button>
          <Button
            onClick={() => {
              answer(true);
            }}
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
