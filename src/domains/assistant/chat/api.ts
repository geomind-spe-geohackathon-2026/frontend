import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";
import type { Answer } from "@/shared/sse/contract";
import { toAllItems } from "@/shared/sse/chats";

export const chatKeys = {
  all: (projectId: string) => ["projects", projectId, "chats"] as const,
  messages: (projectId: string, chatId: string) =>
    [...chatKeys.all(projectId), "messages", chatId] as const,
  state: (projectId: string, chatId: string) =>
    [...chatKeys.all(projectId), "state", chatId] as const,
};

const runsKey = (projectId: string) => ["projects", projectId, "runs"] as const;

/** Query options for the messages of a chat, oldest first. */
export const messagesQuery = (projectId: string, chatId: string) =>
  queryOptions({
    queryKey: chatKeys.messages(projectId, chatId),
    queryFn: ({ signal }) =>
      toAllItems(async (cursor) =>
        toData(
          await api.GET("/assistant/chat/{id}/messages", {
            params: { path: { id: chatId }, query: cursor === undefined ? {} : { cursor } },
            signal,
          }),
        ),
      ),
  });

/** Query options for the full problem state of a chat. */
export const problemQuery = (projectId: string, chatId: string) =>
  queryOptions({
    queryKey: chatKeys.state(projectId, chatId),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/assistant/chat/{id}/state", { params: { path: { id: chatId } }, signal }),
      ),
  });

/** Query options for one run of a project. */
export const runQuery = (projectId: string, runId: string) =>
  queryOptions({
    queryKey: [...runsKey(projectId), "detail", runId],
    queryFn: async ({ signal }) =>
      toData(await api.GET("/assistant/runs/{id}", { params: { path: { id: runId } }, signal })),
  });

/** Mutation that creates a chat. */
export function useCreateChat(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title?: string }) =>
      toData(
        await api.POST("/assistant/chat", {
          body: {
            project: projectId,
            ...(input.title === undefined ? {} : { title: input.title }),
          },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.all(projectId) }),
  });
}

/** Mutation that sends a message to a chat; the answer carries the run that was started. */
export function useSendMessage(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { chatId: string; content: string }) =>
      toData(
        await api.POST("/assistant/chat/{id}/messages", {
          params: { path: { id: input.chatId } },
          body: { content: input.content },
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chatKeys.all(projectId) });
      await queryClient.invalidateQueries({ queryKey: runsKey(projectId) });
    },
  });
}

/** Mutation that renames a chat. */
export function useRenameChat(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { chatId: string; title: string }) =>
      toData(
        await api.PATCH("/assistant/chat/{id}", {
          params: { path: { id: input.chatId } },
          body: { title: input.title },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.all(projectId) }),
  });
}

/** Mutation that deletes a chat; the server answers 409 while a run of the chat is active. */
export function useDeleteChat(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chatId: string) => {
      await api.DELETE("/assistant/chat/{id}", { params: { path: { id: chatId } } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.all(projectId) }),
  });
}

/** Mutation that answers the pending request of a waiting run. */
export function useAnswerRun(projectId: string, runId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { request: string; answer: Answer }) =>
      toData(
        await api.POST("/assistant/runs/{id}/answer", {
          params: { path: { id: runId } },
          body: input,
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: runsKey(projectId) }),
  });
}

/** Mutation that cancels a run. */
export function useCancelRun(projectId: string, runId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      toData(await api.POST("/assistant/runs/{id}/cancel", { params: { path: { id: runId } } })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: runsKey(projectId) });
      await queryClient.invalidateQueries({ queryKey: chatKeys.all(projectId) });
    },
  });
}
